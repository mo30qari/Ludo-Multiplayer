const DB = require("./Database").Database
const db = new DB()

const Player = function (id) {

    this.id = id

    this.setName = function (name) {
        this.name = name
    }

    this.addToPlayers = function () {
        db.insertPlayer(this)
    }

    this.getStatus = function () {//Shows a player is active and true or not
        let result = { status: true, errors: [] }
        let exist = db.findPlayer(this)
        
        if (!exist.status) {
            result = exist
        } 
        
        if (result.errors.length) {
            result.status = false
        }

        return result
    }

}

exports.Player = Player