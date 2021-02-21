const Validate = require("./Validate").Validate
const Player = require("./Player").Player
const Room = require("./Room").Room

let onlinePlayers = []// Keeps the players who are listening to the websocket.

const Websocket = function (ws) {

	this.ws = ws

	this.open = function () {
		this.ws.send("Websocket connected on port :8090...")
		console.log("Websocket connected on port :8090...")
	}

	this.handleMessage = function (req) {
		req = JSON.parse(req)

		let valid = new Validate()
		let result = valid.validateRequest(req)// The request should be validated via Validate.validateRequest()

		if (result.status) {// Valid request
			this.message = req

			switch (this.message.__Type) {
				case "InitialReq": // Registering player in the Websocket server
					this.handleInitialReq()
					break
				case "CreateRoomReq": // When player creates a room
					this.handleCreateRoomReq()
					break
				case "JoinToRoomReq": //A player wants to join a room
					this.handleJoinToRoomReq()
					break
			}

		} else {// Unauthorized request
			this.terminateConnection(result, "Unauthorized request.")
		}
	}

	//  HANDLE FUNCTIONS

	this.handleInitialReq = function () {
		let player = new Player(undefined, this.message.PlayerID)

		if (!player.id) {// Unauthorized request
			this.terminateConnection(player, "Unauthorized user. The connection terminated!")
		} else {
			player.setWS(this.ws)// Relate user information sent via HTTPS and other information sent via Websocket
			onlinePlayers.push(player)// The online players should be registered in <onlinePlayers> in order to fast access
			this.sendInitialRes(player.name)
		}

	}

	this.handleCreateRoomReq = function () {
		let player = new Player(this.ws)

		if (player.ws) {// Player is found!
			let room = new Room(player, undefined, {
				Capacity: this.message.Settings.Capacity,
				SafeSquares: this.message.Settings.SafeSquares,
				FirstTurnExit: this.message.Settings.FirstTurnExit
			}) //Create room

			if (room.id) {// The room is ready for players to join
				console.log("A room has been added to the rooms list by " + player.name)
				this.sendCreateRoomRes(player, room)
			} else {// The room is not found!
				this.terminateConnection(player, "The room doesn't exist.")
			}
		} else {// The player is not found!
			this.terminateConnection(player, "Unauthorized user.")
		}

	}

	this.handleJoinToRoomReq = function () {
		let player = new Player(this.ws)

		if (player.ws) {// Player is found!
			let room = new Room(undefined, this.message.RoomID)// Find room by id

			if (room.id) {// Room is found!
				room.joinPlayer(this.message.PlayerID)
				this.sendJoinToRoomRes(player, room)
			} else {// The room is not found!
				this.terminateConnection(player, "The room doesn't exist.")
			}
		} else {// The player is not found!
			this.terminateConnection(player, "Unauthorized user.")
		}
	}

	// End of HANDLE FUNCTIONS

	// SEND RESPONSE FUNCTIONS

	this.sendInitialRes = function (name) {
		this.ws.send(JSON.stringify({
			__Type: "InitialRes",
			Player: {
				Name: name
			}
		}))
	}

	this.sendCreateRoomRes = function (creator, room) {
		onlinePlayers.forEach(function (player) {
			if (player.state === "wait") {// Sending to players who are seeking for a room to join.
				player.ws.send(JSON.stringify({
					__Type: "CreateRoomRes",
					Room: {
						id: room.id,
						Creator: creator.name,
						Settings: room.settings,
						Players: room.players
					}
				}))
			}
		})
	}

	this.sendJoinToRoomRes = function (player, room) {
		player.ws.send(JSON.stringify({
			__Type: "JoinToRoomRes",
			Settings: room.settings,
			PlayerNumber: room.players.findIndex(e => e === player.id) + 1,
			Player: {
				NickName: player.name,
				Avatar: player.avatar
			}
		}))
	}

	// End of SEND RESPONSE FUNCTIONS

	this.close = function () {
		console.log("Websocket closed!")
	}

	this.terminateConnection = function (result, message) {
		result.message = message + " The connection terminated!"
		this.ws.send(JSON.stringify(result))
		this.ws.terminate()
	}

}

exports.Websocket = Websocket