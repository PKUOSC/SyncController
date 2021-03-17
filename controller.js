const child_process = require("child_process")
const fs = require('fs')
const path = require('path')
const dateformat = require('dateformat')
const schedule = require("node-schedule")
const db = require('./db')
const providers = require('./providers')
const config = require("./config")
const queue = require("async").queue;

function getLogPath(id) {
    fs.mkdirSync(path.join(config.log_dir,id),{recursive:true})
    return path.join(config.log_dir,id,
        `${dateformat(new Date(),'yyyy-mm-dd-HH-MM-ss')}.log`)
}

function placeholder() {}

class Controller {
    constructor() {
        this.timeout = 3000
        this.jobs = {}
        this.run_queue = queue(
            (fun,next)=>{fun(next)},
            config.concurrency);

        for (var i in config.mirrors) {
            // init database entry
            var t = config.mirrors[i]

            
            console.log(`adding job ${t.id}`);

            (async (id)=>{
                if(await db.exists(id)) {
                    if(await db.get('state',id)==='sync') {
                        db.set('state','error',id)
                    }
                } else {
                    db.insert(id)
                }
            })(t.id);

            this.jobs[t.id] = providers[t.provider](t.params,t.id)
            this.jobs[t.id]['sched'] = schedule.scheduleJob(
                t.schedule,
                ((id)=>{return () => {this.start(id);}})(t.id));
        
        }
    }

    exec(args, logPath, id) {
        var job = this.jobs[id]

        return new Promise((resolve,reject) => {
            var logStream = fs.createWriteStream(logPath , {flags: 'a'});
            job['proc'] = child_process.exec(
                args.join(' '),{maxBuffer: 100*1024*1024},(err,stdout,stderr) => {job['proc'] = undefined; resolve(err)}
            )
            job['proc'].stdout.on('data',(data) => {
                logStream.write(data)
            })
            job['proc'].stderr.on('data',(data) => {
                logStream.write(data)
            })
        })
    }

    async start(id) {
        if(await db.get('state',id) !== 'sync') {
            this.run_queue.push(async (callback) => {
                console.log(`running job ${id}`)
                
                var logPath = getLogPath(id)
                var job = this.jobs[id]

                db.set('nextSyncTime',
                job.sched.nextInvocation().getTime(),id)
                db.set('state','sync',id)
                db.set('logPath',logPath,id)

                this.exec(job.args,logPath,id)
                    .then((err)=>{
                        console.log(`job ${id} done with exit msg '${err}'`)
                        if(!err)
                            db.set('lastSyncTime',new Date().getTime(),id)
                        db.set('state',err?'error':'done',id);
                        (job.after || placeholder)(err)   
                    }).then(callback)
            })
        }
    }
    async stop(id) {
        if(await db.get('state',id) === 'sync') {
            var job = this.jobs[id]
            if(job.proc) {
                job.proc.kill('SIGTERM')
                setTimeout(()=>{
                    if(job.proc)
                        job.proc.kill('SIGKILL')
                },this.timeout)
            }
        }
    }
}

module.exports = new Controller()