const express = require("express")
const app = express()
const Player = require("./Classes/Player").Player
const Room = require("./Classes/Room").Room
const Validate = require("./Classes/Validate").Validate
const WebSocketServer = require("ws").Server
const wss = new WebSocketServer({port: 8090})
const WS = require("./Classes/Websocket").Websocket

let valid = new Validate()

app.get('/', function (req, res) {
    res.send("Ludo Multiplayer! Go to Register to start the game.")
})

app.get('/register/:username', function (req, res) {
    res.setHeader('Content-Type', 'application/json')
    
    //BEBUG
    // let playerId = parseInt(Math.random() * 1000000)
    let playerId = 5485835
    //

    if (valid.validateString(req.params["username"], 5, 20)) {
        let player = new Player(playerId, req.params["username"])
        res.write(JSON.stringify({
            result: true,
            player: player
        }))
        // Player should be inserted into DB
        
    } else {
        res.write(JSON.stringify({
            result: false
        }))
    }
    
    res.end()
})

wss.on("connection", function(ws, req, client){
    
    let socket = new WS(ws)
        
    ws.on("open", socket.open())
    // ws.on("message", () => socket.message(message))
    // ws.open()
    
})

app.listen(8080)