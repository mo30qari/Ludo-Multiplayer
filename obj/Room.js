const OpenRooms = require("./OpenRooms").OpenRooms
let openRooms = new OpenRooms()
const Database = require("./Database").Database
let db = new Database()

const Room = function (creator, id = undefined, settings = undefined) {

	this.creator = creator
	this.id = id
	this.settings = settings
	this.deleted = 0
	this.players = []

	if (this.creator && !this.id) {// New room
		this.id = openRooms.add(this)
	} else if (this.id) {// The room already exists
		let result = openRooms.get(this.id)

		if (result.status) {
			this.creator = result.room.creator
			this.players = result.room.players
		} else {
			return result
		}
	}

	this.joinPlayer = function (playerId) {
		this.players.push(playerId)

		openRooms.update(this, {
			players: this.players
		})
	}

}

exports.Room = Room