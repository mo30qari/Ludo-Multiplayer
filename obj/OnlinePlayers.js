const Database = require("./Database").Database
let db = new Database()

/**
 * This object keeps and manages the players who are online.
 * This object exists because this is impossible to read/write
 * from database and keep it fast! The database processes take
 * a long time of system.
 * Some basic information of players are stored into database
 * and other information like game issues, roll a dice or kick
 * a player that should not be stored into database are stored
 * in this object.
 * @constructor
 */

let ONLINE_PLAYERS = []

const OnlinePlayers = function () {

	/**
	 *
	 * @param player
	 */
	this.add = function (player) {
		let ply = ONLINE_PLAYERS.find(e => e.id === player.id)

		if (ply) {
			ONLINE_PLAYERS.splice(ONLINE_PLAYERS.indexOf(ply), 1)
		}

		ONLINE_PLAYERS.push(player)

		db.writeOnFile("OnlinePlayers", ONLINE_PLAYERS)
	}

	/**
	 *This function deletes a existed player from the <ONLINE_PLAYERS>
	 *If player doesn't exists does nothing.
	 * @param player
	 */
	this.remove = function (player) {
		if (ONLINE_PLAYERS.indexOf(player) !== -1) {// If player exists
			ONLINE_PLAYERS.splice(ONLINE_PLAYERS.indexOf(player), 1)
			
			db.writeOnFile("OnlinePlayers", ONLINE_PLAYERS)
		}
	}

	this.get = function(playerId) {
		let result = {status: true, errors: []}
		let player = ONLINE_PLAYERS.find(e => e.id === playerId)

		if (!player) {
			result.errors.push("The player doesn't exist or isn't active now.")
		} else if (player.deleted) {
			result.errors.push("The player was deleted from players.")
		}

		if (result.errors.length) {
			result.status = false
		} else {
			result.player = player
		}

		return result
	}

	/**
	 *
	 * @return {[]}
	 */
	this.list = function () {
		return ONLINE_PLAYERS
	}

	/**
	 *
	 * @param player
	 * @param key
	 * @param value
	 */
	this.update = function (player, key, value) {
		let ply = ONLINE_PLAYERS.find(e => e.id === player.id)

		ply[key] = value
		db.writeOnFile("OnlinePlayers", ONLINE_PLAYERS)
	}
}

exports.OnlinePlayers = OnlinePlayers