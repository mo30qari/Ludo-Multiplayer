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
            }

        } else {//Invalid request
            this.showErrors(DEFAULT_ERROR_TITLE, result.errors)
        }
    }

    this.handleInitialReq = function () {
        let player = new Player(this.message.PlayerID)
        let result = player.getStatus()

        if (result.status) {
            console.log("The Player exists. Go on...")
        } else {
            this.showErrors(DEFAULT_ERROR_TITLE, result.errors)
        }
    }

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