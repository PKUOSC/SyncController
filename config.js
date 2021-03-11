const default_config = {
    'mirrors': [],
    'concurrency': 2,
    'log_dir': '/data/log/sync/',
    'repo_dir': '/data/repos/',
    'rsync': {
        'command': 'rsync -avHh --delete --delete-after --delay-updates --safe-links --stats --no-o --no-g'
    },
    'port':3000
}

module.exports = (function(){
    return Object.assign(default_config,require('./config.json'))
})()