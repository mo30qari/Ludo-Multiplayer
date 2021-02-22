const Database = require("./Database").Database
let db = new Database()

const Player = function (ws, id = undefined) {

	this.ws = ws
	this.id = id
	this.deleted = 0
	this.state = "init"
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
		db.updatePlayer(this, {
			ws: this.ws
		})// <ws> was got when the instance was created
	}

	// End of SET FUNCTIONS

	this.update = function (props) {
		for (const [key, value] of Object.entries(props)) {
			this[key] = value
		}

	}

}

exports.Player = Player