const Database = require("./Database").Database
let db = new Database()
const Room = function (creator, id = undefined) {

	this.creator = creator
	this.id = id

	if (this.creator && !this.id) {// New room
		this.id = db.insertRoom(this)
	} else if (this.id) {// The room already exists
		let result = db.getRoom(this.id)

		if (result.status) {
			this.creator = result.room.creator
		} else {
			return result
		}
	}
}

exports.Room = Room