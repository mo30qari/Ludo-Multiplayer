const Database = require("./Database").Database
let db = new Database()

const Player = function (ws, id = undefined) {

	this.ws = ws
	this.id = id
	this.deleted = 0
	this.state = "init"
	/*
		The player's states are:
		1. init: The player has just entered the game and he is doing register progress.
		2. wait: The player registered successfully and now he is waiting to join a game.
		3. play: The player is playing a game.
	*/
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

	// SET FUNCTIONS

	this.setName = function (name) {
		this.name = name
		db.updatePlayer(this, {
			name: name
		})
	}

	this.setWS = function (ws) {
		this.ws = ws
		this.state = "wait"
		db.updatePlayer(this, {
			ws: this.ws
		})// <ws> was got when the instance was created
	}

	// End of SET FUNCTIONS

}

exports.Player = Player