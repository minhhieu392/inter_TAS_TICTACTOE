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
interface Player {
    id: string;
    symbol: string;
    isTurn: boolean;
    wins: number,
    lost: Number
}

interface Room {
    [roomId: string]: {
        roomId: string,
        ownerId: string,
        players: Player[];
        board: string[]
    }
}
export const games: Room = {}

export default class WSRouter {
    private rooms: Room = {};
    private queue: Player[] = []

    // private games: Room;
    private socket: WebSocket;
    private tictactoeRouter: TictactoeRouter;
    private readonly filePath_tmp = "src/network/grpc/package.proto";
    private readonly filePath_solitaire = "src/network/grpc/solitaire.proto";
    private readonly filePath_tictactoe = "src/network/grpc/tic_tac_toe.proto";
    private readonly packageType_tnp = "hcGames.PackageData";

    constructor(socket: WebSocket) {
        this.socket = socket;
        this.tictactoeRouter = new TictactoeRouter(socket)
    }
    public listeners = () => {

        this.socket.on("message", async (payload) => {
            // const payload: Buffer = Buffer.from('08ab4612210a120a076869657538383812017818012000280012096869657535363637371807', 'hex')
            // const payload: Buffer = Buffer.from('080c1200', 'hex')
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

    private handlersV2 = async (header: Number, payload: any, rawData: any) => {
        this.handlers(header, payload, rawData);
        console.log('dataHandlers', header, payload, rawData)
    };

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
    private findingRoom = async () => {
        let board: string[] = BOARD
        const player: Player = { id: Math.random().toString(36).substring(2), symbol: 'x', isTurn: false, wins: 0, lost: 0 };
        clients.set(player.id, this.socket);
        console.log(`Player ${player.id} connected`)
        this.queue.push(player);
        // this.rooms = {
        //     '195': {
        //         roomId: '195',
        //         ownerId: 'hieuhieu',
        //         players: [{ id: 'hieuhieu', symbol: 'x', isTurn: true, wins: 0, lost: 0 }],
        //         board: board
        //     }
        // };
        if (Object.keys(this.rooms).length <= 0) {
            const gameId: string =
                Math.random().toString(36).substr(2, 9);
            this.rooms[gameId] = { roomId: gameId, ownerId: player.id, players: [player], board: board }
            this.removeFromQueue(player);
            const [errorDataEn, payloadDataEn] = await catchAsync(
                encodeMessage(
                    player,
                    this.filePath_tictactoe,
                    "tic_tac_toe.Player"
                )
            );
            this.socket.send(payloadDataEn);
            console.log('payloadDataEn', payloadDataEn)
            console.log('rooms', this.rooms[gameId].players)
        }
        else {


            player.symbol = 'o'
            const [errorDataEn, payloadDataEn] = await catchAsync(
                encodeMessage(
                    player,
                    this.filePath_tictactoe,
                    "tic_tac_toe.Player"
                )
            );
            this.socket.send(payloadDataEn);
            const key = Object.keys(this.rooms)[0]
            this.rooms[key].players.push(player)
            const movetoGames = this.rooms[key]
            delete this.rooms[key]
            games[key] = movetoGames
            const message: any = {
                type: TICTACTOE_TYPE.PLAY_GAME,
                payload: movetoGames
            }

            this.tictactoeRouter.router(message);
        }
    }
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
        console.log('action game', games)
        if (games.hasOwnProperty(payload.roomId) && this[payload.roomId] ?.players) {
            this.tictactoeRouter.router(message);
        }
        console.log('message', message)
    }
    private tictactoeEndGame = async () => {
        const message = {
            type: TICTACTOE_TYPE.END_GAME,
        };
        console.log('end game', message)

        this.tictactoeRouter.router(message);
    }

    private removeFromQueue(player: Player) {
        const index = this.queue.indexOf(player);
        if (index !== -1) {
            this.queue.splice(index, 1);
        }
    }
}
