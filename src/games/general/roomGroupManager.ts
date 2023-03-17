import RoomGroup from './roomGroup';
import RedisClient from '../../config/redis';
import { ResFindRoomGroup, RoomInGroup } from '../../utils/interface';
import { GAME_MODE_TYPE } from '../../utils/constants';
import { pauseFunction } from '../../utils/helpers';
import RedisMatching from '../../config/redisMatching';

export default class RoomGroupManager {
  roomGroups: any;

  constructor() {
    this.roomGroups = new Map();
  }

  add(roomGr: RoomGroup) {
    this.roomGroups.set(roomGr.getId(), roomGr);
  }

  get(id: String) {
    return this.roomGroups.get(id);
  }

  async findRoomGroup(matchingData: any, start = 0) {
    const newStart = start ? start : new Date().getTime();
    const { gameMode, miniGameEventId, numberInMiniGame, gameType, userCodeId } = matchingData;
    let result = null;
    const end = new Date().getTime();
    if (end - newStart > 5000) {
      return result;
    }
    const key = `R1_${gameMode}_${gameType}_${numberInMiniGame}_${miniGameEventId}_*`;
    const scanResult = await RedisMatching.scan(key)
    if (gameMode === GAME_MODE_TYPE.ONE_VS_MANY) {
      for (const roomGrKey of scanResult) {
        const roomGrData = await RedisMatching.hGet(roomGrKey);
        const { id, numberInMiniGame } = roomGrData;
        const membersInGrRoom = await RedisMatching.lRange(`members_in_${id}`);
        if (!membersInGrRoom.find(mem => mem === userCodeId)) {
          const slMembers = await RedisMatching.increment(`CM_${id}`, 1);
          if (+slMembers > +numberInMiniGame) {
            // đã quá số người trong tour
            // TODO: ...
            await pauseFunction(200)
            result = await this.findRoomGroup(matchingData, newStart)
          } else {
            // chưa quá
            // TODO: ...
            result = roomGrData;
            return result;
          }
        }
      }
      if (!result) {
        await pauseFunction(200)
        result = this.findRoomGroup(matchingData, newStart)
      }
    } else {
      const roomGrKey = scanResult[0] || null;
      if (roomGrKey) {
        // validate user in GrRoom;
        const roomGrData = await RedisMatching.hGet(roomGrKey);
        if (roomGrData) {
          const { id, numberInMiniGame } = roomGrData
          if (!await (RedisMatching.exists(`CM_${id}`))) {
            await RedisMatching.setNX(`CM_${id}`, '0');
          };
          const slMembers = await RedisMatching.increment(`CM_${id}`, 1);
          if (+slMembers > +numberInMiniGame) {
            // đã quá số người trong tour
            // TODO: ...
            await pauseFunction(200)
            result = await this.findRoomGroup(matchingData, newStart)
          } else {
            // chưa quá
            // TODO: ...
            result = roomGrData;
          }
        }
      } else {
        await pauseFunction(200)
        result = await this.findRoomGroup(matchingData, newStart)
      }
    }
    return result;
  }

  async findNextRoundRoom(matchingData: any, objResultFindRoomGr: ResFindRoomGroup) {
    let room = null;
    const { gameMode, miniGameEventId, numberInMiniGame, gameType, groupRoomId, userId, round, roomId } = matchingData;
    // const key = `R${round}_${gameMode}_${gameType}_${numberInMiniGame}_${miniGameEventId}_${groupRoomId}`;
    if (gameMode === GAME_MODE_TYPE.ONE_VS_MANY) {
      return room;
    } else {
      const roomsInGrRoom = await RedisMatching.lRange(`rooms_in_${groupRoomId}`);
      for (const roomIdInGr of roomsInGrRoom) {
        const roomData: RoomInGroup = await RedisMatching.hGet(roomIdInGr);
        if (roomId) {
          if (roomId === roomData.id) {
            objResultFindRoomGr.roomId = roomData.id;
            room = roomData
            break;
          }
        } else {
          if (round === +roomData.round) {
            if (userId === roomData.firstUserId || userId === roomData.secondUserId) {
              objResultFindRoomGr.roomId = roomData.id;
              room = roomData
              break;
            }
          }
        }
      };
    }
    return room;
  }
}