import { WebSocket } from "ws";
import logger from "../../../../config/logger";
import catchAsync from "../../../../utils/catchAsync";
import { decodeMessage, encodeMessage } from "../../../../utils/helpers";
import {
    GAME_TYPE,
    PACKAGE_HEADER,
    TICTACTOE_TYPE,
    BOARD
} from "../../../../utils/constants";
import { clients } from "../../../../config/websocket"
import TictactoeRouter from "./tictactoe.route"
import { Room, Player } from '../../../../games/tictactoe/interface';
import { tictactoeGame } from "../../../../games/tictactoe/tictactoeGame";
import { tictactoePvE } from "../../../../games/tictactoe/tictactoePvE";
import { findUser } from '../../../services/user.service';
const { v4: uuidv4 } = require('uuid');
export const games: Room = {}
export const rooms: Room = {};
export const PvERooms: Room = {}
export default class WSRouter {

    private main = new tictactoePvE()
    private gameMain = new tictactoeGame()
    private queue: Player[] = []
    private socket: WebSocket;
    private tictactoeRouter: TictactoeRouter;
    private readonly filePath_tmp = "src/network/grpc/package.proto";
    private readonly filePath_tictactoe = "src/network/grpc/tic_tac_toe.proto";
    private readonly packageType_tnp = "hcGames.PackageData";

    constructor(socket: WebSocket) {
        this.socket = socket;
        this.tictactoeRouter = new TictactoeRouter(socket)
    }
    /**
     * Description : This is a function that listens to the message sent by the client
     */
    public listeners = () => {
        this.socket.on("message", async (payload) => {

            const [error, message] = await catchAsync(
                decodeMessage(payload, this.filePath_tmp, this.packageType_tnp)
            );

            if (!message || !message ?.header) {
                logger.warn(`invalid message / header!`, message);
                console.log(115, message);
                return;
            }
            console.log(`\n Decoded mess json ${JSON.stringify(message)}`);
            if (message.header === PACKAGE_HEADER.DISCONNECTED) {
                return;
            }
            this.handlersV2(
                message.header,
                message.data ? Buffer.from(message.data) : [],
                payload
            );
        });
        this.socket.on("close", () => {
            logger.warn(`Client disconnected`);
        });

        this.socket.on("error", () => {
            logger.warn(`Client has error`);
        });
    };
    /**
     * @param header 
     * @param payload 
     * @param rawData 
     */
    private handlersV2 = async (header: Number, payload: any, rawData: any) => {
        this.handlers(header, payload, rawData);
    };
    /**
     * Description: This is a function that handles the header sent by the client
     * @param header 
     * @param payload 
     * @param rawData 
     */
    private handlers = async (header: Number, payload: any, rawData: any) => {
        const caseHeader = {
            [PACKAGE_HEADER.FINDING_ROOM_TICTICTOE]: (payload: any) => this.findingRoom(payload),
            [PACKAGE_HEADER.TICTACTOE_ACTION]: (payload: any) => this.tictactoeAction(payload),
            [PACKAGE_HEADER.TICTACTOE_ACTION_PvE]: (payload: any) => this.tictactoeActionPvE(payload),
            [PACKAGE_HEADER.TICTACTOE_END_GAME]: (payload: any) => this.tictactoeEndGame(payload)
        }
        const headerKey = Object.keys(caseHeader).find(
            (key) => Number(key) === header
        );
        caseHeader[headerKey] ?.(payload) ?? logger.error("can not find headerKey", header);

    };

    /**
     * Description : This is a function that handles the player's move.
     * @param payload 
     */
    private tictactoeActionPvE = async (payload: any) => {
        const [error2, dataAction] = await catchAsync(
            decodeMessage(
                payload,
                this.filePath_tictactoe,
                "tic_tac_toe.Action"
            )
        );
        // this.main.minimax(payload.to, true)
        this.main.markCell(dataAction);

    }
    /**
     * Description : The above code is finding a room for the player. If there is no room, it creates a room and
     * sends the player to the room. If there is a room, it sends the player to the room. 
     * create new user => add queue
     * create new room
     * join room
     */
    private findingRoom = async (payload) => {
        const [error2, dataAction] = await catchAsync(
            decodeMessage(
                payload,
                this.filePath_tmp,
                "hcGames.FindRoomandCheckuser"
            )
        );
        const userPlayload = {
            userCodeId: dataAction.userCodeId
        }
        const userCodeId = await this.checkUser(userPlayload)
        const player: Player = { id: userCodeId.id, name: userCodeId.name, symbol: 'x', isTurn: true, score: 0 };
        clients.set(player.id, this.socket);
        this.queue.push(player);
        const board = JSON.parse(JSON.stringify(BOARD));
        if (Object.keys(rooms).length <= 0) {
            const gameId: string = uuidv4()
            rooms[gameId] = { roomId: gameId, ownerId: player.id, players: [player], board: board, gameType: GAME_TYPE.TICTACTOE }
            this.listenRooms(gameId)
            this.removeFromQueue(player);
            this.gameMain.sendMessage(player, this.filePath_tictactoe, "tic_tac_toe.Player", player, TICTACTOE_TYPE.PLAYER_X)
        }
        else {
            player.symbol = 'o';
            player.isTurn = false;
            this.gameMain.sendMessage(player, this.filePath_tictactoe, "tic_tac_toe.Player", player, TICTACTOE_TYPE.PLAYER_O)
            const key = Object.keys(rooms)[0]
            rooms[key].players.push(player)
            const gameInfo = rooms[key]
            // delete rooms[key]
            games[key] = gameInfo
            const message: any = {
                type: TICTACTOE_TYPE.PLAY_GAME,
                payload: gameInfo
            }
            this.tictactoeRouter.router(message);
        }
    }
    /**
     * Description: handler moves
     * This is a function that handles the player's move.
     * @param payload 
     */
    private tictactoeAction = async (payload: any) => {
        const [error2, dataAction] = await catchAsync(
            decodeMessage(
                payload,
                this.filePath_tictactoe,
                "tic_tac_toe.Action"
            )
        );
        const message = {
            type: TICTACTOE_TYPE.ACTION,
            player: dataAction.player,
            roomId: dataAction.roomId,
            to: dataAction.to
        };
        if (games.hasOwnProperty(dataAction.roomId)) {
            this.tictactoeRouter.router(message);
        }
    }
    /**
     * Description: handler end of the game
     * This is a function that handles the end of the game
     */
    private tictactoeEndGame = async (payload: any) => {
        const [error2, dataAction] = await catchAsync(
            decodeMessage(
                payload,
                this.filePath_tictactoe,
                "tic_tac_toe.endGame"
            )
        );
        const message = {
            type: TICTACTOE_TYPE.END_GAME,
            data: dataAction
        };

        this.tictactoeRouter.router(message);
    }

    /**
     * It removes a player from the queue.
     * @param {Player} player - Player - The player to remove from the queue
     */
    private removeFromQueue(player: Player) {
        const index = this.queue.indexOf(player);
        if (index !== -1) {
            this.queue.splice(index, 1);
        }
    }

    /**
     * Description : Function listenRooms
     * It checks if there are 2 players in the room, if there are, it clears the interval and deletes
     * the room. If there is only 1 player, it sets a timeout to delete the room after 30 seconds. If a
     * second player joins, it clears the timeout.
     * 
     * The problem is that the timeout is not being cleared. I've tried using a boolean to check if the
     * timeout is set, but it doesn't seem to work.
     * 
     * I've also tried using a different method to clear the timeout, but it doesn't work either.
     * @param {string} gameId - string - the id of the game
     */
    private listenRooms(gameId: string) {
        const room = rooms[gameId];
        let timeoutId: any;
        let intervalId: any;
        let isTimeoutSet = false;

        const checkPlayers = () => {
            if (room.players.length === 1 && !isTimeoutSet) {
                timeoutId = setTimeout(async () => {
                    const newGameAsync = JSON.parse(JSON.stringify(room));
                    await this.asyncPlay(newGameAsync)
                    delete rooms[gameId];
                    clearInterval(intervalId);
                    isTimeoutSet = false;
                }, 5000);
                isTimeoutSet = true;
            } else if (room.players.length === 2) {
                if (isTimeoutSet) {
                    clearTimeout(timeoutId);
                    isTimeoutSet = false;
                }
                clearInterval(intervalId);
                delete rooms[gameId];
            }
        };

        intervalId = setInterval(checkPlayers, 500);
    }
    /**
     * Description : This is a function that handles the player's move.
     * @param payload 
     */
    private asyncPlay = async (payload: any) => {
        if (payload.roomId) {
            games[payload.roomId] = payload
            const message = {
                type: TICTACTOE_TYPE.PvE,
                data: {
                    roomId: payload.roomId,
                    groupRoomId: payload.gameType,
                    waitingTimeId: '',
                    userId: payload.players[0].id,
                    status: 2,
                    bonusScore: 0,
                    async: null
                }
            };
            this.tictactoeRouter.router(message)
            await this.gameMain.sendMessage(games[payload.roomId], this.filePath_tictactoe, "tic_tac_toe.startGame", payload.players[0], PACKAGE_HEADER.TICTACTOE_SEND_PLAYPvE)
        }

    }
    /**
     * Description : Checking if the user exists.
     * @param payload 
     * @returns 
     */
    private checkUser = async (payload: any) => {
        try {
            const userExists = await findUser({ name: payload.userCodeId })
            if (!userExists) {
                throw new Error("user not found");
            }
            return userExists
        } catch (error) {
            console.log(error)
        }

    }
}
