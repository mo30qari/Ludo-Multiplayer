const Database = require("./Database").Database
let db = new Database()

let OPEN_ROOMS = []

/**
 * This object manages all about the rooms. In order
 * to fast response nothing about rooms is saved into
 * database.
 * @constructor
 */
const OpenRooms = function () {

	/**
	 * This method adds a room to <OPEN_ROOMS>.
	 * @param room
	 * @returns {number}
	 */
	this.add = function (room) {
		room.id = Math.floor(1000000 + Math.random() * 9000000)
		OPEN_ROOMS.push(room)

		db.writeOnFile("OpenRooms", OPEN_ROOMS)

		return room.id
	}

	/**
	 * This method removes a room from <OPEN_ROOMS>.
	 * @param room
	 */
	this.remove = function (room) {
		let rom = OPEN_ROOMS.find(e => e.id === room.id)
		if (rom !== -1) {
			OPEN_ROOMS.splice(OPEN_ROOMS.indexOf(rom), 1)
			db.writeOnFile("OpenRooms", OPEN_ROOMS)
		} else {
			console.log("No room found to delete!")
		}
	}

	/**
	 * This method returns requested room if it exists.
	 * Otherwise returns false response.
	 * @param roomId
	 * @returns {{errors: [], status: boolean}}
	 */
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

	/**
	 * This method lists all the rooms in the <OPEN_ROOMS>
	 * with state = "wait". The structure of the room in
	 * the response is a few different from rooms' structure
	 * in <OPEN_ROOMS>.
	 * @returns {[]}
	 */
	this.list = function () {
		let rooms = []

		OPEN_ROOMS.forEach(function (room) {
			if (room.state === "wait") {
				rooms.push({
					RoomID: room.id,
					Creator: room.creator.name,
					Settings: room.settings,
					Players: room.players.length
				})
			}
		})

		return rooms
	}

	/**
	 * This method finds a room into <OPEN_ROOMS> and updates
	 * its information.
	 * @param room
	 * @param key
	 * @param value
	 */
	this.update = function (room, key, value) {
		let rom = OPEN_ROOMS.find(e => e.id === room.id)

		rom[key] = value

		db.writeOnFile("OpenRooms", OPEN_ROOMS)
	}

	this.getByPlayer = function (player) {console.log(player.roomId + "..." + player.name)
		let result = {status: true, errors: []}
		let room = OPEN_ROOMS.find(e => e.id === player.roomId)

		if (!room) {
			result.errors.push("The player doesn't belong to any room.")
		}

		if (result.errors.length) {
			result.status = false
		} else {
			result.room = room
		}

		return result
	}


}

exports.OpenRooms = OpenRooms