let util = require("../functions")

let PLAYERS = []// As a table

/**
 * This object is supposed to do as a real database.
 * In the future I should change it to MySql or MongoDB.
 * @constructor
 */
const Database = function () {

	/**
	 * This function assigns an Id to the new player
	 * and pushes it into <PLAYERS> that is as a
	 * database table. At the end if everything was
	 * good the function return the player's Id.
	 * @param player
	 * @returns {number}
	 */
	this.insertPlayer = function (player) {
		player.id = Math.floor(1000000 + Math.random() * 9000000)
		PLAYERS.push(player)

		util.logger(player.id, "The player has been created. (Database.insertPlayer)")

		return player.id
	}

	/**
	 * This function return the player found by its Id.
	 * If the player doesn't exists return false response.
	 * This function is used when the player is a new one.
	 * @param ws
	 * @param id
	 * @returns {{errors: [], status: boolean}}
	 */
	this.getPlayer = function (ws, id = undefined) {
		let result = {status: true, errors: []}
		let player

		if (ws) {
			player = PLAYERS.find(e => e.ws === ws)
		} else if (id){
			player = PLAYERS.find(e => e.id === id)
		}

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
	 * @param key
	 * @param value
	 * @returns {{errors: [], status: boolean}}
	 */
	this.updatePlayer = function (player, key, value) {
		let result = {status: true, errors: []}
		let ply = PLAYERS.find(e => e.id === player.id)

		if (!ply) {
			result.errors.push("The player doesn't exist")
		} else if (ply.deleted) {
			result.errors.push("The player was deleted")
		} else {
			ply[key] = value
		}

		if (result.errors.length) {
			result.status = false
		} else {
			result.player = player
		}

		return result
	}

	// /**
	//  * This function set player as deleted.
	//  * @param player
	//  * @returns {{errors: [], status: boolean}}
	//  */
	// this.deletePlayer = function (player) {
	// 	let result = {status: true, errors: []}
	// 	let ply = PLAYERS.find(e => e.id === player.id)
	//
	// 	if (!ply) {
	// 		result.errors.push("The player doesn't exist")
	// 	} else if (ply.deleted) {
	// 		result.errors.push("The player was deleted")
	// 	} else {
	// 		ply["deleted"] = 1
	// 	}
	//
	// 	if (result.errors.length) {
	// 		result.status = false
	// 	} else {
	// 		result.player = player
	// 	}
	//
	// 	return result
	// }

}

exports.Database = Database