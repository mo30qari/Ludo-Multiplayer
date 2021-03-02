const express = require("express")
const app = express()
const Player = require("./obj/Player").Player
const Room = require("./obj/Room").Room
const Validate = require("./obj/Validate").Validate
const WebSocketServer = require("ws").Server
const wss = new WebSocketServer({port: 8090})
const WS = require("./obj/Websocket").Websocket

let valid = new Validate()

app.get('/', function (req, res) {
	res.send("Ludo Multiplayer! Go to Register to start the game.")
})

app.get('/register/:username', function (req, res) {
	res.setHeader('Access-Control-Allow-Origin', 'https://preview.construct.net')
	res.setHeader('Content-Type', 'application/json')

	let result = valid.validateString(req.params["username"], 3, 10)

	if (result.status) {
		let player = new Player(undefined)

		res.write(JSON.stringify({
			status: true,
			Player: {
				PlayerID: player.id,
				Avatar: player.avatar
			}
		}))

		player.setBasicProperty("name", req.params["username"])

	} else {
		res.write(JSON.stringify(result))
	}
	res.end()
})

wss.on('connection', function (ws, req, client) {
	let socket = new WS(ws)

	ws.onopen = socket.open()
	ws.on('message', function (message) {
		socket.handleMessage(message)
	})
	ws.on('close', function () {
		socket.close()
	})
})

app.listen(8080)
console.log("HTTP connected on port :8080...")