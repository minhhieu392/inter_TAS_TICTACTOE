import protobuf from 'protobufjs';
import logger from '../config/logger';
import ApiError from './APIError';
import httpStatus from 'http-status'
import RedisClient from '../config/redis';
import RedisMatching from '../config/redisMatching';
import { RoomInGroup } from './interface';
import axiosService from '../server/services/outgame/axios.service';
import catchAsync from './catchAsync';
import { GAME_MODE_TYPE } from './constants';

export const toArrayBuffer = (data: string): ArrayBufferLike => {
  var len = data.length;
  var bytes = new Uint8Array(len);
  for (var i = 0; i < len; i++) {
    bytes[i] = data.charCodeAt(i);
  }
  return bytes.buffer;
};

export const encodeMessage = async (payload: any, filePath: string, packageType: string): Promise<Uint8Array | null> => {
  try {
    const root = await protobuf.load(filePath);
    const testMessage = root.lookupType(packageType);
    const message = testMessage.create(payload);
    return testMessage.encode(message).finish();
  }
  catch (error) {
    logger.error(`[encodeMessage] issue: ${error}`);
    throw new ApiError(httpStatus.NOT_ACCEPTABLE, 'Can not encrypt message');
  }
}

export const decodeMessage = async (buffer: any, filePath: string, packageType: string): Promise<{ [k: string]: any } | null> => {
  try {
    const root = await protobuf.load(filePath);
    const testMessage = root.lookupType(packageType);
    testMessage.verify(buffer);
    const message = testMessage.decode(buffer);
    return testMessage.toObject(message);
  }
  catch (error) {
    console.log("err", error)
    logger.error(`[decodeMessage] issue: ${error}`);
    throw new ApiError(httpStatus.BAD_REQUEST, 'Can not decode message');
  }
}

export const sortGetFinalTourResult = async (cloneMembersInGr = [], membersInGr = [], roomsInGr = [], gameModecheck?) => {
  // bubble sort
  // TODO: refactor later
  const countWinner = {};
  const countTime = {};
  const countPoint = {};
  const finalArr = [];
  const countMatch = {}
  for (const roomKey of roomsInGr) {
    const roomData: RoomInGroup = await RedisMatching.hGet(roomKey);
    if (gameModecheck && +gameModecheck === GAME_MODE_TYPE.ONE_VS_MANY) {
      // if (!roomData || !roomData.firstUserPoint || !roomData.firstUserPlayTime) return 
      if(!roomData.firstUserPoint) {
        roomData.firstUserPoint = 0;
      }
      if (!roomData.firstUserPlayTime) {
        roomData.firstUserPlayTime = 0;
      }
    }
    if (!roomData || !roomData.userIdWin) return
    if (!countWinner[roomData.userIdWin]) {
      countWinner[roomData.userIdWin] = 1
    } else {
      countWinner[roomData.userIdWin] = countWinner[roomData.userIdWin] + 1;
    }
    if (!countMatch[roomData.firstUserId]) {
      countMatch[roomData.firstUserId] = 1
    } else {
      countMatch[roomData.firstUserId] = countMatch[roomData.firstUserId] + 1;
    }
    if (!countMatch[roomData.secondUserId]) {
      countMatch[roomData.secondUserId] = 1
    } else {
      countMatch[roomData.secondUserId] = countMatch[roomData.secondUserId] + 1;
    }
    if (!countTime[roomData.firstUserId]) {
      countTime[roomData.firstUserId] = roomData.firstUserPlayTime
    } else {
      countTime[roomData.firstUserId] = countTime[roomData.firstUserId] + roomData.firstUserPlayTime;
    }
    if (!countTime[roomData.secondUserId]) {
      countTime[roomData.secondUserId] = roomData.secondUserPlayTime
    } else {
      countTime[roomData.secondUserId] = countTime[roomData.secondUserId] + roomData.secondUserPlayTime;
    };
    if (!countPoint[roomData.firstUserId]) {
      countPoint[roomData.firstUserId] = roomData.firstUserPoint
    } else {
      countPoint[roomData.firstUserId] = countPoint[roomData.firstUserId] + roomData.firstUserPoint;
    }
    if (!countPoint[roomData.secondUserId]) {
      countPoint[roomData.secondUserId] = roomData.secondUserPoint
    } else {
      countPoint[roomData.secondUserId] = countPoint[roomData.secondUserId] + roomData.secondUserPoint;
    }
  }

  for (let i = 0; i < cloneMembersInGr.length; i++) {
    for (let j = 0; j < (cloneMembersInGr.length - i - 1); j++) {
      if (!countWinner[cloneMembersInGr[j]]) countWinner[cloneMembersInGr[j]] = 0;
      if (!countWinner[cloneMembersInGr[j + 1]]) countWinner[cloneMembersInGr[j + 1]] = 0;
      if (countWinner[cloneMembersInGr[j]] > countWinner[cloneMembersInGr[j + 1]]) {
        [cloneMembersInGr[j], cloneMembersInGr[j + 1]] = [cloneMembersInGr[j + 1], cloneMembersInGr[j]];
      } else if (countWinner[cloneMembersInGr[j]] === countWinner[cloneMembersInGr[j + 1]]) {
        // bằng số trận thắng => set số trận tham gia
        if (countMatch[cloneMembersInGr[j]] > countMatch[cloneMembersInGr[j + 1]]) {
          [cloneMembersInGr[j], cloneMembersInGr[j + 1]] = [cloneMembersInGr[j + 1], cloneMembersInGr[j]];
        } else if (countMatch[cloneMembersInGr[j]] === countMatch[cloneMembersInGr[j + 1]]) {
          // bằng số trận thắng => set point
          if (countPoint[cloneMembersInGr[j]] > countPoint[cloneMembersInGr[j + 1]]) {
            [cloneMembersInGr[j], cloneMembersInGr[j + 1]] = [cloneMembersInGr[j + 1], cloneMembersInGr[j]];
          } else if (countPoint[cloneMembersInGr[j]] === countPoint[cloneMembersInGr[j + 1]]) {
            // bằng số point => set đến tgian chơi
            if (countTime[cloneMembersInGr[j]] < countTime[cloneMembersInGr[j + 1]]) {
              [cloneMembersInGr[j], cloneMembersInGr[j + 1]] = [cloneMembersInGr[j + 1], cloneMembersInGr[j]];
            } else if (countTime[cloneMembersInGr[j]] === countTime[cloneMembersInGr[j + 1]]) {
              // bằng số time => ai tham gia trước
              const indexFirstUser = membersInGr.findIndex(mem => mem === cloneMembersInGr[j])
              const indexSecondUser = membersInGr.findIndex(mem => mem === cloneMembersInGr[j + 1])
              if (indexFirstUser < indexSecondUser) {
                [cloneMembersInGr[j], cloneMembersInGr[j + 1]] = [cloneMembersInGr[j + 1], cloneMembersInGr[j]];
              }
            }
          }
        }
      }
    }
  }
  let rank = 1
  for (let i = (cloneMembersInGr.length - 1); i >= 0; i--) {
    finalArr.push({ userId: cloneMembersInGr[i], rank: rank });
    rank++;
  }
  return finalArr
}

export const verifyUserPlayBonusGame = async (userData: any, bonusGameId) => {
  logger.info(`verifyUserPlayBonusGame user: ${JSON.stringify(userData)}, bonusGameId: ${bonusGameId}`);
  const { token, payType } = userData;
  const userLoggin = await RedisClient.hGet(token)
  const userFee: any = await axiosService.postService('/api/verify-user-bonus-game/', {
    userId: userLoggin.userId,
    bonusGameId: bonusGameId,
    type: payType ? payType : 0,
  }, {
    access_token: token,
    deviceId: userLoggin.deviceId,
  });
  return userFee;
}

export const getBufferPayloadDataBonusGame = async (response, filePath, packageType, packageData, packageHeader) => {
  const [error, buffer] = await catchAsync(encodeMessage(response, filePath, packageType));
  const payload = {
    header: packageHeader,
    data: buffer,
  }
  const [errorPayload, bufferPayload] = await catchAsync(encodeMessage(payload, filePath, packageData));
  return bufferPayload
}

export const pauseFunction = (time = 500) => {
  return new Promise(function(resolve, reject) {
    setTimeout(resolve, time);
  });
}