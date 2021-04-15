const express = require("express")
const app = express()
const Player = require("./obj/Player").Player
const Validate = require("./obj/Validate").Validate
const WebSocketServer = require("ws").Server
const wss = new WebSocketServer({port: 8090})
const WS = require("./obj/Websocket").Websocket
const util = require("./functions")

util.logger("etc", "End of previous logs\n")
util.logger("etc", "Server started...\n\n\n\n")


let valid = new Validate()

app.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*")
	next()
})

app.get('/', function (req, res) {
	res.send("Ludo Multiplayer! Go to Register to start the game.")
})

app.get('/register/:username', async function (req, res) {
	res.setHeader('Content-Type', 'application/json')

	util.logger("app", req.params["username"] + " requested to register. (app.get)")

	let result = valid.validateString(req.params["username"], 3, 10)

	if (result.status) {
		util.logger("app", req.params["username"] + " sent correct info. (app.get)")

		try {
			let player = await new Player(undefined)
			if (player.id) player.setBasicProperty("name", req.params["username"])
		}
		catch (err) {
			console.log("Error: " + err)
		}


		// res.write(JSON.stringify({
		// 	status: true,
		// 	Player: {
		// 		PlayerID: player.id,
		// 		Avatar: player.avatar
		// 	}
		// }))

	} else {
		res.write(JSON.stringify(result))
	}
	res.end()
})

wss.on('connection', function (ws) {
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