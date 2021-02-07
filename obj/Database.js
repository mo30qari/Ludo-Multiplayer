const Database = function (){
    
    this.players = []
    this.rooms = []
    
    this.insertPlayer = function (player) {
        this.players.push(player)
    }
    
    this.getPlayer = function (ply) {
        let result = { status: true, errors: [] }
        let player = this.players.find(e => e.id === ply.id)
        
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