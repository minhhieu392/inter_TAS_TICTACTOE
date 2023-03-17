import { WebSocket } from 'ws';
import _ from 'lodash'
import logger from '../../config/logger';
import { TICTACTOE_TYPE } from '../../utils/constants';
import { PayloadHandleEvent } from '../../games/tictactoe/interface';
import { encodeMessage, decodeMessage } from '../../utils/helpers';
const protobuf = require("protobufjs");
import { clients } from '../../config/websocket'
import { games } from '../routes/v1/websocket/index'
import { WIN_STATES } from '../../utils/constants';
import catchAsync from "../../utils/catchAsync";
class TictactoeController {
    private socket: WebSocket;
    private readonly filePath_tictactoe = "src/network/grpc/tic_tac_toe.proto";
    private readonly packageType_tnp = "hcGames.PackageData";
    private readonly filePath_tmp = "src/network/grpc/package.proto";

    public debug: boolean = false;

    constructor(socket: any) {
        this.socket = socket;
    }

    handleEvent = (payload: PayloadHandleEvent) => {
        try {
            // const cell = 0

            const { actionType } = payload;
            console.log('payload1', payload.data.players)
            console.log('payload2', games, clients)
            if (actionType === TICTACTOE_TYPE.PLAY_GAME) {
                const listPlayer = payload.data.players
                listPlayer.forEach(async (player: any) => {
                    if (clients.has(player.id)) {
                        const toClient = clients.get(player.id)
                        const [errorDataEn, payloadDataEn] = await catchAsync(
                            encodeMessage(
                                payload.data,
                                this.filePath_tictactoe,
                                "tic_tac_toe.Player"
                            )
                        );
                        const message = {
                            header: 7000,
                            data: payloadDataEn,
                        };
                        const [error, payloadEn] = await catchAsync(
                            encodeMessage(
                                message,
                                this.filePath_tmp,
                                this.packageType_tnp
                            )
                        );
                        toClient.send(payloadEn)
                    }
                })
                return
            } else if (actionType === TICTACTOE_TYPE.ACTION) {
                const listPlayer = games[payload.dataMove.roomId].players
                let isWinner = false;
                if (games[payload.dataMove.roomId].players[0].isTurn) {
                    const symbolPlayer: any = payload.dataMove.player
                    games[payload.dataMove.roomId].board[payload.dataMove.to] = symbolPlayer.symbol
                    isWinner = WIN_STATES.some((row) => {
                        return row.every((cell) => {
                            return games[payload.dataMove.roomId].board[cell] == symbolPlayer.symbol ? true : false
                        })
                    })
                    if (isWinner) {
                        this.makeMove(games[payload.dataMove.roomId], payload.dataMove.to)
                        const message = {
                            type: TICTACTOE_TYPE.END_GAME,
                            data: symbolPlayer.symbol,
                        }
                        const listPlayer = games[payload.dataMove.roomId].players
                        listPlayer.forEach(async (player: any) => {
                            if (clients.has(player.id)) {
                                const toClient = clients.get(player.id)
                                const [errorDataEn, payloadDataEn] = await catchAsync(
                                    encodeMessage(
                                        message,
                                        this.filePath_tictactoe,
                                        "tic_tac_toe.sendWinStatus"
                                    )
                                );
                                const sendData = {
                                    header: 7001,
                                    data: payloadDataEn,
                                };
                                const [error, payloadEn] = await catchAsync(
                                    encodeMessage(
                                        sendData,
                                        this.filePath_tmp,
                                        this.packageType_tnp
                                    )
                                );
                                toClient.send(payloadEn)
                            }
                        })
                        delete games[payload.dataMove.roomId]
                        listPlayer.forEach((player) => {
                            clients.delete(player.id)
                        })
                        return
                    }
                    else {
                        const isDraw = WIN_STATES.every((state) => {
                            return (
                                state.some((index) => {
                                    games[payload.dataMove.roomId].board[index] == 'x';
                                })
                                &&
                                state.some((index) => {
                                    return games[payload.dataMove.roomId].board[index] == 'o'
                                })
                            )
                        })
                        if (isDraw) {
                            const message = {
                                type: TICTACTOE_TYPE.END_GAME,
                                data: 'draw'
                            }
                            games[payload.dataMove.roomId].players.forEach(async (player) => {
                                if (clients.has(player.id)) {
                                    const toClient = clients.get(player.id)
                                    const [errorDataEn, payloadDataEn] = await catchAsync(
                                        encodeMessage(
                                            message,
                                            this.filePath_tictactoe,
                                            "tic_tac_toe.sendWinStatus"
                                        )
                                    );
                                    const sendData = {
                                        header: 7002,
                                        data: payloadDataEn,
                                    };
                                    const [error, payloadEn] = await catchAsync(
                                        encodeMessage(
                                            sendData,
                                            this.filePath_tmp,
                                            this.packageType_tnp
                                        )
                                    );
                                    toClient.send(payloadEn)
                                }
                            })
                            delete games[payload.dataMove.roomId]
                            listPlayer.forEach((player) => {
                                clients.delete(player.id)
                            })
                            return
                        }
                    }
                    games[payload.dataMove.roomId].players.map((player) => {
                        player.isTurn = !(player.isTurn)
                    })
                    this.makeMove(games[payload.dataMove.roomId], payload.dataMove.to)
                }
            }
        } catch (error) {
            logger.error("[ERROR][Tictactoe][controller] - handleEvent - Error: ", error);
        }
    }
    makeMove = (game: any, to: any) => {
        const payload = {
            players: game.players,
            to: to
        }
        game.players.forEach(async (player) => {
            if (clients.has(player.id)) {
                const toClient = clients.get(player.id)

                const [errorDataEn, payloadDataEn] = await catchAsync(
                    encodeMessage(
                        payload,
                        this.filePath_tictactoe,
                        "tic_tac_toe.sendDataAction"
                    )
                );
                const sendData = {
                    header: 7003,
                    data: payloadDataEn,
                };
                const [error, payloadEn] = await catchAsync(
                    encodeMessage(
                        sendData,
                        this.filePath_tmp,
                        this.packageType_tnp
                    )
                );
                toClient.send(payloadEn)
            }
        })
    }



}

export default TictactoeController;