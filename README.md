## Overview

This repo provides simple sync job control.

## Database

Default database name: `mirrors`

Columns:

* `index`: index, primary key
* `id`: name of the mirror, also unique indentifier
* `state`: state of the mirror, in `{'error','sync','done'}`
* `lastSyncTime`: timestamp (in milliseconds) of last sync
* `nextSyncTime`: timestamp (in milliseconds) of next sync
* `diskUsage`: disk usage in string form
* `logPath`: where the lastest logfile is

to create table:

```sql
CREATE TABLE `status`(
    `index` INT UNSIGNED AUTO_INCREMENT ,
    `id` VARCHAR(50) NOT NULL,
    `state` VARCHAR(20) NOT NULL,
    `lastSyncTime` BIGINT UNSIGNED DEFAULT 0,
    `nextSyncTime` BIGINT UNSIGNED DEFAULT 0,
    `diskUsage` VARCHAR(30) DEFAULT '',
    `logPath` VARCHAR(100) DEFAULT '',
    PRIMARY KEY (`index`) ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
```

## RESTful API

* `GET /status` 
    
    returns current status in JSON

    an example of response:
    ```
    [
        {
            "id": "manjaro",
            "state": "done",
            "lastSyncTime":1615911140966,
            "nextSyncTime":1615997400000,
            "diskUsage":"100.43G"
        }
    ]
    ```

**CAUTION**: Following APIs should be accessed by **admin** only.

* `GET /stop/$id`
    
    stop the job with id=`$id`

    returns a JSON

    ```
    // success
    {"status":"ok"}

    // failure
    {"status":"failed","reason":"?"}
    ```

* `GET /start/$id`

    start the job with id=`$id`

    returns a JSON

    ```
    // success
    {"status":"ok"}

    // failure
    {"status":"failed","reason":"?"}
    ```

* `GET /log/$id`

    return the job's latest log

## Configuration

Configuration file is `./config.json` by default. You can assign custom configuration path by adding `-c <path>` in command-line.

Here is an example of full configuration
```json
{
    "mirrors": [
        {  
            "id": "manjaro",
            "schedule": "10 0 * * *",
            "provider": "rsync",
            "params": {
                "url": "rsync://mirror.yandex.ru/mirrors/manjaro/"
            },
            "metadata": {
                "name": "Manjaro",
                "url": "/manjaro/"
            },
            "file-custom": [
                "alias /abc/def/;"
            ]
        },
        {  
            "id": "opensuse",
            "schedule": "0 */8 * * *",
            "provider": "rsync",
            "params": {
                "url": "rsync://fr2.rpmfind.net/linux/opensuse/",
                "exclude": "{history,ports,source}",
                "dest": "/data-tmp/opensuse"
            }
        },
        {
            "id": "custom",
            "schedule": "10 0 * * *",
            "provider": "shell",
            "params": {
                "cmd": "node ./update_custom.js"
            }
        }
    ],
    "concurrency": 2,
    "log_dir": "/data/log/sync/",
    "repo_dir": "/data/repos/",
    "rsync": {
        "command": "rsync -avHh --delete --delete-after --delay-updates --safe-links --stats --no-o --no-g"
    },
    "mysql": {
        "host": "127.0.0.1",
        "user": "sync",
        "password": "123456",
        "database": "sync"
    },
    "port":3000
}
```

Attention: `metadata` in a mirror is used to render mirror list.

here is an example:

```
"metadata": {
    "url": "/ubuntu/",
    "name": "Ubuntu",
    "help": "Ubuntu",
    "describe": "A Ubuntu mirror"
}
```

The `describe` will show when your mouse hover on the link.

The `help` should satisfy the requirement in website/src/components/help/`Ubuntu`.vue currently

Be aware:

* `mirrors` stores the list of sync jobs, in which `schedule` is a cron-style string indicating frequency ([more info](https://github.com/node-schedule/node-schedule)). We implemented two providers, `rsync` and `shell`, you can use them as the way shown above.
* `mysql` stores the database connection params. See [mysql](https://www.npmjs.com/package/mysql) for more info.
* `concurrency` limits the max concurrency of run_queue.

## How to use

Typical way:

1. clone the repo
2. modify the configuration
3. `node index.js`

You can assign configuration file by `node index.js -c <path>` or `node index.js --conf <path>`.

We also provides systemd service.

**Remember to modify `WorkingDirectory` & `ExecStart` in `backend.service` to correct path before use**

```
# cp backend.service /etc/systemd/system
# systemctl start backend.service
```

## TODO

- [x] manual kill
- [x] manual start sync job
- [x] status + disk usage (of *** job)
- [ ] hot reload config (get/update)
- [ ] restart(kill all running job & restart)
- [x] rsync provider
- [ ] add dynamic proxy function => tip: use nginx_http_dyups_module in nginx and dynamicly change upstream
- [ ] may need a slave sync controller run on the second machine to avoid sync the same mirror at a same time
