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
            console.log('routermess', message.to)
            const type = message.type;
            if (type === undefined) {
                logger.warn(`[WARN][tictiactoe][Router] - router - Unsupported message type: `, message);
                return;
            }

            let dataPlay = undefined;
            let dataMove = undefined;
            let dataEndGame = undefined;
            if (type === TICTACTOE_TYPE.PLAY_GAME) {
                const { roomId, ownerId, players, board } = message.payload
                dataPlay = {
                    roomId,
                    ownerId,
                    players,
                    board
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

            let payload: PayloadHandleEvent = {
                actionType: type,
                data: dataPlay,
                dataMove: dataMove,
                dataEndGame: dataEndGame
            };

            this.controller.handleEvent(payload);
        } catch (error) {
            logger.error('[ERROR][tictactoe][Router] - router - Error: ', error);
        }
    }

}

export default TictactoeRouter;