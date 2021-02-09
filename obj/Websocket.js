const Validate = require("./Validate").Validate
const Player = require("./Player").Player

const DEFAULT_ERROR_TITLE = "Your request has been rejected due to following errors:"

const Websocket = function (ws) {

    this.ws = ws
    this.message

    this.open = function () {
        this.ws.send("Websocket connected on port :8090...")
        console.log("Websocket connected on port :8090...")
    }

    this.handleMessage = function (req) {
        req = JSON.parse(req)

        let valid = new Validate()
        let result = valid.validateRequest(req)// The request should be validated via Validate.validateRequest()

        if (result.status) {// Valid request
            this.message = req

            switch (this.message.__Type) {
                case "InitialReq": // Registering player in the Websocket server 
                    this.handleInitialReq()
                    break
                case "CreateRoomReq": // When player creates a room
                    this.handleCreateRoomReq()
                    break
            }

        } else {// Unauthorized request
            this.terminateConnection(result, "Unauthorized request.")
        }
    }

    //  HANDLE FUNCTIONS

    this.handleInitialReq = function () {
        let player = new Player(undefined, this.message.PlayerID)

        if (!player.id) {// Unauthorized request
            this.ws.send("Unauthorized user. The connection terminated!")
            this.ws.terminate()
            // console.log(result.errors)
        } else {
            let result = player.setWS(this.ws)// Relate user information sent via HTTPS and other information sent via Websocket
            this.sendInitialRes(player.name)
        }

    }

    this.handleCreateRoomReq = function () {
        let player = new Player(this.ws)

        if (player.ws) {// Player

        } else {// The player is not found
            this.terminateConnection(player,"Unauthorized user.")
        }

    }

    // End of HANDLE FUNCTIONS

    // SEND RESPONSE FUNCTIONS

    this.sendInitialRes = function (name) {
        this.ws.send(JSON.stringify({
            __Type: "InitialRes",
            Player: {
                Name: name
            }
        }))
    }

    // End of SEND RESPONSE FUNCTIONS

    this.close = function () {
        console.log("Websocket closed!")
    }

    this.showErrors = function (status, errors) {
        this.ws.send(JSON.stringify({
            Status: status,
            Errors: errors
        }))
    }

    this.terminateConnection = function (result, message) {
        result.message = message + " The connection terminated!"
        this.ws.send(JSON.stringify(result))
        this.ws.terminate()
    }

}

exports.Websocket = Websocket