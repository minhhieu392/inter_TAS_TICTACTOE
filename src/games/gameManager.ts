// import { POSITION_JOIN_ROOM, ROOM_WAITING_STATUS } from './../utils/constants';
// // import Billiard from './billiard/billiard';
// import Solitaire from './solitaire/solitaire';
// import Tictactoe from './tictactoe/tictactoe';
// // import Puzzle from './puzzle/puzzle';
// // import BubbleShooter from './bubbleShooter/bubbleShooter';
// import { GAME_TYPE, PACKAGE_HEADER, MATCHING_MMR_RANGE, GAME_MODE_TYPE } from '../utils/constants';
// import { encodeMessage, pauseFunction, sortGetFinalTourResult } from '../utils/helpers';
// // import Bingo from './bingo/bingo';
// import User from './general/user';
// import UserManager from './general/userManager';
// import RoomGroupManager from './general/roomGroupManager';
// import roomGroup from './general/roomGroup';
// import { OutgameService } from '../server/services';
// import {
//     ParamsCreateRoom, ParamsJoinRoom, ParamsEndUser, ParamsEndRoom
// } from '../server/services/types/interface';
// import RedisClient from '../config/redis';
// import Room from './general/room';
// import { v4 as uuidv4 } from 'uuid';
// import { ResFindRoomGroup, RoomInGroup } from './../utils/interface';
// import logger from '../config/logger';
// import RedisMatching from '../config/redisMatching';

// class GameManger {

//     solitaire: Solitaire;
//     tictactoe: Tictactoe;

//     userManager: UserManager;
//     roomGroupManager: RoomGroupManager;

//     waitingQueue: any = {};
//     waitingMiniGameQueue: any = {};

//     // tmp code
//     public static readonly filePath = 'src/network/grpc/package.proto';
//     public static readonly filePath_solitare = 'src/network/grpc/solitare.proto';

//     constructor() {
//         // this.billiard = new Billiard();
//         this.solitaire = new Solitaire();
//         this.tictactoe = new Tictactoe();
//         this.userManager = new UserManager();
//         this.roomGroupManager = new RoomGroupManager();
//         // render waiting queue
//         // this.renderQueue();
//         RedisClient.subscriber.subscribe('update-room', async (data, error) => {
//             if (error) console.log("error update-room::::", error);
//             await this.updateRoomData(JSON.parse(data));
//         });
//         RedisClient.subscriber.subscribe("__keyevent@0__:expired", async (key) => {
//             // await this.expiredTour(key)
//         })
//     }

//     private renderQueue() {
//         const keys = Object.keys(GAME_TYPE)
//             .filter(key => Number.isNaN(Number(key)));

//         for (let key of keys) {
//             if (key !== 'NONE') {
//                 this.waitingQueue[key] = [];
//                 for (let i = 0; i < MATCHING_MMR_RANGE.length; i++) {
//                     this.waitingQueue[key].push([]);
//                 };
//             }
//         }
//     }

//     /**
//      * 
//      * @param groupRoomId 
//      */
//     private async checkRoomGr(groupRoomId: string) {
//         const pattern = `R*${groupRoomId}`;
//         const results = await RedisMatching.scan(pattern);
//         const roomGrKey = results[0] || null;
//         if (roomGrKey) {
//             const roomGrData = await RedisMatching.hGet(roomGrKey);
//             const { gameMode } = roomGrData
//             const gameModecheck = +gameMode;
//             switch (gameModecheck) {
//                 case GAME_MODE_TYPE.ROUND_ROBIN: {
//                     await this.endRoundRobinAndOneToManyMode(roomGrData, roomGrKey, gameModecheck);
//                     break;
//                 }
//                 case GAME_MODE_TYPE.KNOCKOUT_ROUND_TOUR: {
//                     await this.endKnockoutMode(roomGrData, roomGrKey);
//                     break;
//                 }
//                 case GAME_MODE_TYPE.ONE_VS_MANY: {
//                     await this.endRoundRobinAndOneToManyMode(roomGrData, roomGrKey, gameModecheck);
//                     break;
//                 }
//                 default:
//                     break;
//             }
//         }
//     }

//     /**
//      * 
//      * @param roomGrData 
//      * @param roomGrKey 
//      * @param gameModecheck 
//      * @returns 
//      */
//     private async endRoundRobinAndOneToManyMode(roomGrData, roomGrKey, gameModecheck) {
//         const { id, numberInMiniGame } = roomGrData;
//         const roomsInGr = await RedisMatching.lRange(`rooms_in_${id}`)
//         const membersInGr = await RedisMatching.lRange(`members_in_${id}`)
//         const cloneMembersInGr = [...membersInGr];
//         let maxRoom = 0;
//         if (gameModecheck === GAME_MODE_TYPE.ROUND_ROBIN) {
//             maxRoom = ((numberInMiniGame) * (numberInMiniGame - 1)) / 2;
//         }
//         if (gameModecheck === GAME_MODE_TYPE.ONE_VS_MANY) {
//             maxRoom = numberInMiniGame;
//         }
//         if (roomsInGr.length < maxRoom) return;
//         const afterSort = await sortGetFinalTourResult(cloneMembersInGr, membersInGr, roomsInGr, gameModecheck);
//         if (afterSort && afterSort.length) {
//             await RedisMatching.setNX(`FLAG_${id}`, '0');
//             const countFlag = await RedisMatching.increment(`FLAG_${id}`, 1);
//             if (+countFlag === 1) {
//                 const listKey = [`TTL_${roomGrKey}`, roomGrKey, `members_in_${id}`, `rooms_in_${id}`, `CM_${id}`];
//                 await RedisMatching.del(listKey)
//                 for (const roomId of roomsInGr) {
//                     const listFields = await RedisMatching.hKeys(roomId);
//                     if (listFields && listFields.length) {
//                         for (const field of listFields) {
//                             await RedisMatching.hDel(roomId, field);
//                         }
//                     };
//                     await RedisMatching.del(roomId)
//                 }
//                 // await RedisMatching.del([...roomsInGr, `TTL_${roomGrKey}`, roomGrKey, `members_in_${id}`, `rooms_in_${id}`, `CM_${id}`]);
//                 await OutgameService.endGroupRoom(id, afterSort)
//                 await RedisMatching.del(`FLAG_${id}`)
//             }
//         }
//         // TODO: Send data to CMS
//     }

//     /**
//      * 
//      * @param roomGrData 
//      * @param roomGrKey 
//      * @returns 
//      */
//     private async endKnockoutMode(roomGrData, roomGrKey) {
//         const { id, numberInMiniGame } = roomGrData;
//         let finish = false;
//         let finishIfExpired = false;
//         const listUserWinId = [];
//         const listUserJoinRoomLeft = [];
//         const rooms = [];
//         const keysList = roomGrKey.split('_');
//         const roundNumber: number = Number(keysList[0].replace(/^\D+/g, ''));
//         const roomsInGr = await RedisMatching.lRange(`rooms_in_${id}`);
//         const membersInGr = await RedisMatching.lRange(`members_in_${id}`)
//         let totalMatch = numberInMiniGame;
//         for (let i = 0; i < roundNumber; i++) {
//             totalMatch = totalMatch / 2;
//         }

//         let countDoneRoom: number = 0;
//         for (const roomKey of roomsInGr) {
//             const roomData: RoomInGroup = await RedisMatching.hGet(roomKey);
//             // if (!roomData || !roomData.userIdWin) return
//             if (roundNumber > 1) {
//                 if (!roomData.round || +roomData.round !== roundNumber) continue;
//             }
//             if (roomData.userIdWin) {
//                 countDoneRoom++;
//                 listUserWinId.push(roomData.userIdWin);
//             } else {
//                 // listUserJoinRoomLeft
//                 if (roomData.firstUserId) listUserJoinRoomLeft.push(roomData.firstUserId);
//                 if (roomData.secondUserId) listUserJoinRoomLeft.push(roomData.secondUserId);
//             }
//         }
//         if (((Math.pow(2, roundNumber) * countDoneRoom) + listUserJoinRoomLeft.length) > (+numberInMiniGame / 2)) {
//             finishIfExpired = true;
//         }
//         if (countDoneRoom === totalMatch) {
//             // room done
//             finish = true
//             if (listUserWinId.length === 1) {
//                 // vô địch
//                 // TODO: send data vo dich
//                 await RedisMatching.setNX(`FLAG_${id}`, '0');
//                 const countFlag = await RedisMatching.increment(`FLAG_${id}`, 1);
//                 if (+countFlag === 1) {
//                     const cloneMembersInGr = [...membersInGr];
//                     const afterSort = await sortGetFinalTourResult(cloneMembersInGr, membersInGr, roomsInGr);
//                     if (afterSort && afterSort.length) {
//                         const listDelKey = [`TTL_${roomGrKey}`, roomGrKey, `members_in_${id}`, `rooms_in_${id}`, `CM_${id}`];
//                         await RedisMatching.del(listDelKey)
//                         for (const roomId of roomsInGr) {
//                             const listFields = await RedisMatching.hKeys(roomId);
//                             if (listFields && listFields.length) {
//                                 for (const field of listFields) {
//                                     await RedisMatching.hDel(roomId, field);
//                                 }
//                             };
//                             await RedisMatching.del(roomId)
//                         }
//                         await OutgameService.endGroupRoom(id, afterSort);
//                         await RedisMatching.del(`FLAG_${id}`)
//                     }
//                 }
//             } else {
//                 for (let i = 0; i < listUserWinId.length; i++) {
//                     const firstUserId = listUserWinId[i];
//                     const secondUserId = listUserWinId[i + 1];
//                     i++;
//                     const room: RoomInGroup = {
//                         id: uuidv4(),
//                         firstUserId,
//                         secondUserId,
//                         createdDate: (new Date()).toISOString(),
//                         round: roundNumber + 1,
//                     }
//                     rooms.push(room);
//                     await RedisMatching.rPush(`rooms_in_${id}`, room ?.id);
//                     await RedisMatching.hSetObject(room ?.id, room)
//                 }
//                 keysList[0] = `R${roundNumber + 1}`;
//                 const newKey = keysList.join('_');
//                 await RedisMatching.del(roomGrKey);
//                 await RedisMatching.del(`CM_${id}`)
//                 await RedisMatching.del(`TTL_${roomGrKey}`)
//                 await RedisMatching.hSetObject(newKey, roomGrData);
//                 await RedisMatching.setEX(`TTL_${newKey}`, 16 * 60 * 60, '1')
//             }
//         }
//         return { finish, listUserWinId, listUserJoinRoomLeft };
//     }


//     public async updateRoomData(data: any) {
//         const { groupRoomId, roomId, result, otherPlayerResult } = data;
//         const { userId, points, timePlay, pointGameLogic } = result;

//         // end user
//         const paramsEndUser: ParamsEndUser = {
//             userId,
//             roomId,
//             playTime: timePlay,
//             point: points,
//             pointGameLogic: pointGameLogic || '',
//         }
//         const responseEndUser = await OutgameService.endUser(paramsEndUser);
//         logger.info(`[INFO][Matching] - updateRoomData - end user: ${JSON.stringify(responseEndUser)}`);

//         if (responseEndUser === "OK") {
//             // TODO: verify room in group room
//             if (groupRoomId) {
//                 const roomData: RoomInGroup = await RedisMatching.hGet(roomId);
//                 if (!roomData.userStartRoom) await RedisMatching.hSet(roomId, 'userStartRoom', userId);
//                 if (userId === roomData.firstUserId) {
//                     await RedisMatching.hSet(roomId, 'firstUserPoint', points)
//                     await RedisMatching.hSet(roomId, 'firstUserPlayTime', timePlay)
//                 }
//                 if (userId === roomData.secondUserId) {
//                     await RedisMatching.hSet(roomId, 'secondUserPoint', points)
//                     await RedisMatching.hSet(roomId, 'secondUserPlayTime', timePlay)
//                 }
//                 await this.updateWinnerInRoom(roomId, groupRoomId);
//                 await this.checkRoomGr(groupRoomId)
//             } else {
//                 let cmKey = '';
//                 if (roomId) {
//                     const exists = await RedisMatching.exists(roomId)
//                     if (exists) {
//                         const roomData = await RedisMatching.hGet(roomId);
//                         cmKey = roomData.id;
//                         if (userId === roomData.firstUserId) roomData.firstUserPoint = points; roomData.firstUserPlayTime = timePlay;
//                         if (userId === roomData.secondUserId) roomData.secondUserPoint = points; roomData.secondUserPlayTime = timePlay;
//                         await RedisMatching.hSetObject(roomId, roomData)
//                     }
//                 }

//                 // check result
//                 let userWin = '';
//                 if (otherPlayerResult) {
//                     if (points > otherPlayerResult.points) {
//                         userWin = userId;
//                     } else if (points < otherPlayerResult.points) {
//                         userWin = otherPlayerResult.userId;
//                     } else if (timePlay > otherPlayerResult.timePlay) {
//                         userWin = otherPlayerResult.userId;
//                     } else if (timePlay < otherPlayerResult.timePlay) {
//                         userWin = userId;
//                     } else {
//                         userWin = otherPlayerResult.userId
//                     }

//                     // end room
//                     const paramsEndRoom: ParamsEndRoom = {
//                         roomId,
//                         userIdWin: userWin
//                     }
//                     await OutgameService.endRoom(paramsEndRoom);

//                     if (roomId) {
//                         await RedisMatching.del(roomId);
//                         await RedisMatching.del(`CM_${roomId}`);
//                     }
//                 }
//             }
//         }
//     }

//     /**
//      * 
//      * @param roomId 
//      */
//     public async delKeyRoom(roomId) {
//         const pattern = `*${roomId}`;
//         const listKeys = await RedisMatching.scan(pattern);
//         for (const key of listKeys) {
//             await RedisMatching.del(key)
//         }
//     }

//     /**
//      * 
//      * @param searchingData 
//      * @returns 
//      */
//     public getWaitingQueue(searchingData: any) {
//         if (searchingData) {
//             const { gameType, mmr, ccData } = searchingData;
//             const { miniGameEventId } = ccData;
//             const { itemMMR } = this.findMMR(mmr);
//             const key = `${GAME_TYPE[gameType]}_${miniGameEventId}_${itemMMR.from}`;
//             if (!this.waitingQueue[key]) this.waitingQueue[key] = [];
//             return this.waitingQueue[key];
//         }
//         return this.waitingQueue;
//     }

//     /**
//      * 
//      * @param user 
//      * @param msg 
//      * @returns 
//      */
//     public async addingQueue(user: User, msg: any) {
//         const { gameType, mmr, ccData } = msg;
//         const { miniGameEventId } = ccData;
//         const { itemMMR } = this.findMMR(mmr);
//         const key = `${GAME_TYPE[gameType]}_${miniGameEventId}_${itemMMR.from}`;
//         if (!this.waitingQueue[key]) {
//             this.waitingQueue[key] = []
//         }
//         this.waitingQueue[key].push(user);
//         logger.info(`[QUEUE] ${user.getId()}: ${JSON.stringify(this.waitingQueue)}`);
//         return null;
//     }

//     public getGameType(gameType) {
//         return GAME_TYPE[gameType]
//     }

//     public async searchingForAsyncRoom(user: User, msg: any, start?: any) {
//         let startTime = start ? start : new Date().getTime();
//         const { gameType, mmr, ccData } = msg;
//         const { miniGameEventId } = ccData;
//         const { itemMMR } = this.findMMR(mmr);
//         const patternScan = `TTL_ROOM_${gameType}_${miniGameEventId}_${itemMMR.from}_*`;
//         const results = await RedisMatching.scan(patternScan);
//         console.log(`[FINDING ${this.getGameType(gameType)}] scan result `, results);
//         for (const roomKey of results) {
//             const end = new Date().getTime();
//             const timeDiff = end - startTime;
//             if (timeDiff >= 10000) {
//                 return null;
//             }
//             const exist = await RedisMatching.exists(roomKey);
//             console.log(`[FINDING ${this.getGameType(gameType)}] exist `, exist);
//             if (exist) {
//                 const roomId = roomKey.split('_').pop();
//                 const roomData = await RedisMatching.hGet(roomId);
//                 console.log(`[FINDING ${this.getGameType(gameType)}] roomData `, roomData);
//                 if (roomData ?.firstUserId !== user.getId()) {
//                     const slMembers = await RedisMatching.increment(`CM_${roomId}`, 1);
//                     if (+slMembers > 2) {
//                         // đã quá số người trong tour
//                         await RedisMatching.del(roomKey);
//                     } else {
//                         await RedisMatching.del(roomKey);
//                         const response: ResFindRoomGroup = {
//                             roomId: roomData.id,
//                             status: 'JOIN',
//                             firstUserId: roomData.firstUserId || null,
//                             typeRoom: 1, // 1 là bất đồng bộ, 2 là đồng bộ
//                             firstUserPoint: roomData.firstUserPoint || null,
//                             firstUserPlayTime: roomData.firstUserPlayTime || null,
//                             round: 1,
//                         };
//                         // join room
//                         const paramsJoinRoom: ParamsJoinRoom = {
//                             miniGameEventId,
//                             roomId: roomData.id,
//                             groupRoomId: '-1',
//                             userId: user.getId(),
//                             positionRoom: POSITION_JOIN_ROOM.SECOND_JOIN
//                         }
//                         const responseJoin = await OutgameService.joinRoom(paramsJoinRoom);
//                         logger.info(`[INFO][Matching] - addingQueue - outgame join room: ${JSON.stringify(responseJoin)}`);
//                         return response
//                     }
//                 }
//             }
//         }
//         return null;
//     }

//     getSolitaire() {
//         return this.solitaire;
//     }
//     getTictactoe() {
//         return this.tictactoe;
//     }

//     /**
//      * Description: Function create room mode head to head
//      * Created by: QuangBM(10/02/2023)
//      * Edited by: NghiaLT(17/02/2023) - edit pipeline run mode head to head
//      * @param users Class User
//      * @param gameType Number
//      * @param typeRoom Number (1: Đồng bộ, 2: Bất đồng bộ)
//      */
//     public async createRoomHeadToHead(searchingData, users: Array<User>, gameType, typeRoom) {
//         const roomId = uuidv4();
//         const { mmr, ccData } = searchingData;
//         const { miniGameEventId } = ccData;
//         const firstUser: User = users[0];

//         const roomInfo: ResFindRoomGroup = {
//             roomId,
//             status: "CREATE",
//             firstUserId: firstUser.getId(),
//             firstUser,
//             typeRoom,
//             round: 1
//         }

//         // create room out game
//         const paramsCreateRoom: ParamsCreateRoom = {
//             miniGameEventId,
//             roomId,
//             groupRoomId: '-1',
//             userId: firstUser.getId(),
//             typeRoom: typeRoom,
//             round: 1,
//             positionUser: POSITION_JOIN_ROOM.FIRST_JOIN,
//             positionRoom: 1,
//         }
//         const response = await OutgameService.createRoom(paramsCreateRoom);
//         logger.info(`[INFO][Matching] - createRoomHeadToHead - outgame create room: ${JSON.stringify(response)}`);

//         // process join room or save room in redis
//         if (response === "OK") {
//             if (users.length > 1) {
//                 // Add info to roomInfo
//                 const secondUser: User = users[1];
//                 roomInfo.secondUserId = secondUser.getId();
//                 roomInfo.secondUser = secondUser;

//                 // join room out game
//                 const paramsJoinRoom: ParamsJoinRoom = {
//                     miniGameEventId,
//                     roomId,
//                     groupRoomId: '-1',
//                     userId: secondUser.getId(),
//                     positionRoom: POSITION_JOIN_ROOM.SECOND_JOIN
//                 }
//                 const responseJoin = await OutgameService.joinRoom(paramsJoinRoom);
//                 logger.info(`[INFO][Matching] - createRoomHeadToHead - outgame join room: ${JSON.stringify(responseJoin)}`);
//             } else {
//                 // store room in redis
//                 const { indexMMR } = this.findMMR(mmr);
//                 const key = `ROOM_${gameType}_${miniGameEventId}_${MATCHING_MMR_RANGE[indexMMR].from}_${roomId}`;
//                 const setObject = {
//                     id: roomId,
//                     createdDate: (new Date()).toISOString(),
//                     firstUserId: firstUser.getId(),
//                     status: ROOM_WAITING_STATUS.READY,
//                 }

//                 await RedisMatching.setNX(`CM_${roomId}`, '1');
//                 await RedisMatching.setEX(`TTL_${key}`, 7 * 24 * 60 * 60, '1');
//                 // await RedisMatching.setEX(key, 7 * 24 * 60 * 60, '1');
//                 await RedisMatching.hSetObject(roomId, setObject);
//             }
//         }
//         await this.createRoomV2(gameType, miniGameEventId, roomInfo);
//     }

//     /**
//      * Description: Function find index mmr
//      * Created by: QuangBM(10/02/2023)
//      * @param mmr 
//      * @returns 
//      */
//     findMMR(mmr) {
//         let indexMMR = MATCHING_MMR_RANGE.findIndex((ele) => {
//             return ele.from <= mmr && ele.to && ele.to >= mmr;
//         });
//         if (indexMMR < 0) {
//             indexMMR = MATCHING_MMR_RANGE.length - 1;
//         }

//         return {
//             itemMMR: MATCHING_MMR_RANGE[indexMMR],
//             indexMMR
//         }
//     }

//     /**
//      * Description: Function create room version 2
//      * Created by: NghiaLT(09/02/2023)
//      * @param gameType
//      * @param miniGameEventId
//      * @param roomInfo 
//      */
//     public async createRoomV2(gameType: number, miniGameEventId: number, roomInfo: ResFindRoomGroup) {
//         let room = null;
//         switch (gameType) {

//             case GAME_TYPE.SOLITAIRE: {
//                 room = await this.solitaire.joinRoom(miniGameEventId, roomInfo);
//             } break;
//             case GAME_TYPE.TICTACTOE: {
//                 // room = await this.tictactoe.joinRoom(miniGameEventId, roomInfo);
//             } break;
//         }
//         const { firstUser, secondUser } = roomInfo;
//         const roomId = room ? room.getId() : null;

//         // add user and send room to user
//         if (!!firstUser) {
//             firstUser.setRoom(room);
//             this.userManager.add(firstUser);
//             // send message to user
//             const findingRoomResp = {
//                 roomId,
//                 otherPlayerName: secondUser ? secondUser.getNickname() : null,
//                 mode: roomInfo.typeRoom,
//             };
//             const buffer = await encodeMessage(findingRoomResp, GameManger.filePath, 'hcGames.FindingRoomResponse');
//             this.sendPackageToUser(firstUser, PACKAGE_HEADER.FINDING_ROOM_RESP, buffer);
//         }
//         if (!!secondUser) {
//             secondUser.setRoom(room);
//             this.userManager.add(secondUser);
//             // send message to user
//             const findingRoomResp = {
//                 roomId,
//                 otherPlayerName: firstUser ? firstUser.getNickname() : null,
//                 mode: roomInfo.typeRoom,
//             };
//             const buffer = await encodeMessage(findingRoomResp, GameManger.filePath, 'hcGames.FindingRoomResponse');
//             this.sendPackageToUser(secondUser, PACKAGE_HEADER.FINDING_ROOM_RESP, buffer);
//         }
//     }

//     /**
//      * Description: Function process socket user disconnected
//      * Created by: NghiaLT(24/02/2023)
//      * @param socket 
//      * @returns 
//      */
//     public userDisconnected(socket: any) {
//         const user: User = this.userManager.get(socket);
//         if (!user) {
//             console.log(111, 'GameManger.clientDisconnected -> user not found!');
//             return;
//         }
//         switch (user.getGameType()) {

//             case GAME_TYPE.SOLITAIRE: {
//                 this.solitaire.userDisconnected(user);
//             } break;
//             case GAME_TYPE.TICTACTOE: {
//                 // this.tictactoe.userDisconnected(user);
//             } break;
//             default:
//                 break;
//         }
//         this.userManager.delete(socket);
//     }

//     public async findRoomGroup(user: User, msg: any, start, callback) {
//         let startTime = start ? start : new Date().getTime();
//         const { ccData } = msg;
//         const { groupRoomId, round } = ccData;
//         if (groupRoomId && round) {
//             this.findNextRoundRoom(user, msg, startTime, callback)
//         } else {
//             this.findRoundOne(user, msg, startTime, callback)
//         }
//     }

//     private updateResultFindRoomByRoomData(objResultFindRoomGr: ResFindRoomGroup, room, user: User) {
//         if (room.firstUserPoint) objResultFindRoomGr.firstUserPoint = room.firstUserPoint
//         if (room.secondUserPoint) objResultFindRoomGr.secondUserPoint = room.secondUserPoint
//         if (room.firstUserPlayTime) objResultFindRoomGr.firstUserPlayTime = room.firstUserPlayTime
//         if (room.secondUserPlayTime) objResultFindRoomGr.secondUserPlayTime = room.secondUserPlayTime
//         if (room.firstUserId) objResultFindRoomGr.firstUserId = room.firstUserId
//         if (room.secondUserId) objResultFindRoomGr.secondUserId = room.secondUserId
//         if (room.firstUserId === user.getId()) {
//             objResultFindRoomGr.firstUser = user;
//             objResultFindRoomGr.secondUser = null
//         } else {
//             objResultFindRoomGr.secondUser = user;
//             objResultFindRoomGr.firstUser = null
//         }
//     }

//     private async getRoomPosAndUserPosNextRound(groupRoomId, user: User, numberInMiniGame, round) {
//         const membersInGrRoom = await RedisMatching.lRange(`members_in_${groupRoomId}`);
//         let indexUserInTour = 0;
//         membersInGrRoom.forEach((mem, index) => {
//             if (mem === user.getId()) {
//                 indexUserInTour = index;
//             }
//         });
//         let maxMatchAtRound = numberInMiniGame;
//         for (let i = 0; i < round; i++) {
//             maxMatchAtRound = maxMatchAtRound / 2
//         };
//         if (maxMatchAtRound < 1) {
//             maxMatchAtRound = 1;
//             // nextRound = 0;
//         }
//         const numberOfMemberInGroup = Math.ceil(numberInMiniGame / maxMatchAtRound);
//         let position = Math.floor(indexUserInTour / numberOfMemberInGroup) + 1;
//         return { position }
//     }

//     public async findNextRoundRoom(user: User, msg: any, start, callback) {
//         const { gameType, ccData } = msg;
//         const { gameMode, miniGameEventId, numberInMiniGame, groupRoomId, round, roomId } = ccData;
//         const objResultFindRoomGr: ResFindRoomGroup = {
//             roomGrId: groupRoomId,
//             roomId: null,
//             status: null,
//             typeRoom: 1,
//             firstUserId: user.getId(),
//             secondUserId: null,
//             round: round,
//         };
//         const matchingData = {
//             gameType,
//             numberInMiniGame,
//             gameMode,
//             miniGameEventId,
//             groupRoomId,
//             userId: user.getId(),
//             round,
//             roomId,
//         };
//         const room: RoomInGroup = await this.roomGroupManager.findNextRoundRoom(matchingData, objResultFindRoomGr);
//         if (room) {
//             objResultFindRoomGr.roomId = room.id;
//             this.updateResultFindRoomByRoomData(objResultFindRoomGr, room, user)
//             if (+gameMode === GAME_MODE_TYPE.ROUND_ROBIN) {
//                 if (!room.userStartRoom) await RedisMatching.hSet(roomId, 'userStartRoom', user.getId());
//                 this.updateResultFindRoomByRoomData(objResultFindRoomGr, room, user);

//                 if (user.getId() === room.secondUserId) {
//                     // user 2 join room;
//                     const paramsJoinRoom: ParamsJoinRoom = {
//                         miniGameEventId,
//                         roomId: room.id,
//                         groupRoomId: objResultFindRoomGr.roomGrId,
//                         userId: user.getId(),
//                         positionRoom: POSITION_JOIN_ROOM.SECOND_JOIN
//                     }
//                     const responseJoin = await OutgameService.joinRoom(paramsJoinRoom);
//                     logger.info(`[INFO][Matching] - findNextRoundRoom - outgame join room: ${JSON.stringify(responseJoin)}`);
//                 }

//                 callback(objResultFindRoomGr)
//                 return;
//             }
//             if (+gameMode === GAME_MODE_TYPE.KNOCKOUT_ROUND_TOUR) {
//                 const { position } = await this.getRoomPosAndUserPosNextRound(groupRoomId, user, numberInMiniGame, round)
//                 objResultFindRoomGr.position = position;
//             }
//             let waitingQueue = [];
//             if (!this.waitingMiniGameQueue[room.id]) {
//                 this.waitingMiniGameQueue[room.id] = [user]
//             } else {
//                 this.waitingMiniGameQueue[room.id].push(user);
//             }
//             waitingQueue = this.waitingMiniGameQueue[room.id]
//             let isStillExist = false;
//             const indexInQueue = waitingQueue.findIndex((u: User) => u.userCodeId === user.getId());
//             if (indexInQueue > 0) { // luôn lấy user index = 0 trong queue ra matching với user hiện tại
//                 const userMatching = [].concat(waitingQueue.splice(indexInQueue, 1)).concat(waitingQueue.splice(0, 1)).reverse();
//                 // create room SYNCHRONOUS
//                 objResultFindRoomGr.typeRoom = 2;
//                 const firstUser = userMatching[0]
//                 objResultFindRoomGr.firstUserId = firstUser.getId();
//                 objResultFindRoomGr.firstUser = firstUser
//                 let positionOfFirstUser = firstUser.getId() === room.firstUserId ? POSITION_JOIN_ROOM.FIRST_JOIN : POSITION_JOIN_ROOM.SECOND_JOIN;
//                 const secondUser = userMatching[1]
//                 objResultFindRoomGr.secondUserId = secondUser.getId();
//                 objResultFindRoomGr.secondUser = secondUser
//                 let positionOfSecondUser = secondUser.getId() === room.secondUserId ? POSITION_JOIN_ROOM.SECOND_JOIN : POSITION_JOIN_ROOM.FIRST_JOIN;
//                 await RedisMatching.hSet(room.id, 'userStartRoom', firstUser.getId())

//                 // create room
//                 const paramsCreateRoom: ParamsCreateRoom = {
//                     miniGameEventId,
//                     roomId: objResultFindRoomGr.roomId,
//                     groupRoomId: objResultFindRoomGr.roomGrId,
//                     userId: objResultFindRoomGr.firstUserId,
//                     typeRoom: objResultFindRoomGr.typeRoom,
//                     round: objResultFindRoomGr.round,
//                     positionUser: positionOfFirstUser,
//                     positionRoom: objResultFindRoomGr.position,
//                 }
//                 const responseCreate = await OutgameService.createRoom(paramsCreateRoom)
//                 logger.info(`[INFO][Matching] - findNextRoundRoom - outgame create room: ${JSON.stringify(responseCreate)}`);

//                 // join room
//                 const paramsJoinRoom: ParamsJoinRoom = {
//                     miniGameEventId,
//                     roomId: objResultFindRoomGr.roomId,
//                     groupRoomId: objResultFindRoomGr.roomGrId,
//                     userId: objResultFindRoomGr.secondUserId,
//                     positionRoom: positionOfSecondUser
//                 }
//                 const responseJoin = await OutgameService.joinRoom(paramsJoinRoom);
//                 logger.info(`[INFO][Matching] - findNextRoundRoom - outgame join room: ${JSON.stringify(responseJoin)}`);

//                 // save info user start room
//                 if (!room.userStartRoom) {
//                     await RedisMatching.hSet(room.id, 'userStartRoom', objResultFindRoomGr.firstUserId)
//                 }
//                 callback(objResultFindRoomGr)
//             } else {
//                 console.log(user.getId() + ' finding')
//                 const interval = setInterval(async () => {
//                     const indexInQueue = waitingQueue.findIndex((u: User) => u.userCodeId === user.getId());
//                     const end = new Date().getTime();
//                     const timeDiff = end - start;
//                     isStillExist = indexInQueue === -1 ? false : true;
//                     if (indexInQueue === -1 || timeDiff >= 5000) {
//                         console.log("isStillExist::: ", user.getId(), isStillExist, " timeDiff:: ", timeDiff)
//                         if (isStillExist) {
//                             console.log('create Room personal')
//                             const indexInQueue = waitingQueue.findIndex((u: User) => u.userCodeId === user.getId());
//                             objResultFindRoomGr.status = 'CREATE';
//                             waitingQueue.splice(indexInQueue, 1);
//                             let positionOfUser = room.firstUserId === user.getId() ? POSITION_JOIN_ROOM.FIRST_JOIN : POSITION_JOIN_ROOM.SECOND_JOIN;
//                             if (room.userStartRoom) {
//                                 // join room
//                                 const paramsJoinRoom: ParamsJoinRoom = {
//                                     miniGameEventId,
//                                     roomId: objResultFindRoomGr.roomId,
//                                     groupRoomId: objResultFindRoomGr.roomGrId,
//                                     userId: user.getId(),
//                                     positionRoom: positionOfUser
//                                 }
//                                 const responseJoin = await OutgameService.joinRoom(paramsJoinRoom);
//                                 logger.info(`[INFO][Matching] - findNextRoundRoom - outgame join room: ${JSON.stringify(responseJoin)}`);
//                             } else {
//                                 // create room
//                                 const paramsCreateRoom: ParamsCreateRoom = {
//                                     miniGameEventId,
//                                     roomId: objResultFindRoomGr.roomId,
//                                     groupRoomId: objResultFindRoomGr.roomGrId,
//                                     userId: user.getId(),
//                                     typeRoom: objResultFindRoomGr.typeRoom,
//                                     round: objResultFindRoomGr.round,
//                                     positionUser: positionOfUser,
//                                     positionRoom: objResultFindRoomGr.position,
//                                 }
//                                 const responseCreate = await OutgameService.createRoom(paramsCreateRoom)
//                                 logger.info(`[INFO][Matching] - findNextRoundRoom - outgame create room: ${JSON.stringify(responseCreate)}`);

//                                 // save info user start room
//                                 await RedisMatching.hSet(room.id, 'userStartRoom', user.getId());
//                             }
//                             this.updateResultFindRoomByRoomData(objResultFindRoomGr, room, user)
//                             callback(objResultFindRoomGr)
//                             clearInterval(interval);
//                         } else {
//                             clearInterval(interval);
//                         }
//                     }
//                 }, 200);
//             }
//         } else {
//             // k tìm thấy room

//         }
//         // }
//     }

//     public async findRoundOne(user: User, msg: any, start, callback) {
//         const { gameType, userCodeId, mmr, ccData, level } = msg;
//         const { gameMode, miniGameEventId, numberInMiniGame, groupRoomId, round } = ccData;
//         const objResultFindRoomGr: ResFindRoomGroup = {
//             roomGrId: null,
//             roomId: null,
//             status: null,
//             typeRoom: 1,
//             firstUserId: user.getId(),
//             secondUserId: null,
//             firstUser: user,
//             round: 1,
//             position: 1,
//         }
//         const matchingData = {
//             gameType,
//             numberInMiniGame,
//             gameMode,
//             miniGameEventId,
//             userCodeId,
//         };
//         // find room group
//         // const start = new Date().getTime();
//         const result = await this.roomGroupManager.findRoomGroup(matchingData, start);
//         // Không tìm thấy
//         if (!result) {
//             // CreateRoomGroup
//             const resultCreateRoomGr = await this.createRoomGroup(user, msg);
//             objResultFindRoomGr.roomGrId = resultCreateRoomGr.id;
//             // Create room trong room group
//             let room = await this.createRoomInTour(objResultFindRoomGr);
//             objResultFindRoomGr.roomId = room ?.roomId;
//             await RedisMatching.rPush(`members_in_${objResultFindRoomGr.roomGrId}`, user.getId());
//             await RedisMatching.rPush(`rooms_in_${objResultFindRoomGr.roomGrId}`, room ?.roomId);
//             const roomObj: RoomInGroup = {
//                 id: room ?.roomId,
//                 firstUserId: user.getId(),
//                 createdDate: (new Date()).toISOString(),
//                 status: ROOM_WAITING_STATUS.PROCESS,
//             };
//             if (+gameMode === GAME_MODE_TYPE.ONE_VS_MANY) {
//                 roomObj.userIdWin = user.getId();
//             }
//             await RedisMatching.hSetObject(room ?.roomId, roomObj)
//             await RedisMatching.setNX(`CM_${objResultFindRoomGr.roomGrId}`, '1');

//             // create room
//             const paramsCreateRoom: ParamsCreateRoom = {
//                 miniGameEventId,
//                 roomId: room ?.roomId,
//                 groupRoomId: objResultFindRoomGr.roomGrId,
//                 userId: user.getId(),
//                 typeRoom: objResultFindRoomGr.typeRoom,
//                 round: objResultFindRoomGr.round,
//                 positionUser: POSITION_JOIN_ROOM.FIRST_JOIN,
//                 positionRoom: objResultFindRoomGr.position,
//             }
//             const response = await OutgameService.createRoom(paramsCreateRoom);
//             logger.info(`[INFO][Matching] - findRoundOne - outgame create room: ${JSON.stringify(response)}`);

//             if (response === "OK") {
//                 await RedisMatching.hSet(room ?.roomId, 'status', ROOM_WAITING_STATUS.READY);
//             }
//             callback(objResultFindRoomGr)
//         } else {
//             switch (gameMode) {
//                 case GAME_MODE_TYPE.KNOCKOUT_ROUND_TOUR: {
//                     // Tìm thấy roomGroup
//                     objResultFindRoomGr.roomGrId = result.id
//                     this.userJoinKnockout(user, msg, callback, objResultFindRoomGr, start);
//                     break;
//                 };
//                 case GAME_MODE_TYPE.ROUND_ROBIN: {
//                     objResultFindRoomGr.roomGrId = result.id
//                     this.userJoinRoundRobin(user, msg, callback, objResultFindRoomGr)
//                     break;
//                 }
//                 case GAME_MODE_TYPE.ONE_VS_MANY: {
//                     objResultFindRoomGr.roomGrId = result.id;
//                     let room = await this.createRoomInTour(objResultFindRoomGr);
//                     objResultFindRoomGr.roomId = room ?.roomId;
//                     await RedisMatching.rPush(`members_in_${objResultFindRoomGr.roomGrId}`, user.getId());
//                     await RedisMatching.rPush(`rooms_in_${objResultFindRoomGr.roomGrId}`, room ?.roomId);
//                     const roomObj: RoomInGroup = {
//                         id: room ?.roomId,
//                         firstUserId: user.getId(),
//                         createdDate: (new Date()).toISOString(),
//                         userIdWin: user.getId(),
//                         status: ROOM_WAITING_STATUS.READY,
//                     }
//                     await RedisMatching.hSetObject(room ?.roomId, roomObj)

//                     // create room
//                     const paramsCreateRoom: ParamsCreateRoom = {
//                         miniGameEventId,
//                         roomId: room ?.roomId,
//                         groupRoomId: objResultFindRoomGr.roomGrId,
//                         userId: user.getId(),
//                         typeRoom: objResultFindRoomGr.typeRoom,
//                         round: objResultFindRoomGr.round,
//                         positionUser: POSITION_JOIN_ROOM.FIRST_JOIN,
//                         positionRoom: objResultFindRoomGr.position,
//                     }
//                     const response = await OutgameService.createRoom(paramsCreateRoom);
//                     logger.info(`[INFO][Matching] - findRoundOne - outgame create room: ${JSON.stringify(response)}`);

//                     callback(objResultFindRoomGr)
//                 }
//             }
//         }
//     }

//     private async userJoinRoundRobin(user: User, msg, callback, objResultFindRoomGr: ResFindRoomGroup) {
//         const { gameType, ccData } = msg;
//         const { gameMode, miniGameEventId, numberInMiniGame, groupRoomId, round } = ccData;
//         const key = `R1_${gameMode}_${gameType}_${numberInMiniGame}_${miniGameEventId}_${objResultFindRoomGr.roomGrId}`;
//         const membersInGrRoom = await RedisMatching.lRange(`members_in_${objResultFindRoomGr.roomGrId}`);
//         const roomsInGrRoom = await RedisMatching.lRange(`rooms_in_${objResultFindRoomGr.roomGrId}`);
//         if (!membersInGrRoom.length) return; // TODO: return lỗi dữ liệu
//         if (membersInGrRoom.length === 1) {
//             const roomData: RoomInGroup = await RedisMatching.hGet(roomsInGrRoom[0]);
//             await RedisMatching.hSet(roomsInGrRoom[0], 'secondUserId', user.getId());
//             await RedisMatching.rPush(`members_in_${objResultFindRoomGr.roomGrId}`, user.getId());
//             // nếu trước đó chỉ có 1 user => join luôn vào room;
//             // room chưa có người chơi 2;
//             objResultFindRoomGr.firstUser = null;
//             objResultFindRoomGr.firstUserId = roomData.firstUserId;
//             objResultFindRoomGr.secondUserId = user.getId();
//             objResultFindRoomGr.roomId = roomData.id;
//             objResultFindRoomGr.status = 'JOIN';
//             objResultFindRoomGr.secondUser = user;
//             if (roomData.firstUserPoint) objResultFindRoomGr.firstUserPoint = roomData.firstUserPoint
//             if (roomData.firstUserPlayTime) objResultFindRoomGr.firstUserPlayTime = roomData.firstUserPlayTime;

//             // join room
//             const paramsJoinRoom: ParamsJoinRoom = {
//                 miniGameEventId,
//                 roomId: objResultFindRoomGr.roomId,
//                 groupRoomId: objResultFindRoomGr.roomGrId,
//                 userId: user.getId(),
//                 positionRoom: POSITION_JOIN_ROOM.SECOND_JOIN
//             }
//             const responseJoin = await OutgameService.joinRoom(paramsJoinRoom);
//             logger.info(`[INFO][Matching] - userJoinRoundRobin - outgame join room: ${JSON.stringify(responseJoin)}`);

//             callback(objResultFindRoomGr)
//         } else {
//             for (let i = 0; i < membersInGrRoom.length; i++) {
//                 let room: RoomInGroup = {
//                     id: uuidv4(),
//                     firstUserId: user.getId(),
//                     secondUserId: membersInGrRoom[i],
//                     createdDate: (new Date()).toISOString(),
//                     status: ROOM_WAITING_STATUS.READY,
//                 };
//                 if (i === 0) {
//                     objResultFindRoomGr.status = 'CREATE';
//                     objResultFindRoomGr.roomId = room.id;
//                     objResultFindRoomGr.firstUserId = user.getId();
//                     objResultFindRoomGr.secondUserId = room.secondUserId;
//                     room.userStartRoom = user.getId();
//                 }
//                 await RedisMatching.hSetObject(room ?.id, room)
//                 objResultFindRoomGr.position = await RedisMatching.rPush(`rooms_in_${objResultFindRoomGr.roomGrId}`, room ?.id);

//                 // create room
//                 const paramsCreateRoom: ParamsCreateRoom = {
//                     miniGameEventId,
//                     roomId: room.id,
//                     groupRoomId: objResultFindRoomGr.roomGrId,
//                     userId: objResultFindRoomGr.firstUserId,
//                     typeRoom: objResultFindRoomGr.typeRoom,
//                     round: objResultFindRoomGr.round,
//                     positionUser: POSITION_JOIN_ROOM.FIRST_JOIN,
//                     positionRoom: objResultFindRoomGr.position,
//                 }
//                 const responseCreate = await OutgameService.createRoom(paramsCreateRoom);
//                 logger.info(`[INFO][Matching] - userJoinRoundRobin - outgame create room: ${JSON.stringify(responseCreate)}`);
//             };
//             await RedisMatching.rPush(`members_in_${objResultFindRoomGr.roomGrId}`, user.getId());
//             // await RedisMatching.hSet(key, 'roomList', JSON.stringify(roomData));
//             if (membersInGrRoom.length + 1 === numberInMiniGame) {
//                 // edit TTL RR 
//                 const setExpiredKey = await RedisMatching.setEX(`TTL_${key}`, 16 * 60 * 60, '1')
//             }
//             callback(objResultFindRoomGr)
//         }
//     }

//     private async userJoinKnockout(user: User, msg, callback, objResultFindRoomGr: ResFindRoomGroup, start) {
//         const { gameType, userCodeId, mmr, ccData, level } = msg;
//         const { gameMode, miniGameEventId, numberInMiniGame, groupRoomId, round } = ccData;
//         const roomsInGrRoom = await RedisMatching.lRange(`rooms_in_${objResultFindRoomGr.roomGrId}`);
//         for (const roomId of roomsInGrRoom) {
//             const roomData: RoomInGroup = await RedisMatching.hGet(roomId)
//             // const secondUserId = await RedisMatching.hGetByField(roomId, 'secondUserId')
//             if (!roomData.secondUserId) {
//                 await RedisMatching.hSet(roomId, 'secondUserId', user.getId());
//                 await RedisMatching.rPush(`members_in_${objResultFindRoomGr.roomGrId}`, user.getId());
//                 objResultFindRoomGr.firstUser = null
//                 objResultFindRoomGr.secondUser = user
//                 objResultFindRoomGr.firstUserId = roomData.firstUserId;
//                 objResultFindRoomGr.secondUserId = user.getId();
//                 objResultFindRoomGr.roomId = roomData.id;
//                 objResultFindRoomGr.status = 'JOIN';
//                 if (roomData.firstUserPoint) {
//                     objResultFindRoomGr.firstUserPoint = roomData.firstUserPoint
//                 };
//                 let checkingData = await RedisMatching.hGetByField(roomId, 'status');
//                 while (checkingData !== ROOM_WAITING_STATUS.READY) {
//                     checkingData = await RedisMatching.hGetByField(roomId, 'status');
//                     await pauseFunction(200);
//                 }

//                 // join room
//                 const paramsJoinRoom: ParamsJoinRoom = {
//                     miniGameEventId,
//                     roomId: objResultFindRoomGr.roomId,
//                     groupRoomId: objResultFindRoomGr.roomGrId,
//                     userId: user.getId(),
//                     positionRoom: POSITION_JOIN_ROOM.SECOND_JOIN
//                 }
//                 const responseJoin = await OutgameService.joinRoom(paramsJoinRoom);
//                 logger.info(`[INFO][Matching] - userJoinKnockout - outgame join room: ${JSON.stringify(responseJoin)}`);

//                 callback(objResultFindRoomGr)
//                 break;
//             }
//         };
//         if (!objResultFindRoomGr.status) {
//             // user k tìm thấy phòng phù hợp
//             let waitingQueue = [];
//             if (!this.waitingMiniGameQueue[objResultFindRoomGr.roomGrId]) {
//                 this.waitingMiniGameQueue[objResultFindRoomGr.roomGrId] = [user]
//             } else {
//                 this.waitingMiniGameQueue[objResultFindRoomGr.roomGrId].push(user);
//             }
//             waitingQueue = this.waitingMiniGameQueue[objResultFindRoomGr.roomGrId];
//             let isStillExist = false;
//             const indexInQueue = waitingQueue.findIndex((u: User) => u.userCodeId === user.getId());
//             if (indexInQueue > 0) { // luôn lấy user index = 0 trong queue ra matching với user hiện tại
//                 const userMatching = [].concat(waitingQueue.splice(indexInQueue, 1)).concat(waitingQueue.splice(0, 1)).reverse();
//                 // create room SYNCHRONOUS
//                 objResultFindRoomGr.typeRoom = 2;
//                 const firstUser = userMatching[0]
//                 objResultFindRoomGr.firstUserId = firstUser.getId()
//                 objResultFindRoomGr.firstUser = firstUser
//                 console.log('find other user', firstUser.getId());
//                 const secondUser = userMatching[1]
//                 objResultFindRoomGr.secondUserId = secondUser.getId()
//                 objResultFindRoomGr.secondUser = secondUser
//                 console.log('current user', secondUser.getId());
//                 console.log('user in fn', user.getId());
//                 let room = await this.createRoomInTour(objResultFindRoomGr);
//                 const roomObj: RoomInGroup = {
//                     id: room ?.roomId,
//                     firstUserId: firstUser.getId(),
//                     secondUserId: secondUser.getId(),
//                     createdDate: (new Date()).toISOString(),
//                     status: ROOM_WAITING_STATUS.READY
//                 }
//                 await RedisMatching.rPush(`members_in_${objResultFindRoomGr.roomGrId}`, firstUser.getId());
//                 await RedisMatching.rPush(`members_in_${objResultFindRoomGr.roomGrId}`, secondUser.getId());
//                 objResultFindRoomGr.position = await RedisMatching.rPush(`rooms_in_${objResultFindRoomGr.roomGrId}`, roomObj ?.id);
//                 await RedisMatching.hSetObject(room ?.roomId, roomObj)

//                 // create room
//                 const paramsCreateRoom: ParamsCreateRoom = {
//                     miniGameEventId,
//                     roomId: objResultFindRoomGr.roomId,
//                     groupRoomId: objResultFindRoomGr.roomGrId,
//                     userId: objResultFindRoomGr.firstUserId,
//                     typeRoom: objResultFindRoomGr.typeRoom,
//                     round: objResultFindRoomGr.round,
//                     positionUser: POSITION_JOIN_ROOM.FIRST_JOIN,
//                     positionRoom: objResultFindRoomGr.position,
//                 }
//                 const responseCreate = await OutgameService.createRoom(paramsCreateRoom);
//                 logger.info(`[INFO][Matching] - userJoinKnockout - outgame create room: ${JSON.stringify(responseCreate)}`);

//                 // join room
//                 const paramsJoinRoom: ParamsJoinRoom = {
//                     miniGameEventId,
//                     roomId: objResultFindRoomGr.roomId,
//                     groupRoomId: objResultFindRoomGr.roomGrId,
//                     userId: objResultFindRoomGr.secondUserId,
//                     positionRoom: POSITION_JOIN_ROOM.SECOND_JOIN
//                 }
//                 const responseJoin = await OutgameService.joinRoom(paramsJoinRoom);
//                 logger.info(`[INFO][Matching] - userJoinKnockout - outgame join room: ${JSON.stringify(responseJoin)}`);

//                 callback(objResultFindRoomGr)
//             } else {
//                 console.log(user.getId() + ' finding')
//                 const interval = setInterval(async () => {
//                     const indexInQueue = waitingQueue.findIndex((u: User) => u.userCodeId === user.getId());
//                     const end = new Date().getTime();
//                     const timeDiff = end - start;
//                     isStillExist = indexInQueue === -1 ? false : true;
//                     if (indexInQueue === -1 || timeDiff >= 5000) {
//                         console.log("isStillExist::: ", user.getId(), isStillExist, " timeDiff:: ", timeDiff)
//                         if (isStillExist) {
//                             // create room asynchronous
//                             // create room;
//                             // TODO: sync mode
//                             // Create room trong room group
//                             console.log('create Room personal')
//                             const indexInQueue = waitingQueue.findIndex((u: User) => u.userCodeId === user.getId());
//                             objResultFindRoomGr.status = 'CREATE';
//                             waitingQueue.splice(indexInQueue, 1)
//                             let room = await this.createRoomInTour(objResultFindRoomGr);
//                             const roomObj: RoomInGroup = {
//                                 id: room ?.roomId,
//                                 firstUserId: user.getId(),
//                                 createdDate: (new Date()).toISOString(),
//                             }
//                             await RedisMatching.hSetObject(room ?.roomId, roomObj)
//                             objResultFindRoomGr.position = await RedisMatching.rPush(`rooms_in_${objResultFindRoomGr.roomGrId}`, roomObj ?.id);
//                             await RedisMatching.rPush(`members_in_${objResultFindRoomGr.roomGrId}`, user.getId());

//                             // create room
//                             const paramsCreateRoom: ParamsCreateRoom = {
//                                 miniGameEventId,
//                                 roomId: objResultFindRoomGr.roomId,
//                                 groupRoomId: objResultFindRoomGr.roomGrId,
//                                 userId: user.getId(),
//                                 typeRoom: objResultFindRoomGr.typeRoom,
//                                 round: objResultFindRoomGr.round,
//                                 positionUser: POSITION_JOIN_ROOM.FIRST_JOIN,
//                                 positionRoom: objResultFindRoomGr.position,
//                             }
//                             const responseCreate = await OutgameService.createRoom(paramsCreateRoom);
//                             logger.info(`[INFO][Matching] - userJoinKnockout - outgame create room: ${JSON.stringify(responseCreate)}`);

//                             if (responseCreate === "OK") {
//                                 await RedisMatching.hSet(room ?.roomId, 'status', ROOM_WAITING_STATUS.READY);
//                             }
//                             callback(objResultFindRoomGr)
//                             clearInterval(interval);
//                         } else {
//                             clearInterval(interval);
//                         }
//                     }
//                 }, 200);
//             }
//         }
//     }

//     public async createRoomGroup(user: User, msg: any) {
//         const { gameType, userCodeId, mmr, ccData, level } = msg;
//         const { gameMode, miniGameEventId, numberInMiniGame } = ccData;
//         const roomGr = new roomGroup(gameMode, miniGameEventId, numberInMiniGame);
//         const roomGrId = roomGr.getId();
//         const key = `R1_${gameMode}_${gameType}_${numberInMiniGame}_${miniGameEventId}_${roomGrId}`;
//         const setObject = {
//             id: roomGrId,
//             gameMode: gameMode,
//             numberInMiniGame: numberInMiniGame,
//             createdDate: (new Date()).toISOString(),
//         }
//         const setExpiredKey = await RedisMatching.setEX(`TTL_${key}`, 7 * 24 * 60 * 60, '1')
//         const setResponse = await RedisMatching.hSetObject(key, setObject)
//         if (!setResponse) {
//             // Set failed
//             // TODO: ...
//         }
//         return setObject
//     }

//     private async createRoomInTour(objResultFindRoomGr) {
//         const roomId = uuidv4();
//         const room = { roomId }
//         objResultFindRoomGr.roomId = roomId;
//         objResultFindRoomGr.status = 'CREATE';
//         return room;
//     }

//     public async sendPackageToUser(user: User, header: PACKAGE_HEADER, data: any) {
//         const packageData = { header, data };
//         const buffer = await encodeMessage(packageData, GameManger.filePath, 'hcGames.PackageData');
//         user.getSocket().send(buffer);
//     }

//     private async updateWinnerInRoom(roomId: string, groupRoomId: string) {
//         const room: RoomInGroup = await RedisMatching.hGet(roomId);
//         if (room.userIdWin) {
//             // end room
//             const paramsEndRoom: ParamsEndRoom = {
//                 roomId,
//                 userIdWin: room.userIdWin
//             }
//             const pattern = `R*${groupRoomId}`;
//             const results = await RedisMatching.scan(pattern);
//             const roomGrKey = results[0] || null;
//             if (roomGrKey) {
//                 const roomGrData = await RedisMatching.hGet(roomGrKey);
//                 const { numberInMiniGame, gameMode } = roomGrData;
//                 const membersInGr = await RedisMatching.lRange(`members_in_${groupRoomId}`);
//                 const roomsInGr = await RedisMatching.lRange(`rooms_in_${groupRoomId}`);
//                 if (+gameMode === GAME_MODE_TYPE.ONE_VS_MANY) {
//                     const cloneMembersInGr = [...membersInGr];
//                     paramsEndRoom.ranks = await sortGetFinalTourResult(cloneMembersInGr, membersInGr, roomsInGr, gameMode);
//                 }
//             }
//             await OutgameService.endRoom(paramsEndRoom);
//             return;
//         }
//         if (!room.firstUserPoint || !room.secondUserPoint) return;
//         let userWin = null;
//         room.firstUserPoint = +room.firstUserPoint;
//         room.secondUserPoint = +room.secondUserPoint;
//         room.firstUserPlayTime = +room.firstUserPlayTime;
//         room.secondUserPlayTime = +room.secondUserPlayTime;
//         if (room.firstUserPoint > room.secondUserPoint) {
//             userWin = room.firstUserId
//         } else if (room.firstUserPoint < room.secondUserPoint) {
//             userWin = room.secondUserId
//         } else if (room.firstUserPlayTime > room.secondUserPlayTime) {
//             userWin = room.secondUserId
//         } else if (room.firstUserPlayTime < room.secondUserPlayTime) {
//             userWin = room.firstUserId
//         } else {
//             userWin = room.userStartRoom === room.secondUserId ? room.secondUserId : room.firstUserId
//         }

//         await RedisMatching.setNX(`FLAG_${roomId}`, '0');
//         const countFlag = await RedisMatching.increment(`FLAG_${roomId}`, 1);
//         if (+countFlag === 1) {
//             await RedisMatching.hSet(roomId, 'userIdWin', userWin)
//             let nextRound = 0;
//             let positionRoom = 0;
//             let positionUser = 0;
//             let indexUserInTour = 0;
//             const membersInGr = await RedisMatching.lRange(`members_in_${groupRoomId}`);
//             const roomsInGr = await RedisMatching.lRange(`rooms_in_${groupRoomId}`);
//             membersInGr.forEach((mem, index) => {
//                 if (mem === userWin) {
//                     indexUserInTour = index;
//                 }
//             });
//             const pattern = `R*${groupRoomId}`;
//             const results = await RedisMatching.scan(pattern);
//             const roomGrKey = results[0] || null;
//             if (roomGrKey) {
//                 const roomGrData = await RedisMatching.hGet(roomGrKey);
//                 const { numberInMiniGame, gameMode } = roomGrData;
//                 if (+gameMode === GAME_MODE_TYPE.KNOCKOUT_ROUND_TOUR) {
//                     const keysList = roomGrKey.split('_');
//                     const roundNumber: number = Number(keysList[0].replace(/^\D+/g, ''));
//                     nextRound = roundNumber + 1;
//                     let maxMatchAtRound = numberInMiniGame;
//                     for (let i = 0; i < nextRound; i++) {
//                         maxMatchAtRound = maxMatchAtRound / 2
//                     };
//                     if (maxMatchAtRound < 1) {
//                         maxMatchAtRound = 1;
//                         nextRound = 0;
//                     }
//                     const numberOfMemberInGroup = Math.ceil(numberInMiniGame / maxMatchAtRound);
//                     positionRoom = Math.floor(indexUserInTour / numberOfMemberInGroup) + 1;
//                     const startIndex = ((positionRoom - 1) * numberOfMemberInGroup)
//                     const endIndex = positionRoom * numberOfMemberInGroup
//                     const middle = (startIndex + endIndex) / 2;
//                     positionUser = indexUserInTour < middle ? 1 : 2; // 1 là vị trí đầu tiên trong phòng, 2 là vị trí sau
//                 }
//             }

//             // end room
//             const paramsEndRoom: ParamsEndRoom = {
//                 roomId,
//                 userIdWin: userWin,
//                 nextRound,
//                 positionRoom,
//                 positionUser,
//             };
//             await OutgameService.endRoom(paramsEndRoom);

//             delete this.waitingMiniGameQueue[roomId]
//             await RedisMatching.del(`FLAG_${roomId}`)
//         }
//     }

//     /**
//      * Description: Clear room by game type and room
//      * Created by: NghiaLT(13/02/2023)
//      * @param gameType 
//      * @param room 
//      */
//     public clearRoom(gameType: GAME_TYPE, room: Room) {
//         switch (gameType) {
//             case GAME_TYPE.SOLITAIRE: {
//                 this.solitaire.cleanRoom(room);
//             } break;
//             case GAME_TYPE.TICTACTOE: {
//                 // this.tictactoe.cleanRoom(room);
//             } break;
//         }
//     }
// }

// export default GameManger;