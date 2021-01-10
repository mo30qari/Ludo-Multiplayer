const http = require("http")
const express = require("express")
const app = express()
const player = require("./Player")
const room = require("./Room")
//const handler = require("./Handler")

app.get('/', function(req, res){
    console.log("i'm ready!")
})

app.get('/register/:username', function(req, res){
    res.send(req.params)
})

app.listen(8080)