const Database = require("./Database").Database
let db = new Database()
let onlinePlayers = []

const Player = function (ws, id = undefined) {

	this.ws = ws
	this.id = id

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

	// SET FUNCTIONS

	this.setName = function (name) {
		this.name = name
		db.updatePlayer(this, "name", name)
	}

	this.setWS = function (ws) {
		this.ws = ws
		db.updatePlayer(this, "ws", this.ws)// <ws> was got when the instance was created
		onlinePlayers.push(this)// The online players should be registered in <onlinePlayers> to fast access
	}

	// End of SET FUNCTIONS

	// GET FUNCTIONS

	this.getMe = function () {//Shows a player is active and true or not
		if (onlinePlayers.includes(this)) {
			return {player: this}//Based on DB format
		} else {
			return db.getPlayerById(this.id)
		}
	}

	// End of GET FUNCTIONS

}

exports.Player = Player