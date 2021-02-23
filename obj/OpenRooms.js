const Database = require("./Database").Database
let db = new Database()

let OPEN_ROOMS = []

const OpenRooms = function () {

	this.add = function (room) {
		room.id = Math.floor(1000000 + Math.random() * 9000000)
		OPEN_ROOMS.push(room)
		db.writeOnFile("OpenRooms", OPEN_ROOMS)

		return room.id
	}

	this.remove = function (room) {
		OPEN_ROOMS.splice(OPEN_ROOMS.indexOf(room), 1)
		db.writeOnFile("OpenRooms", OPEN_ROOMS)
	}

	this.get = function (roomId) {
		let result = {status: true, errors: []}
		let room = OPEN_ROOMS.find(e => e.id === roomId)

		if (!room) {
			result.errors.push("The player doesn't exist")
		} else if (room.deleted) {
			result.errors.push("The player was deleted")
		}

		if (result.errors.length) {
			result.status = false
		} else {
			result.room = room
		}

		return result
	}

	this.list = function () {
		let rooms = []

		OPEN_ROOMS.forEach(function (room) {
			rooms.push({
				RoomID: room.id,
				Creator: room.creator.name,
				Settings: room.settings,
				Players: room.players.length
			})
		})

		return rooms
	}

	this.update = function (room, key, value) {
		let rom = OPEN_ROOMS.find(e => e.id === room.id)

		rom[key] = value
		db.writeOnFile("OpenRooms", OPEN_ROOMS)
	}
}

exports.OpenRooms = OpenRooms