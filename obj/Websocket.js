const Validate = require("./Validate").Validate
const Player = require("./Player").Player
const Room = require("./Room").Room
const OnlinePlayers = require("./OnlinePlayers").OnlinePlayers
let onlinePlayers = new OnlinePlayers()
const OpenRooms = require("./OpenRooms").OpenRooms
let openRooms = new OpenRooms()

const Websocket = function (ws) {

	this.ws = ws

	/**
	 *
	 */
	this.open = function () {
		this.ws.send("Websocket connected on port :8090...")
		console.log("Websocket connected on port :8090...")
	}

	/**
	 *
	 * @param req
	 */
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
				case "JoinToRoomReq": // Player wants to join a room
					this.handleJoinToRoomReq()
					break
				case "PlayerBackReq": // When player was suspended and resumes
					this.handlePlayerBackReq()
					break
				case "DiceRolledReq": // When player rolled dice
					this.handleDiceRolledReq()
					break
				case "PlayerMovedReq": // When player moved
					this.handlePlayerMovedReq()
					break
				case "RoomDataReq":
					this.handleRoomDataReq()
					break
				case "ResignReq":
					this.handleResignReq()
					break
				case "EndGameReq":
					this.handleEndGameReq()
					break
			}

		} else {// Unauthorized request
			this.terminateConnection(result)
		}
	}

	//  HANDLE FUNCTIONS

	/**
	 *
	 */
	this.handleInitialReq = function () {
		let player = new Player(undefined, this.message.PlayerID)

		if (!player.id) {// Unauthorized request
			this.terminateConnection(player)
		} else {
			player.setBasicProperty("ws", this.ws)// Relate user information sent via HTTPS and other information sent via Websocket
			player.setProperty("state", "wait")// Set player's state in <OnlinePlayers>

			// Call some functions to notify the player
			this.sendInitialRes(player)// To the player
			this.sendRoomsListUpdate(player)// Send OPEN_ROOMS data to the player
		}

	}

	/**
	 *
	 */
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

				this.sendCreateRoomRes(room)// To the room's creator
				this.sendRoomsListUpdate(player, true, false)// To all waiting players except the player
			} else {// The room is not found!
				this.terminateConnection(player)
			}
		} else {// The player is not found!
			this.terminateConnection(player)
		}

	}

	/**
	 *
	 */
	this.handleJoinToRoomReq = function () {
		let player = new Player(this.ws)

		if (player.ws) {// Player is found!
			let room = new Room(undefined, this.message.RoomID)// Find room by id

			if (room.id) {// Room is found!
				let result = room.joinPlayer(player)

				if (result.status) {// Room confirmed joining player
					player.setProperty("roomId", room.id)// Add room id to the player's properties
					player.setProperty("turn", room.players.findIndex(e => e.id === player.id) + 1)
					player.setProperty("absence", 0)
					player.setProperty("resigned", 0)

					this.sendJoinToRoomRes(player, room)// To the joined player
					this.sendRoomsListUpdate(player, true, false)// To all waiting players

					if (result.room.state === "play") {
						this.handleGameStart(result.room)
					}
				} else {
					this.sendError(result)
				}

			} else {// The room is not found!
				this.terminateConnection(room)
			}
		} else {// The player is not found!
			this.terminateConnection(player)
		}
	}

	/**
	 * This method sends <GameStart> response to the all
	 * members of a room.
	 * @param room
	 */
	this.handleGameStart = function (room) {
		let that = this

		room.players.forEach(function (player) {
			let ply = new Player(player.ws)

			ply.setProperty("state", "play")
			that.sendGameStart(player, room)

		})
		room.startTimer()
	}

	/**
	 *
	 */
	this.handlePlayerBackReq = function () {
		let player = new Player(undefined, this.message.PlayerID)

		if (player.id) {console.log(111)
			let room = new Room(undefined, this.message.RoomID)

			if (room.id) {console.log(222)
				let result = room.has(player)

				if (room.winner === undefined) {console.log(333)// The room is in playing
					if (result.status) {console.log(444)
						player.setBasicProperty("ws", player.ws)
						this.sendPlayerBackRes(player, room)
					} else {console.log(-444)
						this.sendPlayerBackResFalse()
						console.log("The player: " + player.id + " backs to room: " + room.id + " but the player doesn't belong to the room.")
					}
				} else {console.log(-333)
					this.sendPlayerBackResFalse(room.winner)
					console.log("The player: " + player.id + " backs to a room and gives false.")
				}
			} else {console.log(-222)
				this.sendPlayerBackResFalse()
				console.log("The player: " + player.id + " backs to a room and gives false.")
			}
		} else {console.log(-111)
			this.sendPlayerBackResFalse()
			console.log("A player backs and gives false.")
		}
	}

	/**
	 *
	 */
	this.handleDiceRolledReq = function () {
		let player = new Player(this.ws)

		if (player.id) {
			let rom = openRooms.getByPlayer(player)

			if (rom.status) {
				let room = new Room(undefined, rom.room.id)

				if (room.id) {
					room.setData("dice", this.message.Dice)

					this.sendDiceRolledRes(player, room)
					room.startTimer()
				} else {
					this.terminateConnection(room)
				}
			} else {
				this.terminateConnection(rom)
			}
		} else {
			this.terminateConnection(player)
		}
	}

	/**
	 *
	 */
	this.handlePlayerMovedReq = function () {
		let player = new Player(this.ws)

		if (player.id) {
			let rom = openRooms.getByPlayer(player)

			if (rom.status) {
				let room = new Room(undefined, rom.room.id)

				if (room.id) {
					this.sendPlayerMovedRes(player, room)
					room.startTimer()
				} else {
					this.terminateConnection(room)
				}
			} else {
				this.terminateConnection(rom)
			}
		} else {
			this.terminateConnection(player)
		}
	}

	/**
	 *
	 */
	this.handleRoomDataReq = function () {
		let player = new Player(this.ws)

		if (player.id) {
			let rom = openRooms.getByPlayer(player)

			if (rom.status) {
				let room = new Room(undefined, rom.room.id)

				if (room.id) {
					room.setData("gameState", this.message.GameState)
					room.setData("dice", this.message.Dice)
					room.setData("turn", this.message.Turn)

					console.log("Player:" + player.id + " saved data in room: " + room.id)
				} else {
					this.terminateConnection(room)
				}
			} else {
				this.terminateConnection(rom)
			}
		} else {
			this.terminateConnection(player)
		}
	}

	/**
	 *
	 */
	this.handleResignReq = function () {
		let player = new Player(this.ws)

		if (player.id) {
			let rom = openRooms.getByPlayer(player)

			if (rom.status) {
				let room = new Room(undefined, rom.room.id)

				if (room.id) {
					let ply = room.players.find(e => e.id === player.id)

					if (ply) {
						room.resignPlayer(ply)
					}
				} else {
					this.terminateConnection(room)
				}
			} else {
				this.terminateConnection(rom)
			}
		} else {
			this.terminateConnection(player)
		}
	}

	/**
	 *
	 */
	this.handleEndGameReq = function () {
		let player = new Player(this.ws)

		if (player.id) {
			let rom = openRooms.getByPlayer(player)

			if (rom.status) {
				let room = new Room(undefined, rom.room.id)

				if (room.id) {
					room.players.forEach(function (ply) {
						let plyr = new Player(ply.ws)
						plyr.setProperty("state", "wait")
					})
					room.close(player)
				} else {
					this.terminateConnection(room)
				}
			} else {
				this.terminateConnection(rom)
			}
		} else {
			this.terminateConnection(player)
		}
	}

	//End of HANDLE FUNCTIONS

	// SEND RESPONSE FUNCTIONS

	/**
	 *
	 * @param player
	 */
	this.sendInitialRes = function (player) {
		this.ws.send(JSON.stringify({
			__Type: "InitialRes",
			Player: {
				Name: player.name,
				Avatar: player.avatar
			}
		}))
	}


	/**
	 *
	 * @param player
	 * @param broadcast
	 * @param sendToMe
	 */
	this.sendRoomsListUpdate = function (player, broadcast = false, sendToMe = true) {// Sends a list of rooms with details to the players with state of "wait"
		let sendList = []

		if (!broadcast) {
			sendList.push(player)
		} else {
			onlinePlayers.list().forEach(function (ply) {
				if (ply.state === "wait" && ply.id !== player.id) {
					sendList.push(ply)
				}
			})
		}

		if (!sendToMe && sendList.length) {
			if (sendList.find(e => e.id === player.id)) {
				sendList.splice(sendList.indexOf(player), 1)
			}
		}

		sendList.forEach(function (ply) {
			ply.ws.send(JSON.stringify({
				__Type: "RoomsListUpdate",
				Rooms: openRooms.list()
			}))
		})

	}

	/**
	 *
	 * @param room
	 */
	this.sendCreateRoomRes = function (room) {
		room.creator.ws.send(JSON.stringify({
			__Type: "CreateRoomRes",
			RoomID: room.id
		}))
	}

	/**
	 *
	 * @param player
	 * @param room
	 */
	this.sendJoinToRoomRes = function (player, room) {
		player.ws.send(JSON.stringify({
			__Type: "JoinToRoomRes",
			Settings: room.settings,
			PlayerNumber: player.turn
		}))
	}

	/**
	 *
	 * @param player
	 * @param room
	 */
	this.sendGameStart = function (player, room) {

		player.ws.send(JSON.stringify({
			__Type: "GameStart",
			Players: this.formatPlayers(room.players)
		}))
	}

	/**
	 *
	 * @param player
	 * @param room
	 */
	this.sendPlayerBackRes = function (player, room) {
		this.ws.send(JSON.stringify({
			__Type: "PlayerBackRes",
			Result: true,
			Turn: room.data.turn,
			Dice: room.data.dice,
			GameState: room.data.gameState,
			ElapsedTime: (Date.now() - room.startTime) / 1000,
			Players: this.formatPlayers(room.players)
		}))
	}

	/**
	 *
	 */
	this.sendPlayerBackResFalse = function (player = undefined) {
		let winner

		(player === undefined) ? winner = player : winner = player.turn
		this.ws.send(JSON.stringify({
			__Type: "PlayerBackRes",
			Result: false,
			Winner: winner
		}))
	}

	/**
	 * @param player
	 * @param room
	 */
	this.sendDiceRolledRes = function (player, room) {
		let that = this
		room.players.forEach(function (ply) {
			if (!ply.resigned && ply.id !== player.id) {
				ply.ws.send(JSON.stringify({
					__Type: "DiceRolledRes",
					Dice: that.message.Dice,
					PlayerNumber: player.turn
				}))
			}
		})
	}

	/**
	 *
	 * @param player
	 * @param room
	 */
	this.sendPlayerMovedRes = function (player, room) {
		let that = this

		room.players.forEach(function (ply) {
			if (!ply.resigned && ply.id !== player.id) {
				ply.ws.send(JSON.stringify({
					__Type: "PlayerMovedRes",
					Pawn: that.message.Pawn,
					StepCount: that.message.StepCount,
					PlayerNumber: player.turn
				}))
			}
		})
	}

	/**
	 *
	 * @param room
	 */
	this.sendTurnSkipped = function (room) {
		room.players.forEach(function (ply) {
			if (!ply.resigned) {
				ply.ws.send(JSON.stringify({
					__Type: "TurnSkipped",
					Turn: room.data.turn,
					Dice: room.data.dice,
					GameState: room.data.gameState
				}))
			}
		})
	}

	/**
	 *
	 * @param player
	 * @param room
	 */
	this.sendResignUpdate = function (player, room) {
		room.players.forEach(function (ply) {
			if (!ply.resigned && ply.id !== player.id) {
				ply.ws.send(JSON.stringify({
					__Type: "ResignUpdate",
					PlayerNumber: player.turn
				}))
			}
		})
	}

	/**
	 * This method sends the normal (no high-risk)
	 * errors.
	 * @param result
	 */
	this.sendError = function (result) {
		this.ws.send(JSON.stringify({
			__Type: "Error",
			Errors: result.errors
		}))
	}

	/**
	 * This method shows the error and terminates
	 * the websocket connection. Usually this method
	 * is called when a high-risk issue happens in
	 * the system.
	 * @param result
	 */
	this.terminateConnection = function (result) {
		this.ws.send(JSON.stringify({
			__Type: "FatalError",
			Errors: result.errors
		}))
		// this.ws.terminate()
	}

	// End of SEND RESPONSE FUNCTIONS

	/**
	 *
	 */
	this.close = function () {
		let player = new Player(this.ws)

		if (player.id) {
			let rom = openRooms.getByPlayer(player)

			if (rom.status) {
				let room = new Room(undefined, rom.room.id)

				if (room.id) {
					if (room.players.length === 1 && room.players.find(e => e.id === player.id)) {// Delete room only when the player is in the room
						room.close()
						this.sendRoomsListUpdate(player, true, false)// To all waiting players except the player
						console.log("The room: " + room.id + " deleted due to creator: " + player.id + " signing out.")
					} else {
						room.resignPlayer(player)
						this.sendRoomsListUpdate(player, true, false)// To all waiting players except the player
						console.log("The player: " + player.id + " signed out. The created room didn't delete.")
					}
				} else {
					console.log("The player: " + player.id + " signed out. The created room by the player already deleted.")
					console.log(room)
				}
			} else {
				console.log("The player: " + player.id + " signed out. No room affected.")
				console.log(rom)
			}
		} else {
			console.log("An unregistered websocket closed!")
			console.log(player)
		}
	}

	/**
	 *This method formats players array to sending in responses.
	 * @param players
	 * @return {[]}
	 */
	this.formatPlayers = function (players) {
		let result = []

		players.forEach(function (player) {
			result.push({
				PlayerID: player.id,
				NickName: player.name,
				Avatar: player.avatar
			})
		})

		return result
	}

}

exports.Websocket = Websocket