const OpenRooms = require("./OpenRooms").OpenRooms
let openRooms = new OpenRooms()
const Database = require("./Database").Database
let db = new Database()

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
	this.settings = settings
	this.players = []
	this.state = "wait"

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

}

exports.Room = Room