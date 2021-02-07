const DB = require("./Database").Database
let db = new DB()

const Player = function (id) {

    this.id = id

    this.setName = function (name) {
        this.name = name
    }

    this.addToPlayers = function () {
        db.insertPlayer(this)
    }

    this.getStatus = function () {//Shows a player is active and true or not
        return db.getPlayer(this)
    }
    
    this.setWS = function (ws) {
        let result = db.updatePlayer(this, "ws", ws)
        
        if (!result.status) {
            console.log(result.errors)//Unexpected error! I suppose everything is OK here!
        } else {
            this.ws = ws
        }
    }

}

exports.Player = Player