const OnlinePlayers = require("./OnlinePlayers").OnlinePlayers
let onlinePlayers = new OnlinePlayers()
const Database = require("./Database").Database
let db = new Database()

/**
 * This object handles all about players. The player first
 * register with HTTP request and after assigning ID, he
 * sends a websocket request and after that he can create
 * or join a room. The player manages with states: "init"
 * ,"wait", "play" & "deleted".
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
			// this.name = result.player.name
			// this.id = result.player.id
			for (const [key, value] of Object.entries(result.player)){
				this[key] = value
			}
		} else {
			return result
		}
	}

	/**
	 *
	 * @param name
	 */
	this.setName = function (name) {
		let result = db.updatePlayer(this, "name", name)

		if(result.status) {
			this.name = name
		}

		return result
	}

	/**
	 * This method sets player information that needs to
	 * be stored into the database. This information is
	 * different from other information that is generated
	 * during the gameplay.
	 * @param key
	 * @param value
	 * @return {{errors: *[], status: boolean}}
	 */
	this.setBasicProperty = function (key, value) {
		let result = db.updatePlayer(this, key, value)

		if(result.status) {
			this[key] = value
			this.addToOnlinePlayers()
			onlinePlayers.update(this, key, value)
		}

		return result
	}

	/**
	 * This method adds the player into <OnlinePlayers>
	 * and after that, the player is detected as an
	 * active (now playing) player in the game.
	 */
	this.addToOnlinePlayers = function () {console.log("added to")
		onlinePlayers.add(this)
	}

	this.removeFromOnlinePlayers = function () {
		onlinePlayers.remove(this)
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

	/**
	 * This function sets <deleted> field for the player.
	 * Because of calling <setBasicProperty> function, the
	 * deletion process also saved into the database and
	 * <ONLINE_PLAYERS>.
	 * The function returns false if player is not found.
	 * @return {{errors: *[], status: boolean}}
	 */
	this.delete = function () {
		return this.setBasicProperty("deleted", 1)
	}

}

exports.Player = Player