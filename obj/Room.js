const OpenRooms = require("./OpenRooms").OpenRooms
let openRooms = new OpenRooms()

let DELAY = 10000

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
	this.startTime = undefined

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
	 *
	 */
	this.startTimer = function () {
		let that = this

		this.setProperty("startTime", Date.now())
		setTimeout(function () {
			that.timeOver()
		}, DELAY)
	}

	/**
	 *
	 */
	this.timeOver = function () {
		let player = this.players.find(e => e.turn === this.data.turn)

		if (player) {
			player.absence++
			this.setProperty("players", this.players)
			if (player.absence >= 3){
				this.resignPlayer(player)
			}
		}
		this.nextTurn()

		const WS = require("./Websocket").Websocket
		let ws = new WS()
		ws.handleTimeOver(this)
	}

	/**
	 *
	 */
	this.nextTurn = function () {// Resigned players must be considered
		if (this.settings.Capacity === this.data.turn) {
			this.setData("turn", 1)
		} else {
			this.setData("turn", this.data.turn + 1)
		}
	}

	/**
	 *
	 * @param player
	 */
	this.resignPlayer = function (player) {
		this.players[this.players.indexOf(player)].resigned = 1

		this.setProperty("players", this.players)
	}

}

exports.Room = Room