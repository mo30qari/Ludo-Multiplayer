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

	this.add = function (player) {
		ONLINE_PLAYERS.push(player)
	}

	this.remove = function (player) {
		ONLINE_PLAYERS.splice(ONLINE_PLAYERS.indexOf(player), 1)
	}

	this.list = function () {
		return ONLINE_PLAYERS
	}

	this.update = function (player, props) {
		let ply = ONLINE_PLAYERS.find(e => e.id === player.id)

		for (const [key, value] of Object.entries(props)) {
			ply[key] = value
		}
	}
}

exports.OnlinePlayers = OnlinePlayers