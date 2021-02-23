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
		ONLINE_PLAYERS.push(player)
		db.writeOnFile("OnlinePlayers", ONLINE_PLAYERS)
	}

	/**
	 *
	 * @param player
	 */
	this.remove = function (player) {
		ONLINE_PLAYERS.splice(ONLINE_PLAYERS.indexOf(player), 1)
		db.writeOnFile("OnlinePlayers", ONLINE_PLAYERS)
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