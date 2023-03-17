import RedisClient from '../../../config/redis';
import logger from '../../../config/logger';
import RestClient from '../../../config/restClient';
import { UserResponse } from '../../models'
import ApiError from '../../../utils/APIError';
import {
  ParamsCreateRoom, ParamsJoinRoom, ParamsEndRoom,
  ParamsEndUser, ParamsValidateUser
} from '../types/interface';

import fs from 'fs';
import path from 'path';
import { RoomInGroup } from "utils/interface";
import RedisMatching from '../../../config/redisMatching';

class Outgame {
  private tokenRest: string;

  constructor() {
    this.tokenRest = 'create_token_c405a57714e888b441eefa2d8cf2b76b5c7285613d303ac8f2fb00499cc8941c';
  }

  /**
   * Description: Function send data create room
   * Created by: LamHa(18/01/2023)
   * Edited by: NghiaLT(01/02/2023) - change format code
   * @param {ParamsCreateRoom} params
   */
  createRoom = async (params: ParamsCreateRoom) => {
    try {
      // process params
      params = {
        ...params,
        ...params.groupRoomId === undefined ? { groupRoomId: '-1' } : {},
        ...params.round === undefined ? { round: 1 } : {},
        ...params.positionUser === undefined ? { positionUser: 1 } : {},
        ...params.positionRoom === undefined ? { positionRoom: 0 } : {},
      }
      console.log("[INFO][Outgame] params create: ", JSON.stringify(params, null, 4));
      const response = await RestClient.post('create-room', params, this.tokenRest);
      console.log("res", response);

      return response;
    } catch (error) {
      logger.error('[ERROR][Outgame] - createRoom - Error: ', error);
      console.log("reslog", error);

    }
  }

  /**
   * Description: Function send data join room
   * Created by: LamHa(18/01/2023)
   * Edited by: NghiaLT(01/02/2023) - change format code
   * @param {ParamsCreateRoom} params
   */
  joinRoom = async (params: ParamsJoinRoom) => {
    try {
      // process params
      params = {
        ...params,
        ...params.groupRoomId === undefined ? { groupRoomId: '-1' } : {},
        ...params.positionRoom === undefined ? { positionUser: 1 } : { positionUser: params.positionRoom || 1 },
      }

      const response = await RestClient.post('join-room', params, this.tokenRest);
      return response;
    } catch (error) {
      logger.error('[ERROR][Outgame] - joinRoom - Error: ', error);
    }
  }

  /**
   * Description: Function send data end user
   * Created by: LamHa(09/01/2023)
   * Edited by: NghiaLT(01/02/2023) - change format code
   * @param {ParamsCreateRoom} params
   */
  endUser = async (params: ParamsEndUser) => {
    try {
      // process params
      params = {
        ...params,
        ...params.playTime === undefined ? { playTime: 0 } : {},
        ...params.point === undefined ? { point: 0 } : {},
      }

      const response = await RestClient.post('end-user', params, this.tokenRest);
      return response;
    } catch (error) {
      logger.error('[ERROR][Outgame] - endUser - Error: ', error);
    }
  }

  /**
   * Description: Function send data end room
   * Created by: LamHa(09/01/2023)
   * Edited by: NghiaLT(01/02/2023) - change format code
   * @param {*} params
   * @returns {*}  {Promise<void>}
   */
  async endRoom(params: ParamsEndRoom): Promise<void> {
    try {
      // process params
      params = {
        ...params,
        ...params.nextRound === undefined ? { nextRound: 0 } : {},
        ...params.positionRoom === undefined ? { positionRoom: 0 } : {},
        ...params.positionUser === undefined ? { positionUser: 0 } : {},
      }

      await RedisClient.publish('end-room', params);
    } catch (error) {
      logger.error('[ERROR][Outgame] - endRoom - Error: ', error);
    }
  }

  /**
   * Created by: QuangBM(12/02/2023)
   * @param groupRoomId 
   * @param ranks 
   */
  async endGroupRoom(groupRoomId: string, ranks: any): Promise<void> {
    try {
      const obj = {
        groupRoomId,
        ranks,
      }
      await RedisClient.publish('end-group-room', obj);
    } catch (error) {
      logger.error('[ERROR][Outgame] - endGroupRoom - Error: ', error);
    }
  }

  /**
   * Description: Function call AP validate user
   * Created by: LamHa(18/01/2023)
   * Edited by: NghiaLT(01/02/2023) - change format code
   * @param params
   * @param token 
   * @returns 
   */
  async validateUser(params: ParamsValidateUser, token: string): Promise<UserResponse | ApiError | any> {
    try {
      params = {
        ...params,
        ...params.round === undefined ? { round: 1 } : {}
      }

      return RestClient.post<UserResponse>('verify-user/matching', params, token);
    } catch (error) {
      logger.error('[ERROR][Outgame] - validateUser - Error: ', error);
    }
  }

  /**
   * Description: Function publish message get config bonus game
   * Created by: QuangBM
   */
  async pubBonusGame() {
    try {
      await RedisClient.publish('bonus-game-server-start', null);
    } catch (error) {
      logger.error('[bonus-game-server-start] Error: ', error);
    }
  }

  /**
   * Description: Function subscrib message get config bonus game
   * Created by: QuangBM
   */
  async subBonusGame() {
    try {
      await RedisClient.subscriber.subscribe('bonus-game-setting', async (error, data) => {
        if (error) console.log(error.message);
        const filePath = path.join(__dirname, '../../../resource/config/bonusgame.json')
        await fs.writeFileSync(filePath, JSON.stringify(data), 'utf8');
      })
    } catch (error) {
      logger.error('[bonus-game-setting] Error: ', error);
    }
  }

  /**
   * Description: Function publish result game bonus
   * Created by: QuangBM
   * @param {Object} data 
   */
  async pubEndBonusGame(data) {
    try {
      await RedisClient.publish('end-bonus-game-event', data);
    } catch (error) {
      logger.error('[pubEndBonusGame] Error: ', error);
    }
  }

  async verifyRound(req, res) {
    let endDate = null;
    try {
      const { userCodeId, round, groupRoomId, miniGameEventId, numberInMiniGame, gameType, gameMode } = req.query;
      const keys = `R${+round + 1}_${gameMode}_${gameType}_${numberInMiniGame}_${miniGameEventId}_${groupRoomId}`;
      const roomGrData = await RedisMatching.hGet(keys);
      if (roomGrData) {
        const roomsInGrRoom = await RedisMatching.lRange(`rooms_in_${groupRoomId}`);
        for (const roomId of roomsInGrRoom) {
          const roomData: RoomInGroup = await RedisMatching.hGet(roomId);
          if (roomData.firstUserId === userCodeId || roomData.secondUserId === userCodeId) {
            if (roomData.userIdWin && roomData.userIdWin !== userCodeId) {
              endDate = null;
              break;
            } else {
              const a = new Date(roomGrData.createdDate);
              a.setHours(a.getHours() + 16);
              const x1 = a.getTime();
              const x2 = new Date().getTime();
              endDate = Math.floor((x1 - x2) / 1000)
            }
          }
        }
      }
    } catch (e) {
      console.log(e);
      endDate = null;
    }
    return res.json({endDate})
  }
}

const singletonOutgame = Object.freeze(new Outgame());
export default singletonOutgame;