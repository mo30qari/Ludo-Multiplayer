const Websocket = function(ws){
    
    this.ws = ws
    
    this.open = function(){
        console.log("WS connected!")
    }
    
    this.message = function(message){
        console.log("WS sends: " + message)
    }
    
    this.close = function(){
        console.log("WS Closed!")    
    }
    
}

exports.Websocket = Websocket