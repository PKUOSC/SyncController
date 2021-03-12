const fs = require('fs');
const path = require('path')
const queue = require('async').queue;
const express = require('express');
const dateformat = require('dateformat');
const nocache = require('nocache');
const schedule = require('node-schedule');
const events = require('events');
const child_process = require('child_process');

var config = require('./config.js');
var status_path = path.join(config.base_dir,'status.json')
var status = fs.existsSync(status_path) ? require('./status.json') : {};
var scheds = {}

function getDefaultLogPath(id) {
    fs.mkdirSync(path.join(config.log_dir,id),{recursive: true})
    return path.join(config.log_dir,id,`${dateformat(new Date(),"yyyy-mm-dd-hh-mm-ss")}.log`);
}

var providers = {
    'rsync': (params,id) => {
        args = [ config.rsync.command ]

        if(params.hasOwnProperty('exclude')) {
            args.push(`--exclude=${params.exclude}`)
        }
        if(params.hasOwnProperty('bwlimit')) {
            args.push(`--bwlimit=${params.bwlimit}`)
        }
        args.push(params.url)
        args.push(params.dest || `${path.join(config.repo_dir,id)}`)

        args.push('2>&1')

        logpath = getDefaultLogPath(id)
        args.push(`> ${logpath} 2>&1`)

        return new Promise((resolve) => {
            child_process.exec(args.join(' '), function(err, stdout, stderr) {
                out=fs.readFileSync(logpath).toString()
                if(!err)
                    status[id].diskUsage = (/Total file size: (.*) bytes/).exec(out)[1]
                resolve(err)
            })
        })
    },
    'shell': (params,id) => {
        args = [params.cmd, '2>&1']
        return new Promise((resolve) => {
            child_process.exec(args.join(' '), function(err, stdout,stderr) {
                fs.writeFileSync(getDefaultLogPath(id),stdout,(error)=>{
                    if(error)
                        console.log(`An error occured while writing log of ${id}`,error)
                })
                resolve(err)
            })
        })
    }
}

function writeJson(v, file) {
    fs.writeFileSync(file, JSON.stringify(v))
}

function jobWrapper(run_queue, job) {
    return function() {
        run_queue.push({run: async (callback) => {
            console.log(`running: ${job.id}`)
            status[job.id].nextSyncTime = scheds[job.id].nextInvocation().getTime();
            status[job.id].state = 'sync'
            ret = await providers[job.provider](job.params,job.id);
            if(ret) status[job.id].state = 'error'
            else {
                status[job.id].state = 'done'
                status[job.id].lastSyncTime = Date.now();
            }
            writeJson(status, status_path)
            console.log(`${job.id} done`)
            callback();
        }}, ()=>{})
    }
}

function SchedRunner() {
    run_queue = queue((job,next)=>{job.run(next)}, config.concurrency)

    for (var i in config.mirrors) {
        t = config.mirrors[i]

        status[t.id] = Object.assign({
            'state': 'done',
            'lastSyncTime': 0,
            'nextSyncTime': 0,
            'diskUsage': null
        }, status[t.id])

        if(status[t.id] === 'sync') {
            status[t.id] = 'error'
        }

        console.log(`added mirror job ${t.id}`)
        scheds[t.id] = schedule.scheduleJob(t.schedule,jobWrapper(run_queue, t))

        status[t.id]['nextSyncTime'] = scheds[t.id].nextInvocation().getTime()
    }
}

function Server() {
    const app=express()
    app.route('/stat').all(nocache()).get(
        async (req,res) => {res.json(status)}
    )
    app.route('/config').all(nocache()).get(
        async (req,res) => {res.json(config)}
    )
    app.listen(config.port, () => {
        console.log(`SyncMaster listening on port ${config.port}`)
    })
}

(()=>{
    process.on('SIGINT',() => {
        writeJson(status,status_path)
        process.exit()
    })
    console.log('running sync backend....')
    console.log(config)
    SchedRunner()
    Server()
})()