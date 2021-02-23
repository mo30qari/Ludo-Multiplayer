let OPEN_ROOMS = []

const OpenRooms = function () {

	this.add = function (room) {
		room.id = Math.floor(1000000 + Math.random() * 9000000)
		OPEN_ROOMS.push(room)

		return room.id
	}

	this.remove = function (room) {
		OPEN_ROOMS.splice(OPEN_ROOMS.indexOf(room), 1)
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
		return OPEN_ROOMS
	}

	this.update = function (room, props) {
		let rom = OPEN_ROOMS.find(e => e.id === room.id)

		for (const [key, value] of Object.entries(props)) {
			rom[key] = value
		}
	}
}

exports.OpenRooms = OpenRooms