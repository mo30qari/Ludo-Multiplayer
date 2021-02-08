const Database = require("./Database").Database
let db = new Database()
let onlinePlayers = []

const Player = function (ws, id = undefined, newUser = 0) {

    this.ws = ws
    this.id = id

    if (id && newUser) {
        db.insertPlayer(this)
        
    } else if (id && !newUser) {
        let result = db.getPlayerByID(this.id)

        if (result.status) {
            this.name = result.player.name
        } else {
            return result
        }
    }
    else if (ws) {
        let result = db.getPlayerByWS(this.ws)

        if (result.status) {
            this.name = result.player.name
            this.id = result.player.id
        } else {
            return result
        }
    }

    // SET FUNCTIONS

    this.setName = function (name) {
        this.name = name
        db.updatePlayer(this, "name", name)
    }

    this.setWS = function (ws) {
        this.ws = ws
        db.updatePlayer(this, "ws", this.ws)// <ws> was got when the instance was created
        onlinePlayers.push(this)// The online players should be registered in <onlinePlayers> to fast access
    }

    // End of SET FUNCTIONS

    // GET FUNCTIONS

    this.getMe = function () {//Shows a player is active and true or not
        if (onlinePlayers.includes(this)) {
            return { player: this }//Standard DB format
        } else {
            return db.getPlayerByID(this.id)
        }
    }

    // End of GET FUNCTIONS

}

exports.Player = Player