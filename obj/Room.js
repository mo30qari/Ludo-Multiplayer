const OpenRooms = require("./OpenRooms").OpenRooms
let openRooms = new OpenRooms()
const util = require("../functions")


let UPTIME = 20000// The time that room waits for satisfying capacity
let timers = []
let playerTimers = []
let WAITINGTIME = 3000// The time difference between Client and Server

/**
 * This object handles all about rooms. The player first
 * creates a room and sends its settings. After that the
 * room is visible for other players. The room manages by
 * states: "wait", "play" & "closed".
 * @param creator
 * @param id
 * @param settings
 * @returns {{errors: [], status: boolean}}
 * @constructor
 */
const Room = function (creator, id = undefined, settings = undefined) {

	this.creator = creator
	this.id = id
	this.settings = settings// capacity, safeSquares and firstTurnExit
	this.players = []
	this.state = "wait"// wait, play and closed
	this.data = {
		gameState: [],// Keeps all data about the latest game's event
		turn: 1,// Which player should roll dice?
		dice: 0// What's the number of latest dice?
	}
	this.playerStartTime = undefined
	this.winner = undefined

	// this.timer = undefined
	// this.playerTimer

	if (this.creator && !this.id) {// New room
		this.id = openRooms.add(this)

	} else if (this.id) {// The room already exists
		let result = openRooms.get(this.id)

		if (result.status) {
			for (const [key, value] of Object.entries(result.room)){
				this[key] = value
			}

		} else {
			return result
		}
	}

	/**
	 * This function starts a timer at the beginning of the room,
	 * if the room doesn't satisfy capacity, it will close after
	 * UPTIME.
	 */
	this.startTimer = function () {
		clearTimeout(timers.find(e => e.room === this.id))
		let that = this

		this.timer = setTimeout(function () {
			that.timeOver()
		}, UPTIME)
		this.timer.room = this.id
		timers.push(this.timer)

		util.logger(this.creator.id, "A timer started for room: " + this.id + ". (Room.startTimer)")

	}

	/**
	 * This function stops room timer once capacity is satisfied.
	 */
	this.stopTimer = function () {
		clearTimeout(timers.find(e => e.room === this.id))
		util.logger(this.creator.id, "The timer for room: " + this.id + " stopped. (Room.stopTimer)")
	}

	/**
	 * This function handles events after the room timer is over.
	 */
	this.timeOver = function () {
		util.logger(this.creator.id, "The timer for room: " + this.id + " is over. (Room.timeOver)")
		const WS = require("./Websocket").Websocket
		let ws = new WS()

		ws.handleFastClose(this)
	}

	/**
	 * This method returns [status: true] if the
	 * player can join the room. If the room is
	 * full or closed the response will be negative.
	 * @param player
	 * @returns {{errors: [], status: boolean}}
	 */
	this.joinPlayer = function (player) {
		let result = {status: true, errors: []}

		if (this.state === "play") {
			result.errors.push("The room is in playing now.")
			util.logger(player.id, "The player received an error: The room is in playing now. (Room.joinPlayer)")
		} else if (this.state === "closed") {
			result.errors.push("The room is closed.")
			util.logger(player.id, "The player received an error: The room is closed. (Room.joinPlayer)")
		}

		if (result.errors.length) {
			result.status = false
		} else {
			this.addToPlayers(player)

			if (this.settings.Capacity === this.players.length) {
				this.setProperty("state", "play")
			}

			result.room = this
		}

		return result
	}

	/**
	 * This method sets the <Room> properties. All the
	 * information is saved via <OpenRooms> object.
	 * @param key
	 * @param value
	 */
	this.setProperty = function (key, value) {
		this[key] = value

		openRooms.update(this, key, value)
	}

	/**
	 * This function adds a player to the players and
	 * also update room in <OPEN_ROOMS>.
	 * @param player
	 */
	this.addToPlayers = function (player) {
		this.players.push(player)

		openRooms.update(this, "players", this.players)
		util.logger(player.id, "The player was added to the room: " + this.id + " players. (Room.addToPlayers)")

	}

	/**
	 *
	 * @param player
	 * @return {{errors: [], status: boolean}}
	 */
	this.has = function (player) {
		let result = {status: true, errors: []}

		let ply = this.players.find(e => e.id === player.id)

		if (!ply) {
			result.errors.push("The player doesn't belong or resigned from the room.")
			util.logger(player.id, "The player received an error: The player doesn't belong or resigned from the room. (Room.has)")
		}

		if (result.errors.length) {
			result.status = false
		}

		return result
	}

	/**
	 *
	 * @param key
	 * @param value
	 */
	this.setData = function (key, value) {
		this.data[key] = value

		openRooms.update(this, "data", this.data)
	}

	/**
	 * This function starts a timer for the players.
	 */
	this.startPlayerTimer = function () {
		clearTimeout(playerTimers.find(e => e.room === this.id))

		this.setProperty("playerStartTime", Date.now())
		let that = this

		this.playerTimer = setTimeout(function () {
			that.playerTimeOver()
		}, this.settings.Delay + WAITINGTIME)

		this.playerTimer.room = this.id
		playerTimers.push(this.timer)

		util.logger(this.creator.id, "A timer started for the player. (Room.startPlayerTimer)")

	}

	/**
	 * This function handles the events after a player doesn't
	 * do anything after <playerTime>.
	 */
	this.playerTimeOver = function () {
		util.logger(this.creator.id, "The timer for the player is over. (Room.playerTimeOver)")

		let player = this.players.find(e => e.turn === this.data.turn)
		let sendTurnSkipped = true

		if (player && player.absence < 3) {
			player.absence++
			util.logger(player.id, "The player absence set to:" + player.absence)
			this.setProperty("players", this.players)
			if (player.absence >= 3){
				sendTurnSkipped = false
				this.resignPlayer(player)
			}
		}
		this.nextTurn()

		const WS = require("./Websocket").Websocket
		let ws = new WS()
		if (sendTurnSkipped)
			ws.sendTurnSkipped(this)

		if (this.state === "play") {
			this.startPlayerTimer()
		}
	}

	/**
	 *
	 */
	this.nextTurn = function () {
		let presentPlayers = []

		this.players.forEach(function (player){
			if (!player.resigned) {
				presentPlayers.push(player.turn)
			}
		})

		let index = presentPlayers.indexOf(this.data.turn)

		if (index === presentPlayers.length - 1) {
			this.setData("turn", presentPlayers[0])
			util.logger(this.creator.id, "The room: " + this.id + " updated data: turn to " + presentPlayers[0] + ". (Room.nextTurn)")
		} else {
			this.setData("turn", presentPlayers[++index])
			util.logger(this.creator.id, "The room: " + this.id + " updated data: turn to " + presentPlayers[index] + ". (Room.nextTurn)")

		}
	}

	/**
	 *
	 * @param player
	 */
	this.resignPlayer = function (player) {
		let ply = this.players.find(e => e.id === player.id)

		if(ply) {
			if (this.state === "play"){
				this.players[this.players.indexOf(ply)].resigned = 1
				this.setProperty("players", this.players)
				util.logger(ply.id, "The player resigned from room: " + this.id + ". (Room.resignPlayer)")

				if (this.players.filter(e => e.resigned === 0).length < 2) {// If there is only one player in the room

					util.logger(ply.id, "There is only one player on the room: " + this.id + ". (Room.resignPlayer)")
					const WS = require("./Websocket").Websocket
					let ws = new WS()
					ws.sendResignUpdate(this, player)

					this.close(this.players.filter(e => e.resigned === 0)[0])// Close and send winner

				} else {// There is more than one player in the room

					util.logger(ply.id, "There is more than 1 player on the room: " + this.id + ". (Room.resignPlayer)")
					if(this.settings.Turn === player.turn){
						this.nextTurn()
					}

					const WS = require("./Websocket").Websocket
					let ws = new WS()
					ws.sendResignUpdate(this, player)

					this.startPlayerTimer()// Re-run playerTimer
				}

			} else if (this.state === "wait") {
				this.players.splice(this.players.indexOf(ply), 1)
				util.logger(ply.id, "The player resigned from the room: " + this.id + " before starting. (Room.resignPlayer)")
				this.setProperty("players", this.players)

				const WS = require("./Websocket").Websocket
				let ws = new WS()
				ws.sendRoomsListUpdate(player)
			}
		}

	}

	/**
	 *
	 * @param winner
	 */
	this.close = function (winner = undefined) {
		this.setProperty("state", "closed")
		this.setProperty("winner", winner)
		clearTimeout(playerTimers.find(e => e.room === this.id))
		util.logger(this.creator.id, "The room: " + this.id + " closed. (Room.close)")
	}

}

exports.Room = Room