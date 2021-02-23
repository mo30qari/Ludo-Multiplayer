const OnlinePlayers = require("./OnlinePlayers").OnlinePlayers
let onlinePlayers = new OnlinePlayers()
const Database = require("./Database").Database
let db = new Database()

/**
 * This object handles all about players. The player first
 * register with HTTP request and after assigning ID, he
 * sends a websocket request and after that he can create
 * or join a room. The player manages with states: "init"
 * ,"wait" & "play".
 * @param ws
 * @param id
 * @returns {{errors: [], status: boolean}}
 * @constructor
 */
const Player = function (ws, id = undefined) {

	//Basic information
	this.ws = ws
	this.id = id
	this.avatar = 1

	if (!this.ws && !this.id) {// New player
		this.id = db.insertPlayer(this)

	} else if (!this.ws && this.id) {// The player wants to register to websocket
		let result = db.getPlayerById(this.id)

		if (result.status) {
			this.name = result.player.name
		} else {
			return result
		}
	} else if (this.ws) {// Old player
		let result = db.getPlayerByWs(this.ws)

		if (result.status) {
			this.name = result.player.name
			this.id = result.player.id
		} else {
			return result
		}
	}

	/**
	 * This method sets player information that needs to
	 * be stored in the database. This information is
	 * different from other information that is generated
	 * during the gameplay.
	 * @param key
	 * @param value
	 */
	this.setBasicProperty = function (key, value) {
		this[key] = value

		db.updatePlayer(this, key, value)
	}

	/**
	 * This method adds the player into <OnlinePlayers>
	 * and after that, the player is detected as an
	 * active (now playing) player in the game.
	 */
	this.addToOnlinePlayers = function () {
		onlinePlayers.add(this)
	}

	/**
	 * This method sets immediate information of a player
	 * during the gameplay. This information is different
	 * from basic information that is stored into the
	 * database.
	 * @param key
	 * @param value
	 */
	this.setProperty = function (key, value) {
		this[key] = value

		onlinePlayers.update(this, key, value)
	}

}

exports.Player = Player