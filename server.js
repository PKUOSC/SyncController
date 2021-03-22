const express = require("express");
const {port} = require("./config");
const controller = require("./controller");
const nocache = require("nocache");
const db = require("./db");

module.exports = () => {
    const app = express();
    app.route('/mirrors').all(nocache()).get(
    	async (req,res) => {res.json(controller.static_mirror_list)}
    )

    app.route('/status').all(nocache()).get(
        async (req,res) => {res.json(await db.getStatus())}
    )

    app.route('/stop/:id').all(nocache()).get(
        async (req,res) => {
            controller.stop(req.params.id)
            .then(()=>{res.json({"status":"ok"})})
        }
    )

    app.route('/start/:id').all(nocache()).get(
        async (req,res) => {
            controller.start(req.params.id)
            .then(()=>{res.json({"status":"ok"})})
        }
    )

    app.route('/log/:id').all(nocache()).get(
        async (req,res) => {
            res.sendFile(await db.get('logPath',req.params.id))
        }
    )

    app.listen(port, () => {
        console.log(`Sync Master listening on ${port}`)
    })
}
