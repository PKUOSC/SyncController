const yargs = require("yargs")
const fs = require("fs")

const default_config = {
    'mirrors': [],
    'concurrency': 2,
    'log_dir': '/data/log/sync/',
    'repo_dir': '/data/repos/',
    'rsync': {
        'command': 'rsync -avHh --delete --delete-after --delay-updates --safe-links --stats --no-o --no-g'
    },
    'mysql': {
        host: '',
        user: '',
        password: '',
        database: '',
    },
    'port':3000
}

module.exports = (function() {
    var conf_path = yargs(process.argv.slice(2))
        .option('conf', {'alias':'c','type':'string'})
        .argv.conf || './config.json'
    if(fs.existsSync(conf_path)) {
        console.log(`Loading configuration from '${conf_path}'...`)
        return Object.assign(default_config, JSON.parse(fs.readFileSync(conf_path)))
    } else {
        console.warn(`Configuration file '${conf_path}' doesn't exist. Abort.`)
        process.exit(1)
    }
})()