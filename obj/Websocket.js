const Validate = require("./Validate").Validate
const Player = require("./Player").Player
const Room = require("./Room").Room
const OnlinePlayers = require("./OnlinePlayers").OnlinePlayers
let onlinePlayers = new OnlinePlayers()
const OpenRooms = require("./OpenRooms").OpenRooms
let openRooms = new OpenRooms()
const util = require("../functions")

const PLAYERTIME = 12000// The time that the player should do an action

const Websocket = function (ws) {

    this.ws = ws

    /**
     *
     */
    this.open = function () {
        this.ws.send("Websocket connected on port :8090...")
        console.log("Websocket connected on port :8090...")
        util.logger("websocket", "Websocket connected on port :8090. (Websocket.open)")
    }

    /**
     *
     * @param req
     */
    this.handleMessage = function (req) {
        req = JSON.parse(req)

        let valid = new Validate()
        let result = valid.validateRequest(req)// The request should be validated via Validate.validateRequest()

        if (result.status) {// Valid request
            util.logger("websocket", "Websocket connected on port :8090. (Websocket.open)")
            this.message = req
            util.logger("websocket", "Request received: " + JSON.stringify(this.message) + ". (Websocket.open)")

            switch (this.message.__Type) {
                case "InitialReq": // Registering player in the Websocket server
                    this.handleInitialReq()
                    break
                case "CreateRoomReq": // When player creates a room
                    this.handleCreateRoomReq()
                    break
                case "JoinToRoomReq": // Player wants to join a room
                    this.handleJoinToRoomReq()
                    break
                case "PlayerBackReq": // When player was suspended and resumes
                    this.handlePlayerBackReq()
                    break
                case "DiceRolledReq": // When player rolled dice
                    this.handleDiceRolledReq()
                    break
                case "PlayerMovedReq": // When player moved
                    this.handlePlayerMovedReq()
                    break
                case "RoomDataReq":
                    this.handleRoomDataReq()
                    break
                case "ResignReq":
                    this.handleResignReq()
                    break
                case "EndGameReq":
                    this.handleEndGameReq()
                    break
            }

        } else {// Unauthorized request
            this.SendError(result)
        }
    }

    //  HANDLE FUNCTIONS

    /**
     *
     */
    this.handleInitialReq = function () {
        let player = new Player(undefined, this.message.PlayerID)

        if (!player.id) {// Unauthorized request
            this.SendError(player)
            util.logger("websocket", "Unauthorized request. (Websocket.handleInitialReq)")
        } else {
            player.setBasicProperty("ws", this.ws)// Relate user information sent via HTTPS and other information sent via Websocket
            player.setProperty("state", "wait")// Set player's state in <OnlinePlayers>
            util.logger(player.id, "The player has been registered by WS. (Websocket.handleInitialReq)")

            // Call some functions to notify the player
            this.sendInitialRes(player)// To the player
            this.sendRoomsListUpdate(player)// Send OPEN_ROOMS data to the player
        }

    }

    /**
     *
     */
    this.handleCreateRoomReq = function () {
        let player = new Player(this.ws)

        if (player.ws) {// Player is found!
            let room = new Room(player, undefined, {
                Capacity: this.message.Settings.Capacity,
                SafeSquares: this.message.Settings.SafeSquares,
                FirstTurnExit: this.message.Settings.FirstTurnExit,
                Delay: PLAYERTIME
            }) //Create room

            if (room.id) {// The room is ready for players to join
                this.sendCreateRoomRes(room)// To the room's creator
                this.sendRoomsListUpdate(player, true, false)// To all waiting players except the player

                room.startTimer()
            } else {// The room is not found!
                this.SendError(player)
            }
        } else {// The player is not found!
            this.SendError(player)
        }

    }

    /**
     *
     */
    this.handleJoinToRoomReq = function () {
        let player = new Player(this.ws)

        if (player.ws) {// Player is found!
            let room = new Room(undefined, this.message.RoomID)// Find room by id

            if (room.id) {// Room is found!
                let result = room.joinPlayer(player)

                if (result.status) {// Room confirmed joining player
                    player.setProperty("roomId", room.id)// Add room id to the player's properties
                    player.setProperty("turn", room.players.findIndex(e => e.id === player.id) + 1)
                    player.setProperty("absence", 0)
                    player.setProperty("resigned", 0)

                    this.sendJoinToRoomRes(player, room)// To the joined player
                    this.sendRoomsListUpdate(player, true, false)// To all waiting players

                    if (result.room.state === "play") {
                        this.handleGameStart(result.room)
                        room.stopTimer()// This timer will remove the room if it doesn't satisfy capacity
                    }
                } else {
                    this.SendError(result)
                }

            } else {// The room is not found!
                this.SendError(room)
            }
        } else {// The player is not found!
            this.SendError(player)
        }
    }

    /**
     * This method sends <GameStart> response to the all
     * members of a room.
     * @param room
     */
    this.handleGameStart = function (room) {
        let that = this

        room.players.forEach(function (player) {
            let ply = new Player(player.ws)

            ply.setProperty("state", "play")
            that.sendGameStart(player, room)
        })

        room.startPlayerTimer()
    }

    /**
     *
     */
    this.handlePlayerBackReq = function () {
        let player = new Player(undefined, this.message.PlayerID)

        if (player.id) {
            let room = new Room(undefined, this.message.RoomID)

            if (room.id) {
                let result = room.has(player)

                if (room.winner === undefined) {
                    if (result.status) {
                        player.setBasicProperty("ws", player.ws)
                        this.sendPlayerBackRes(player, room)
                    } else {
                        this.sendPlayerBackResFalse()
                    }
                } else {
                    this.sendPlayerBackResFalse(room.winner)
                }
            } else {
                this.sendPlayerBackResFalse()
            }
        } else {
            this.sendPlayerBackResFalse()
        }
    }

    /**
     *
     */
    this.handleDiceRolledReq = function () {
        let player = new Player(this.ws)

        if (player.id) {
            let rom = openRooms.getByPlayer(player)

            if (rom.status) {
                let room = new Room(undefined, rom.room.id)

                if (room.id) {
                    room.setData("dice", this.message.Dice)

                    this.sendDiceRolledRes(player, room)
                    room.startPlayerTimer()
                } else {
                    this.SendError(room)
                }
            } else {
                this.SendError(rom)
            }
        } else {
            this.SendError(player)
        }
    }

    /**
     *
     */
    this.handlePlayerMovedReq = function () {
        let player = new Player(this.ws)

        if (player.id) {
            let rom = openRooms.getByPlayer(player)

            if (rom.status) {
                let room = new Room(undefined, rom.room.id)

                if (room.id) {
                    this.sendPlayerMovedRes(player, room)
                    room.startPlayerTimer()
                } else {
                    this.SendError(room)
                }
            } else {
                this.SendError(rom)
            }
        } else {
            this.SendError(player)
        }
    }

    /**
     *
     */
    this.handleRoomDataReq = function () {
        let player = new Player(this.ws)

        if (player.id) {
            let rom = openRooms.getByPlayer(player)

            if (rom.status) {
                let room = new Room(undefined, rom.room.id)

                if (room.id) {
                    room.setData("gameState", this.message.GameState)
                    room.setData("dice", this.message.Dice)
                    room.setData("turn", this.message.Turn)

                } else {
                    this.SendError(room)
                }
            } else {
                this.SendError(rom)
            }
        } else {
            this.SendError(player)
        }
    }

    /**
     *
     */
    this.handleResignReq = function () {
        let player = new Player(this.ws)

        if (player.id) {
            let rom = openRooms.getByPlayer(player)

            if (rom.status) {
                let room = new Room(undefined, rom.room.id)

                if (room.id) {
                    let ply = room.players.find(e => e.id === player.id)

                    if (ply) {
                        room.resignPlayer(ply)
                    }
                } else {
                    this.SendError(room)
                }
            } else {
                this.SendError(rom)
            }
        } else {
            this.SendError(player)
        }
    }

    /**
     *
     */
    this.handleEndGameReq = function () {
        let player = new Player(this.ws)

        if (player.id) {
            let rom = openRooms.getByPlayer(player)

            if (rom.status) {
                let room = new Room(undefined, rom.room.id)

                if (room.id) {
                    room.players.forEach(function (ply) {
                        let plyr = new Player(ply.ws)
                        if (plyr) {
                            plyr.setProperty("state", "wait")
                        }
                    })
                    room.close(player)
                } else {
                    this.SendError(room)
                }
            } else {
                this.SendError(rom)
            }
        } else {
            this.SendError(player)
        }
    }

    /**
     *
     * @param room
     */
    this.handleFastClose = function (room) {
        room.players.forEach(function (player) {
            player.ws.send(JSON.stringify({
                __Type: "ResignUpdate",
                PlayerNumber: player.turn
            }))
            util.logger(player.id, "The player resigned from room: " + room.id + " because the room doesn't reach capacity.")
        })

        room.close()
        let player = {id: "0000000"}
        this.sendRoomsListUpdate(player, true, false)
        util.logger(room.creator.id, "The room: " + this.id + " closed because it doesn't reach capacity. (Websocket.handleFastClose)")
    }

    //End of HANDLE FUNCTIONS

    // SEND RESPONSE FUNCTIONS

    /**
     *
     * @param player
     */
    this.sendInitialRes = function (player) {
        let response = JSON.stringify({
            __Type: "InitialRes",
            Player: {
                Name: player.name,
                Avatar: player.avatar
            }
        })
        this.ws.send(response)
        util.logger(player.id, "InitialRes sent to the player: " + response + ". (Websocket.sendInitialRes)")
    }


    /**
     *
     * @param player
     * @param broadcast
     * @param sendToMe
     */
    this.sendRoomsListUpdate = function (player, broadcast = false, sendToMe = true) {// Sends a list of rooms with details to the players with state of "wait"
        let sendList = []

        if (!broadcast) {
            sendList.push(player)
        } else {
            onlinePlayers.list().forEach(function (ply) {
                if (ply.state === "wait" && ply.deleted === 0 && ply.id !== player.id) {
                    sendList.push(ply)
                }
            })
        }

        if (!sendToMe && sendList.length) {
            if (sendList.find(e => e.id === player.id)) {
                sendList.splice(sendList.indexOf(player), 1)
            }
        }

        sendList.forEach(function (ply) {
            let response = JSON.stringify({
                __Type: "RoomsListUpdate",
                Rooms: openRooms.list()
            })
            ply.ws.send(response)
            util.logger(ply.id, "RoomsListUpdate sent to the player: " + response + ". (Websocket.sendRoomsListUpdate)")
        })

    }

    /**
     *
     * @param room
     */
    this.sendCreateRoomRes = function (room) {
        let response = JSON.stringify({
            __Type: "CreateRoomRes",
            RoomID: room.id
        })
        room.creator.ws.send(response)
        util.logger(room.creator.id, "CreateRoomRes sent to the player: " + response + ". (Websocket.sendCreateRoomRes)")
    }

    /**
     *
     * @param player
     * @param room
     */
    this.sendJoinToRoomRes = function (player, room) {
        let response = JSON.stringify({
            __Type: "JoinToRoomRes",
            Settings: room.settings,
            PlayerNumber: player.turn
        })
        player.ws.send(response)
        util.logger(player.id, "JoinToRoomRes sent to the player: " + response + ". (Websocket.sendJoinToRoomRes)")

    }

    /**
     *
     * @param player
     * @param room
     */
    this.sendGameStart = function (player, room) {
        let response = JSON.stringify({
            __Type: "GameStart",
            Players: this.formatPlayers(room.players)
        })
        player.ws.send(response)
        util.logger(player.id, "GameStart sent to the player: " + response + ". (Websocket.sendGameStart)")

    }

    /**
     *
     * @param player
     * @param room
     */
    this.sendPlayerBackRes = function (player, room) {
        let response = JSON.stringify({
            __Type: "PlayerBackRes",
            Result: true,
            Turn: room.data.turn,
            Dice: room.data.dice,
            GameState: room.data.gameState,
            ElapsedTime: (Date.now() - room.playerStartTime) / 1000,
            Players: this.formatPlayers(room.players)
        })
        this.ws.send(response)
        util.logger(player.id, "PlayerBackRes sent to the player: " + response + ". (Websocket.sendPlayerBackRes)")
    }

    /**
     *
     */
    this.sendPlayerBackResFalse = function (player = undefined) {
        let winner

        (player === undefined) ? winner = player : winner = player.turn
        let response = JSON.stringify({
            __Type: "PlayerBackRes",
            Result: false,
            Winner: winner
        })
        this.ws.send(response)
        util.logger("etc", "PlayerBackRes sent to the player: " + response + ". (Websocket.sendPlayerBackResFalse)")

    }

    /**
     * @param player
     * @param room
     */
    this.sendDiceRolledRes = function (player, room) {
        let that = this
        let response
        room.players.forEach(function (ply) {
            if (!ply.resigned && ply.id !== player.id) {
                response = JSON.stringify({
                    __Type: "DiceRolledRes",
                    Dice: that.message.Dice,
                    PlayerNumber: player.turn
                })
                ply.ws.send(response)
                util.logger(player.id, "DiceRolledRes sent to the player: " + response + ". (Websocket.sendDiceRolledRes)")

            }
        })
    }

    /**
     *
     * @param player
     * @param room
     */
    this.sendPlayerMovedRes = function (player, room) {
        let that = this
        let response

        room.players.forEach(function (ply) {
            if (!ply.resigned && ply.id !== player.id) {
                response = JSON.stringify({
                    __Type: "PlayerMovedRes",
                    Pawn: that.message.Pawn,
                    StepCount: that.message.StepCount,
                    PlayerNumber: player.turn
                })
                ply.ws.send(response)
                util.logger(player.id, "PlayerMovedRes sent to the player: " + response + ". (Websocket.sendPlayerMovedRes)")

            }
        })
    }

    /**
     *
     * @param room
     */
    this.sendTurnSkipped = function (room) {
        let response

        room.players.forEach(function (ply) {
            if (!ply.resigned) {
                response = JSON.stringify({
                    __Type: "TurnSkipped",
                    Turn: room.data.turn,
                    Dice: room.data.dice,
                    GameState: room.data.gameState
                })
                ply.ws.send(response)
                util.logger(ply.id, "TurnSkipped sent to the player: " + response + ". (Websocket.sendTurnSkipped)")

            }
        })
    }

    /**
     *
     * @param player
     * @param room
     */
    this.sendResignUpdate = function (room, player) {
        let response

        room.players.forEach(function (ply) {
            if (!ply.resigned && ply.id !== player.id) {
                response = JSON.stringify({
                    __Type: "ResignUpdate",
                    PlayerNumber: player.turn
                })
                ply.ws.send(response)
                util.logger(ply.id, "ResignUpdate sent to the player: " + response + ". (Websocket.sendResignUpdate)")

            }
        })
    }

    /**
     * This method shows the error. Usually this method
     * is called when an issue happens in
     * the system.
     * @param result
     */
    this.SendError = function (result) {
        let response = JSON.stringify({
            __Type: "Error",
            Errors: result.errors
        })
        this.ws.send(response)
        util.logger("etc", "Error sent to a player: " + response + ". (Websocket.SendError)")

    }

    // End of SEND RESPONSE FUNCTIONS

    /**
     *
     */
    this.close = function () {
        let player = new Player(this.ws)

        if (player.id) {
            let rom = openRooms.getByPlayer(player)

            if (rom.status) {
                let room = new Room(undefined, rom.room.id)

                if (room.id) {
                    if (room.players.length === 1 && room.players.find(e => e.id === player.id)) {// Delete room only when the player is in the room
                        room.close()
                        player.delete()
                        this.sendRoomsListUpdate(player, true, false)// To all waiting players except the player
                        util.logger(player.id, "The room: " + room.id + " deleted due to the room has only one member. (Websocket.close)")
                    } else {
                        room.resignPlayer(player)
                        player.delete()
                        this.sendRoomsListUpdate(player, true, false)// To all waiting players except the player
                        util.logger(player.id,"The player signed out. The created room didn't delete. (Websocket.close)")
                    }
                } else {
                    util.logger(player.id,"The player signed out. The room of the player is already deleted. (Websocket.close)")
                }
            } else {
                util.logger(player.id,"The player signed out. He isn't member of any room. (Websocket.close)")
            }
        } else {
            util.logger("etc","An unregistered websocket closed!")
        }
    }

    /**
     *This method formats players array to sending in responses.
     * @param players
     * @return {[]}
     */
    this.formatPlayers = function (players) {
        let result = []

        players.forEach(function (player) {
            if (player.resigned === 1) {
                result.push(null)
            } else {
                result.push({
                    PlayerID: player.id,
                    NickName: player.name,
                    Avatar: player.avatar
                })
            }
        })

        return result
    }

}

exports.Websocket = Websocket