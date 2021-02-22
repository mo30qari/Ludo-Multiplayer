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
const OnlinePlayers = function () {

	this.players = []

	this.add = function (player) {
		this.players.push(player)
	}

	this.remove = function (player) {
		this.players.splice(this.players.indexOf(player), 1)
	}

	this.list = function () {
		return this.players
	}

	this.update = function (player, props) {
		let ply = this.players.find(e => e.id === player.id)

		for (const [key, value] of Object.entries(props)) {
			ply[key] = value
		}
	}
}

exports.OnlinePlayers = OnlinePlayers