import { WebSocket } from 'ws';
import TictactoeController from '../../../controllers/tictactoe.controller';
import logger from '../../../../config/logger';
import { TICTACTOE_TYPE } from '../../../../utils/constants';
import { PayloadHandleEvent, DataAction } from '../../../../games/tictactoe/interface';

class TictactoeRouter {

    private controller: TictactoeController;
    constructor(socket: WebSocket) {
        this.controller = new TictactoeController(socket);
    }
    /**
     * Description : router game tictactoe
     * A function that is being assigned to the router property of the class.
     * @param message 
     * @returns 
     */
    router = (message: { [k: string]: any }) => {
        try {
            const type = message.type;
            if (type === undefined) {
                logger.warn(`[WARN][tictiactoe][Router] - router - Unsupported message type: `, message);
                return;
            }

            let dataPlay = undefined;
            let dataMove = undefined;
            let dataEndGame = undefined;
            let createPvE = undefined;
            if (type === TICTACTOE_TYPE.PLAY_GAME) {
                const { roomId, ownerId, players, board, gameType } = message.payload
                dataPlay = {
                    roomId,
                    ownerId,
                    players,
                    board,
                    gameType
                }
            }
            if (type === TICTACTOE_TYPE.ACTION) {
                const { roomId, player, to } = message
                dataMove = {
                    roomId,
                    player,
                    to
                }
            }
            if (type === TICTACTOE_TYPE.END_GAME) {
                const { roomId, player } = message.data

                dataEndGame = {
                    roomId,
                    player
                }
            }
            if (type === TICTACTOE_TYPE.PvE) {
                const { roomId,
                    groupRoomId,
                    waitingTimeId,
                    userId,
                    status,
                    bonusScore,
                    async } = message.data
                createPvE = {
                    roomId,
                    groupRoomId,
                    waitingTimeId,
                    userId,
                    status,
                    bonusScore,
                    async
                }
            }
            let payload: PayloadHandleEvent = {
                actionType: type,
                data: dataPlay,
                dataMove: dataMove,
                dataEndGame: dataEndGame,
                createPvE: createPvE
            };

            this.controller.handleEvent(payload);
        } catch (error) {
            logger.error('[ERROR][tictactoe][Router] - router - Error: ', error);
        }
    }
    // router = (message: { [k: string]: any }) => {
    //     try {
    //         const { type, payload, data } = message;
    //         console.log('message', message, data)

    //         const dataMap = {
    //             [TICTACTOE_TYPE.PLAY_GAME]: {
    //                 roomId: payload.roomId,
    //                 ownerId: payload.ownerId,
    //                 players: payload.players,
    //                 board: payload.board,
    //                 gameType: payload.gameType
    //             },
    //             [TICTACTOE_TYPE.ACTION]: {
    //                 roomId: data.roomId,
    //                 player: data.player,
    //                 to: data.to
    //             },
    //             [TICTACTOE_TYPE.END_GAME]: {
    //                 roomId: data.roomId,
    //                 player: data.player
    //             },
    //             [TICTACTOE_TYPE.PvE]: {
    //                 roomId: data.roomId,
    //                 groupRoomId: data.gameType,
    //                 waitingTimeId: data.waitingTimeId,
    //                 userId: data.userId,
    //                 status: data.status,
    //                 bonusScore: data.bonusgame,
    //                 async: data.async
    //             }
    //         };
    //         const payloadHandleEvent: PayloadHandleEvent = {
    //             actionType: type,
    //             data: dataMap[type],
    //             dataMove: type === TICTACTOE_TYPE.ACTION ? dataMap[type] : undefined,
    //             dataEndGame: type === TICTACTOE_TYPE.END_GAME ? dataMap[type] : undefined,
    //             createPvE: type === TICTACTOE_TYPE.PvE ? dataMap[type] : undefined
    //         };
    //         this.controller.handleEvent(payloadHandleEvent);
    //     } catch (error) {
    //         logger.error('[ERROR][tictactoe][Router] - router - Error: ', error);
    //     }
    // }


}

export default TictactoeRouter;