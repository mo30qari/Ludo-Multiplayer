const OpenRooms = require("./OpenRooms").OpenRooms
let openRooms = new OpenRooms()

let UPTIME = 20000
let timer, playerTimer
let WAITINGTIME = 3000

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
		clearTimeout(timer)

		let that = this

		timer = setTimeout(function () {
			that.timeOver()
		}, UPTIME)
	}

	/**
	 * This function stops room timer once capacity is satisfied.
	 */
	this.stopTimer = function () {
		clearTimeout(timer)
	}

	/**
	 * This function handles events after the room timer is over.
	 */
	this.timeOver = function () {
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
		} else if (this.state === "closed") {
			result.errors.push("The room is closed.")
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
		clearTimeout(playerTimer)

		this.setProperty("playerStartTime", Date.now())
		let that = this

		playerTimer = setTimeout(function () {
			that.playerTimeOver()
		}, this.settings.Delay + WAITINGTIME)
	}

	/**
	 * This function handles the events after a player doesn't
	 * do anything after <playerTime>.
	 */
	this.playerTimeOver = function () {
		let player = this.players.find(e => e.turn === this.data.turn)
		let sendTurnSkipped = true

		if (player && player.absence < 3) {
			player.absence++
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
			this.startPlayerTimer(playerTimer)
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
		} else {
			this.setData("turn", presentPlayers[++index])
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

				if (this.players.filter(e => e.resigned === 0).length === 1) {// If there is only one player in the room
					const WS = require("./Websocket").Websocket
					let ws = new WS()
					ws.sendResignUpdate(this, player)

					this.close(this.players.filter(e => e.resigned === 0)[0])// Close and send winner

				} else {// There is more than one player in the room
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
	}

	// /**
	//  *
	//  */
	// this.delete = function () {
	// 	clearTimeout(playerTimer)
	// 	openRooms.remove(this)
	// }

}

exports.Room = Room