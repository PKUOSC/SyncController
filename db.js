const mysql = require("mysql");
const config = require("./config");

function pack(value) {
    if(typeof(value) == 'string')
        return `'${value}'`
    else
        return value
}

class DB {
    constructor(table_name) {
        this.connection = mysql.createConnection(config.mysql)
        this.table_name = table_name
    }

    query(sql) {
        return new Promise((resolve,reject) => {
            this.connection.query(sql, (err,res,fields) => {
                if(err)
                    reject(err)
                resolve(res)
            })
        });
    }

    set(key,val,id) {
        return this.query(`UPDATE ${this.table_name} SET ${key}=${pack(val)} WHERE id='${id}';`)
    }

    get(key,id) {
        return this.query(`SELECT ${key} FROM ${this.table_name} WHERE id='${id}';`)
            .then((ret) => {return ret[0][key]})
    }

    insert(id) {
        return this.query(`INSERT INTO ${this.table_name} VALUES (0,'${id}','done',DEFAULT,DEFAULT,DEFAULT,DEFAULT);`)
    }

    getStatus() {
        return this.query(`SELECT id,state,lastSyncTime,nextSyncTime,diskUsage FROM ${this.table_name};`)
    }

    exists(id) {
        return this.query(`SELECT 1 FROM ${this.table_name} WHERE id='${id}';`)
            .then((res) => {return res.length});
    }
}

module.exports = new DB('status')