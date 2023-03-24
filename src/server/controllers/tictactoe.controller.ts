import { WebSocket } from 'ws';
import _ from 'lodash'
import logger from '../../config/logger';
import { TICTACTOE_TYPE } from '../../utils/constants';
import { PayloadHandleEvent, Player } from '../../games/tictactoe/interface';
import { tictactoeGame } from '../../games/tictactoe/tictactoeGame';


/* The TictactoeController class is a class that has a socket property, a debug property, a gameMain
property, and a constructor that takes a socket parameter and assigns it to the socket property. It
also has a handleEvent method that takes a payload parameter and does something with it. */
class TictactoeController {
    private socket: WebSocket;
    public debug: boolean = false;
    private gameMain = new tictactoeGame()
    constructor(socket: any) {
        this.socket = socket;
    }
    /**
     * Description: A function that takes a payload parameter and does something with it.
     * @param payload 
     * @returns 
     */
    handleEvent = (payload: PayloadHandleEvent) => {
        try {
            const { actionType } = payload;
            if (actionType === TICTACTOE_TYPE.PLAY_GAME) {
                this.gameMain.playGame(payload.data)
                return
            } else if (actionType === TICTACTOE_TYPE.ACTION) {
                this.gameMain.movesAction(payload.dataMove)
            }
            else if (actionType === TICTACTOE_TYPE.END_GAME) {
                this.gameMain.endGame(payload.dataEndGame)
            }
            else if (actionType === TICTACTOE_TYPE.PvE) {
                this.gameMain.createGame(payload.createPvE)
            }
        } catch (error) {
            logger.error("[ERROR][Tictactoe][controller] - handleEvent - Error: ", error);
        }
    }
}

export default TictactoeController;