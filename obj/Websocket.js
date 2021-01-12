const Validate = require("./Validate").Validate

const Websocket = function (ws) {

    this.ws = ws

    this.open = function () {
        ws.send("Websocket connected on port :8090...")
        console.log("Websocket connected on port :8090...")
    }

    this.message = function (message) {
        let valid = new Validate()

        // switch (message.__Type){
        //     case "JoinToRoomReq":
        //         break
        //     case "PlayerBackReq":
        //         break
        //     case "DiceRolledReq":
        //         break
        //     case "PlayerMovedReq":
        //         break
        //     case "ResignReq":
        //         break
        //     case "RoomDataReq":
        //         break
        //     case "EndGameReq":
        //         break
        // }
    }

    this.close = function () {
        console.log("WS Closed!")
    }

}

exports.Websocket = Websocket