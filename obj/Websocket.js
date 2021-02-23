const Validate = require("./Validate").Validate
const Player = require("./Player").Player
const Room = require("./Room").Room
const OnlinePlayers = require("./OnlinePlayers").OnlinePlayers
let onlinePlayers = new OnlinePlayers()
const OpenRooms = require("./OpenRooms").OpenRooms
let openRooms = new OpenRooms()
const Database = require("./Database").Database
let db = new Database()

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
					this.getHandleInitialReq()
					break
				case "CreateRoomReq": // When player creates a room
					this.getHandleCreateRoomReq()
					break
				case "JoinToRoomReq": //A player wants to join a room
					this.getHandleJoinToRoomReq()
					break
			}

		} else {// Unauthorized request
			this.terminateConnection(result)
		}
	}

	//  GET & HANDLE FUNCTIONS

	this.getHandleInitialReq = function () {
		let player = new Player(undefined, this.message.PlayerID)

		if (!player.id) {// Unauthorized request
			this.terminateConnection(player)
		} else {
			player.setBasicProperty("ws", this.ws)// Relate user information sent via HTTPS and other information sent via Websocket
			player.addToOnlinePlayers()// An online player should be registered in <onlinePlayers> in order to fast access
			player.setProperty("state", "wait")// Set player's state in <OnlinePlayers>
			// Call some functions to notify users
			this.sendInitialRes(player.name)// To the player
			this.sendRoomsListUpdate(player)// To all waiting players
		}

	}

	this.getHandleCreateRoomReq = function () {
		let player = new Player(this.ws)

		if (player.ws) {// Player is found!
			let room = new Room(player, undefined, {
				Capacity: this.message.Settings.Capacity,
				SafeSquares: this.message.Settings.SafeSquares,
				FirstTurnExit: this.message.Settings.FirstTurnExit
			}) //Create room

			if (room.id) {// The room is ready for players to join
				console.log("A room has been added to the rooms list by " + player.name)

				this.sendCreateRoomRes(room)// To the room's creator
				this.sendCreateRoomUpdate(room)// To all waiting players except the player
			} else {// The room is not found!
				this.terminateConnection(player)
			}
		} else {// The player is not found!
			this.terminateConnection(player)
		}

	}

	this.getHandleJoinToRoomReq = function () {
		let player = new Player(this.ws)

		if (player.ws) {// Player is found!
			let room = new Room(undefined, this.message.RoomID)// Find room by id

			if (room.id) {// Room is found!
				let result = room.joinPlayer(player.id)

				if (result.status) {// Room confirmed joining player
					player.setProperty("state", "play") //Changing the player state to play means he is in the game and room create or update updates no longer sent to him

					this.sendJoinToRoomRes(player, room)// To the joined player
					this.sendJoinToRoomUpdate(room, player)// To all waiting players
				} else {
					this.sendError(result)
				}

			} else {// The room is not found!
				this.terminateConnection(player)
			}
		} else {// The player is not found!
			this.terminateConnection(player)
		}
	}

	// End of HANDLE FUNCTIONS

	//HANDLE FUNCTIONS

	this.handleGameStart = function () {

	}

	//End of HANDLE FUNCTIONS

	// SEND RESPONSE FUNCTIONS

	this.sendInitialRes = function (name) {
		this.ws.send(JSON.stringify({
			__Type: "InitialRes",
			Player: {
				Name: name
			}
		}))
	}

	this.sendRoomsListUpdate = function (player) {// Sends a list of rooms with details to the players with state of "wait"
		player.ws.send(JSON.stringify({
			__Type: "RoomsListUpdate",
			Rooms: openRooms.list()
		}))
	}

	this.sendCreateRoomRes = function (room) {
		room.creator.ws.send(JSON.stringify({
			__Type: "CreateRoomRes",
			Room: {
				ID: room.id,
				Creator: room.creator.name,
				Settings: room.settings,
				Players: room.players
			}
		}))
	}

	this.sendCreateRoomUpdate = function (room) {
		onlinePlayers.list().forEach(function (player) {
			if (player.state === "wait" && player.id !== room.creator.id) {// Sending to players who are seeking for a room to join.
				player.ws.send(JSON.stringify({
					__Type: "CreateRoomUpdate",
					Room: {
						ID: room.id,
						Creator: room.creator.name,
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

	this.sendJoinToRoomUpdate = function (room, ply) {
		onlinePlayers.list().forEach(function (player) {
			if (player.state === "wait" && player.id !== ply.id) {// Sending to players who are seeking for a room to join.
				player.ws.send(JSON.stringify({
					__Type: "JoinToRoomUpdate",
					RoomID: room.id,
					Players: room.players.length
				}))
			}
		})
	}

	// End of SEND RESPONSE FUNCTIONS

	this.close = function () {
		console.log("Websocket closed!")
	}

	/**
	 * This method shows the error and terminates
	 * the websocket connection. Usually this method
	 * is called when a high-risk issue happens in
	 * the system.
	 * @param result
	 */
	this.terminateConnection = function (result) {
		result.__Type = "TerminateConnection"

		this.ws.send(JSON.stringify(result))
		this.ws.terminate()
	}

	/**
	 * This method sends the normal (no high-risk)
	 * errors.
	 * @param result
	 */
	this.sendError = function (result) {
		result.__Type = "Error"

		this.ws.send(JSON.stringify(result))
	}

}

exports.Websocket = Websocket