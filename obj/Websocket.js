const Validate = require("./Validate").Validate
const Player = require("./Player").Player

const DEFAULT_ERROR_TITLE = "Your request has been rejected due to following errors:"

const Websocket = function (ws) {

    this.ws = ws
    this.message

    this.open = function () {
        ws.send("Websocket connected on port :8090...")
        console.log("Websocket connected on port :8090...")
    }

    this.handleMessage = function (req) {
        req = JSON.parse(req)

        let valid = new Validate()
        let result = valid.validateRequest(req)//The request should be validated via Validate.validateRequest()

        if (result.status) {//Valid request
            this.message = req

            switch (this.message.__Type) {
                case "InitialReq": //Registering player in the Websocket server 
                    this.handleInitialReq()
                    break
                case "CreateRoomReq": //When player creates a room
                    this.handleCreateRoomReq()
                    break
            }

        } else {//Unauthorized request
            ws.send("Unauthorized request. The connection terminated!")
            ws.terminate()//Unauthorized request
        }
    }

    //HANDLE FUNCTIONS

    this.handleInitialReq = function () {
        let player = new Player(ws)
        let result = player.getMeByIDAndSet(message.PlayerID)
        
        if (!result.status) {//Unauthorized request
            ws.terminate()
        } else {
            this.sendInitialRes(result.player.name)
        }
        
    }

    this.handleCreateRoomReq = function () {
        let player = new Player(0, ws)//Create a player instance just with WS
    }

    //End of HANDLE FUNCTIONS

    //SEND RESPONSE FUNCTIONS

    this.sendInitialRes = function (name) {
        ws.send(JSON.stringify({
            __Type: "InitialRes",
            Player: {
                Name: name
            }
        }))
    }

    //End of SEND RESPONSE FUNCTIONS

    this.close = function () {
        console.log("Websocket closed!")
    }

    this.showErrors = function (status, errors) {
        ws.send(JSON.stringify({
            Status: status,
            Errors: errors
        }))
    }

}

exports.Websocket = Websocket