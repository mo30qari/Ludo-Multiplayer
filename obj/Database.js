const Database = function (){
    
    this.players = []
    this.rooms = []
    
    this.insertPlayer = function (player) {
        this.players.push(player)
    }
    
    this.findPlayer = function (player) {
        let result = { status: true, errors: [] }
        
        if (!this.players.find(e => e.id === player.id)) {
            result.errors.push("The player doesn't exist")
        } else if (player.deleted) {
            result.errors.push("The player was deleted")
        }
        
        if (result.errors.length) {
            result.status = false
        }

        return result
    }
    
}

exports.Database = Database