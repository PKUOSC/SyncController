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
    'rsync': (repo_params,id,provider_all_params) => {
        args = [rsync.command]

        if (provider_all_params=="") {
	    var params = repo_params;
            args.push(params.url);
	} else {
            var params = provider_all_params;
	    args.push(params.url+"/"+id + "/")
	}
        if(params.hasOwnProperty('exclude')) {
            args.push(`--exclude=${params.exclude}`)
        }
        if(params.hasOwnProperty('bwlimit')) {
            args.push(`--bwlimit=${params.bwlimit}`)
        }
        
        //args.push(params.url)
        args.push(repo_params.dest || `${path.join(config.repo_dir,id)}`)

        return { args, after: async (err) => {
            if(!err) {
                out = fs.readFileSync(await db.get('logPath',id))
                db.set('diskUsage',(/Total file size: (.*) bytes/).exec(out)[1],id)
            }
        }}
    },
    'shell': (repo_params,id,provider_all_params) => {
        args = [repo_params.cmd]
        return { args }
    }
}
