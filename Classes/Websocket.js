const Websocket = function(ws){
    
    this.ws = ws    
    this.open = function(){
        
        console.log("s")
        
    }
    this.message = function(message){
        
        console.log(message)
        
    }
    
}

exports.Websocket = Websocket