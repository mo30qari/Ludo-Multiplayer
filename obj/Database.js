const Database = function (){
    
    this.players = []
    this.rooms = []
    
    this.insertPlayer = function (player) {
        // let playerId = parseInt(Math.random() * 1000000)
        let playerId = 5485835
        player.id = playerId
        this.players.push(player)
        
        return player.id
    }
    
    this.getPlayerById = function (id) {
        let result = { status: true, errors: [] }
        let player = this.players.find(e => e.id === id)
        
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
        let result = { status: true, errors: [] }
        let player = this.players.find(e => e.ws === ws)
        
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
    
    this.updatePlayer = function (ply, key, value) {
        let result = { status: true, errors: [] }
        let player = this.players.find(e => e.id === ply.id)
        
        if (!player) {
            result.errors.push("The player doesn't exist")
        } else if (player.deleted) {
            result.errors.push("The player was deleted")
        } else {
            player[key] = value
        }
        
        if (result.errors.length) {
            result.status = false
        } else {
            result.player = player
        }

        return result
        
    }
    
}

exports.Database = Database