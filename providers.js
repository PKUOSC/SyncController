const { rsync, log_dir } = require('./config')
const path = require('path')
const db = require('./db')
const fs = require('fs')

/*
 * each provider is like
 *         (params,id) => {return {args: [], after: (err)=>{...}}}
 * you can use the after hook to provide the `diskUsage` info
 */

module.exports = {
    'rsync': (params,id) => {
        args = [rsync.command]

        if(params.hasOwnProperty('exclude')) {
            args.push(`--exclude=${params.exclude}`)
        }
        if(params.hasOwnProperty('bwlimit')) {
            args.push(`--bwlimit=${params.bwlimit}`)
        }
        
        args.push(params.url)
        args.push(params.dest || `${path.join(config.repo_dir,id)}`)

        return { args, after: async (err) => {
            if(!err) {
                out = fs.readFileSync(await db.get('logPath',id))
                db.set('diskUsage',(/Total file size: (.*) bytes/).exec(out)[1],id)
            }
        }}
    },
    'shell': (params,id) => {
        args = [params.cmd]
        return { args }
    }
}
