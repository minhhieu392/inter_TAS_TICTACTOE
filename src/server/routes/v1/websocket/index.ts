import { WebSocket } from "ws";
import logger from "../../../../config/logger";
import catchAsync from "../../../../utils/catchAsync";
import { decodeMessage, encodeMessage } from "../../../../utils/helpers";
const protobuf = require("protobufjs");
import {
    PACKAGE_HEADER,
    TICTACTOE_TYPE,
    BOARD
} from "../../../../utils/constants";
import { clients } from "../../../../config/websocket"
import TictactoeRouter from "./tictactoe.route"
import { Room, Player } from '../../../../games/tictactoe/interface';
import { tictactoeGame } from "../../../../games/tictactoe/tictactoeGame";
export const board: string[] = BOARD
export const games: Room = {}
export const rooms: Room = {};

export default class WSRouter {
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
            [PACKAGE_HEADER.FINDING_ROOM_TICTICTOE]: () => this.findingRoom(),
            [PACKAGE_HEADER.TICTACTOE_ACTION]: (payload: any) => this.tictactoeAction(payload),
            [PACKAGE_HEADER.TICTACTOE_END_GAME]: () => this.tictactoeEndGame(),
        }
        const headerKey = Object.keys(caseHeader).find(
            (key) => Number(key) === header
        );
        caseHeader[headerKey] ?.(payload) ?? logger.error("can not find headerKey", header);

    };

    /**
     * Description : The above code is finding a room for the player. If there is no room, it creates a room and
     * sends the player to the room. If there is a room, it sends the player to the room. 
     * create new user => add queue
     * create new room
     * join room
     */
    private findingRoom = async () => {
        const player: Player = { id: Math.random().toString(36).substring(2), symbol: 'x', isTurn: true, wins: 0, lost: 0 };
        clients.set(player.id, this.socket);
        this.queue.push(player);
        if (Object.keys(rooms).length <= 0) {
            const gameId: string =
                Math.random().toString(36).substr(2, 9);
            rooms[gameId] = { roomId: gameId, ownerId: player.id, players: [player], board: board }
            this.listenRooms(gameId)
            this.removeFromQueue(player);
            this.gameMain.sendMessage(player, this.filePath_tictactoe, "tic_tac_toe.Player", player, TICTACTOE_TYPE.PLAYER_X)
        }
        else {
            player.symbol = 'o'
            player.isTurn = false
            this.gameMain.sendMessage(player, this.filePath_tictactoe, "tic_tac_toe.Player", player, TICTACTOE_TYPE.PLAYER_O)
            const key = Object.keys(rooms)[0]
            rooms[key].players.push(player)
            const movetoGames = rooms[key]
            // delete rooms[key]
            games[key] = movetoGames
            const message: any = {
                type: TICTACTOE_TYPE.PLAY_GAME,
                payload: movetoGames
            }
            console.log('games', games)
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
     * Description: handler end game
     * This is a function that handles the end of the game
     */
    private tictactoeEndGame = async () => {
        const message = {
            type: TICTACTOE_TYPE.END_GAME,
        };
        console.log('end game', message)

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
                timeoutId = setTimeout(() => {
                    delete rooms[gameId];
                    clearInterval(intervalId);
                    isTimeoutSet = false;
                }, 30000);
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

        intervalId = setInterval(checkPlayers, 1000);
    }
}
