import { WebSocket } from 'ws';
import TictactoeController from '../../../controllers/tictactoe.controller';
import logger from '../../../../config/logger';
import { TICTACTOE_TYPE } from '../../../../utils/constants';
import { Ledger } from 'server/models';
import { LogService } from '../../../services';
import { PayloadHandleEvent, DataAction } from '../../../../games/tictactoe/interface';

class TictactoeRouter {

    private controller: TictactoeController;

    constructor(socket: WebSocket) {
        this.controller = new TictactoeController(socket);
    }

    router = (message: { [k: string]: any }) => {
        try {
            console.log('routermess', message)
            const type = message.type;
            if (type === undefined) {
                logger.warn(`[WARN][tictiactoe][Router] - router - Unsupported message type: `, message);
                return;
            }

            let dataPlay = undefined;
            let dataMove = undefined;
            if (type === TICTACTOE_TYPE.PLAY_GAME) {
                const roomId = message.payload.roomId;
                const ownerId = message.payload.ownerId;
                const players = message.payload.players;
                const board = message.payload.board;
                dataPlay = {
                    roomId,
                    ownerId,
                    players,
                    board
                }
            }
            if (type === TICTACTOE_TYPE.ACTION) {
                const roomId = message.payload.roomId;
                const player = message.payload.player;
                const to = message.payload.to;
                dataMove = {
                    roomId,
                    player,
                    to
                }
            }

            let payload: PayloadHandleEvent = {
                actionType: type,
                data: dataPlay,
                dataMove: dataMove
            };

            this.controller.handleEvent(payload);
        } catch (error) {
            logger.error('[ERROR][tictactoe][Router] - router - Error: ', error);
        }
    }

}

export default TictactoeRouter;