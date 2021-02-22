PLAYERS = []
ROOMS = []

const Database = function () {

	/*PLAYER FUNCTIONS*/
	this.insertPlayer = function (player) {
		player.id = Math.floor(1000000 + Math.random() * 9000000)
		// player.id = 5485835
		PLAYERS.push(player)

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

	this.updatePlayer = function (ply, props) {
		let result = {status: true, errors: []}
		let player = PLAYERS.find(e => e.id === ply.id)

		if (!player) {
			result.errors.push("The player doesn't exist")
		} else if (player.deleted) {
			result.errors.push("The player was deleted")
		} else {
			for(const [key, value] of Object.entries(props)) {
				player[key] = value
			}
		}

		if (result.errors.length) {
			result.status = false
		} else {
			result.player = player
		}

		return result
	}
	/*End of PLAYER FUNCTIONS*/

	this.insertRoom = function (room) {
		room.id = Math.floor(1000000 + Math.random() * 9000000)
		// room.id = 3215854
		ROOMS.push(room)

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
			for(const [key, value] of Object.entries(props)) {
				room[key] = value
			}
		}

		if (result.errors.length) {
			result.status = false
		} else {
			result.room = room
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
					Players: room.players
				})
			}
		})

		return result
	}

}

exports.Database = Database