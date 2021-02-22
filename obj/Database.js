PLAYERS = []
ROOMS = []

const Database = function () {

	//PLAYER FUNCTIONS

	this.insertPlayer = function (player) {
		player.id = Math.floor(1000000 + Math.random() * 9000000)
		// player.id = 5485835
		PLAYERS.push(player)

		this.writeOnFile("players", PLAYERS)

		return player.id
	}

	this.getPlayerById = function (id) {
		let result = {status: true, errors: []}
		let player = PLAYERS.find(e => e.id === id)

		if (!player) {
			result.errors.push("The player doesn't exist")
		} else if (player.deleted) {
			result.errors.push("The player was deleted")
		}

		if (result.errors.length) {
			result.status = false
		} else {
			result.player = player
		}

		return result
	}

	this.getPlayerByWs = function (ws) {
		let result = {status: true, errors: []}
		let player = PLAYERS.find(e => e.ws === ws)

		if (!player) {
			result.errors.push("The player doesn't exist")
		} else if (player.deleted) {
			result.errors.push("The player was deleted")
		}

		if (result.errors.length) {
			result.status = false
		} else {
			result.player = player
		}

		return result
	}

	/**
	 * This function gets the player by its changes
	 * and applies them int the player. The changes
	 * should be inserted in json format.
	 * @param player
	 * @param props
	 * @returns {{errors: [], status: boolean}}
	 */
	this.updatePlayer = function (player, props) {
		let result = {status: true, errors: []}
		let ply = PLAYERS.find(e => e.id === player.id)

		if (!ply) {
			result.errors.push("The player doesn't exist")
		} else if (ply.deleted) {
			result.errors.push("The player was deleted")
		} else {
			for (const [key, value] of Object.entries(props)) {
				ply[key] = value
			}
		}

		if (result.errors.length) {
			result.status = false
		} else {
			result.player = player
			this.writeOnFile("players", PLAYERS)
		}

		return result
	}

	//End of PLAYER FUNCTIONS

	//ROOM FUNCTIONS

	/**
	 * This function inserts a room into database and return the id of the room
	 * @param room
	 * @returns {number}
	 */
	this.insertRoom = function (room) {
		room.id = Math.floor(1000000 + Math.random() * 9000000)
		// room.id = 3215854
		ROOMS.push(room)

		this.writeOnFile("rooms", ROOMS)

		return room.id
	}

	this.getRoom = function (id) {
		let result = {status: true, errors: []}
		let room = ROOMS.find(e => e.id === id)

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

	this.updateRoom = function (rom, props) {
		let result = {status: true, errors: []}
		let room = ROOMS.find(e => e.id === rom.id)

		if (!room) {
			result.errors.push("The room doesn't exist")
		} else if (room.deleted) {
			result.errors.push("The room was deleted")
		} else {
			for (const [key, value] of Object.entries(props)) {
				room[key] = value
			}
		}

		if (result.errors.length) {
			result.status = false
		} else {
			result.room = room
			this.writeOnFile("rooms", ROOMS)
		}

		return result
	}

	this.getAllWaitingRooms = function () {
		let result = []

		ROOMS.forEach(function (room) {
			if (room.players.length < room.settings.Capacity) {
				result.push({
					id: room.id,
					Creator: room.creator.name,
					Settings: room.settings,
					Players: room.players.length
				})
			}
		})

		return result
	}

	//End of ROOM FUNCTIONS

	/**
	 * This function get file name (without file format) and data and inserts data into the file.
	 * @param fileName
	 * @param data
	 */
	this.writeOnFile = function (fileName, data) {
		let fs = require("fs")

		fs.writeFile(fileName + ".json", JSON.stringify(data, null, 4), function (err){
			if (err !== null)
				console.log(err)
		})
	}

}

exports.Database = Database