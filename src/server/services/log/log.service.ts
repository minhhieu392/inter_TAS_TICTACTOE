import DBClient from '../../../config/postgres';
import { Game, Ledger } from 'server/models';
import logger from '../../../config/logger';

const saveCreateRoom = async (payload: Game) => {
    try {
        //return DBClient.instance.game.create({ data: payload });  
    } catch (error) {
        logger.error('[saveCreateRoom] Error:', error);
    }
};

/**
 * Description: Save log action user
 * Created by: LamHa(09/01/2023)
 * Edited by: NghiaLT(01/02/2023) - change format and change log
 * @param {Ledger} payload
 * @returns {*} 
 */
const save = async (payload: Ledger) => {
    try {
        // return DBClient.instance.ledger.create({ 
        //   data: { 
        //     logType: payload.logType, 
        //     gameType: payload.gameType,
        //     action: payload.action,
        //     data: JSON.stringify(payload.data) 
        //   }
        // });
    } catch (error) {
        logger.error('[save] Error:', error);
    }
};

const _ = {
    saveCreateRoom,
    save
};

export default _;