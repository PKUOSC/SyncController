# SyncController

## Structure Overview

node-schedule for scheduled job
async.queue for concurrency limit

(1) on schedule, add the job to run_queue

(2) rest API

/stat
    each job: {
        state: 'sync','done','error-*'
        lastSyncTime:
        nextSyncTime:
        diskUsage
    }

/config
    config

/updateConfig POST updateConfig

/restart
    
# TODO

* manual kill
* manual start sync job
* status + disk usage (of *** job)
* config (get/update)
* restart(kill all running job & restart)
* rsync 