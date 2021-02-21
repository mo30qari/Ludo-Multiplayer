const Database = require("./Database").Database
let db = new Database()

const Room = function (creator, id = undefined, settings = undefined) {

	this.creator = creator
	this.id = id
	this.settings = settings
	this.deleted = 0
	this.players = []

	if (this.creator && !this.id) {// New room
		this.id = db.insertRoom(this)
	} else if (this.id) {// The room already exists
		let result = db.getRoom(this.id)

		if (result.status) {
			this.creator = result.room.creator
			this.players = result.room.players
		} else {
			return result
		}
	}

	this.joinPlayer = function (playerId) {
		this.players.push(playerId)

		db.updateRoom(this, {
			players: this.players
		})
	}

}

exports.Room = Room