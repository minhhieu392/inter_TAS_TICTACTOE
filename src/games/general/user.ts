import { GAME_MODE_TYPE, GAME_TYPE, PACKAGE_HEADER, ROOM_TYPE } from '../../utils/constants';
import { WebSocket } from 'ws';
import PackageProcess from './packageProcess';
import Room from './room';
import { encodeMessage } from '../../utils/helpers';
import { ResFindRoomGroup } from '../../utils/interface';
import { OutgameService } from '../../server/services';

const func_Define = {
    finding_room : 'finding_room',
    create_room : 'create_room',
}

class User {
    userCodeId: string;
    level: Number;
    nickname: string;
    ccData: any; // **
    mmr: number;
    
    public socket: WebSocket;
    packages: any;
    packageProcess: PackageProcess;
    gameType: Number; //game type playing (GAME_TYPE)
    room: Room;
    startTime: Date;

    constructor(socket: WebSocket) {
        this.socket = socket;
        this.packageProcess = new PackageProcess();
        this.room = null;
        this.ccData = { miniGameEventId: 0, waitingTimeId: 0, token: ''};
    }
        
    public init() {
        console.log(111, 'User.init');
    }

    public getSocket() {
        return this.socket;
    }

    getGameType() {
        return this.gameType;
    }

    setGameType(gameType: GAME_TYPE ) {
        this.gameType = gameType;
    }

    getRoom() {
        return this.room;
    }

    setRoom(room: Room) {
        this.room = room;
    }

    getId() {
        return this.userCodeId;
    }

    getLevel() {
        return this.level;
    }

    getNickname() {
        return this.nickname;
    }

    getMiniGameEventId() {
        return this.ccData.miniGameEventId;
    }

    getWaitingTimeId() {
        return this.ccData.waitingTimeId;
    }

    getToken() {
        return this.ccData.token;
    }

    
    getStartTime() {
        return this.startTime;
    }

    setStartTime(date: Date) {
        this.startTime = date;
    }

    
    closeConnection() {
        console.log(`\n closeConnection`);
        this.socket.close();
    }

    setData(userCodeId: string, nickname: string, level: number, mmr: number, ccData: any = null) {
        this.userCodeId = userCodeId;
        this.level = level;
        this.nickname = nickname;
        this.mmr = mmr;
        if (ccData)
            this.ccData = ccData;
    }

    async findPartner(searchingData: any, startCheck) {
        const { gameType } = searchingData;
        // => get Queue 
        // => Find MatchingUser
        // => Find matching => Create Room
        // => Delete From Queue
        const start = startCheck ? startCheck : new Date().getTime();
        let partner = null;
        let isStillExist = false;
        const waitingQueue = global.gameManager.getWaitingQueue(searchingData);
        const indexInQueue = waitingQueue.findIndex((user: User) => searchingData.userCodeId === user.getId());
        console.log("indexInQueue " + this.userCodeId, ' is ', indexInQueue)
        // search previous partner
        if (indexInQueue > 0) { // luôn lấy user index = 0 trong queue ra matching với user hiện tại
            partner = waitingQueue[0];
            const userMatching = [].concat(waitingQueue.splice(indexInQueue, 1)).concat(waitingQueue.splice(0, 1)).reverse();
            // success find partner
            // ==> create room synchronous
            console.log("userMatching:::" + this.userCodeId)
            global.gameManager.createRoomHeadToHead(searchingData, userMatching, gameType, ROOM_TYPE.SYNCHRONOUS)
        } else {
            // check if user still exist in queue
            const interval = setInterval(async () => {
                const end = new Date().getTime();
                const timeDiff = end - start;
                const indexInQueue = waitingQueue.findIndex((user: User) => searchingData.userCodeId === user.getId());
                isStillExist = indexInQueue === -1 ? false : true;
                if (indexInQueue === -1 || timeDiff >= 5000) {
                    console.log("isStillExist::: " + this.userCodeId, isStillExist)
                    if (isStillExist) {
                        // create room asynchronous
                        const userMatching = [].concat(waitingQueue.splice(indexInQueue, 1));
                        const responseFindAsyncRoom = await global.gameManager.searchingForAsyncRoom(userMatching[0], searchingData, start);
                        console.log("responseFindAsyncRoom ::: ", responseFindAsyncRoom)
                        if (!responseFindAsyncRoom) {
                          global.gameManager.createRoomHeadToHead(searchingData, userMatching, gameType, ROOM_TYPE.ASYNCHRONOUS);
                        } else {
                          const roomInfo: ResFindRoomGroup = {
                            ...responseFindAsyncRoom,
                            secondUserId: searchingData.userCodeId,
                            secondUser: userMatching[0],
                          }
                          console.log("roomInfo:::", roomInfo);
                          const { gameType , ccData: { miniGameEventId } } = searchingData;
                          await global.gameManager.createRoomV2(gameType, miniGameEventId, roomInfo);
                        }
                        clearInterval(interval);
                    } else {
                        clearInterval(interval);
                    }
                }
            }, 200);
        }
    }

    async findMiniGameEvent(searchingData: any, start: any) {
        const { gameType, ccData } = searchingData;
        const { miniGameEventId } = ccData;  
        await global.gameManager.findRoomGroup(this, searchingData, start, (roomInfo: ResFindRoomGroup) => {
            console.log("roomInfo:::", roomInfo);
            // Send data to OutGame
            switch (roomInfo.typeRoom) {
                case 1: {
                    // // bất đồng bộ
                    // await OutgameService.createRoom(miniGameEventId, roomGrInfo.roomId, roomGrInfo.roomGrId, roomGrInfo.firstUserId, roomGrInfo.typeRoom, 1);
                    break;
                }
                case 2: {
                    // // đồng bộ
                    // await OutgameService.createRoom(miniGameEventId, roomGrInfo.roomId, roomGrInfo.roomGrId, roomGrInfo.firstUserId, roomGrInfo.typeRoom, 1);
                    // await OutgameService.joinRoom(miniGameEventId, roomGrInfo.roomId, roomGrInfo.roomGrId, roomGrInfo.secondUserId);
                    break;
                };
                default:
                    break;
            };
            global.gameManager.createRoomV2(gameType, miniGameEventId, roomInfo);
        });
    }

    async addPackage(p) {
        this.packageProcess.add(p)
    }

    sendData(data: any) {
        return this.socket.send(data);
    }

    public async sendPackage(header: PACKAGE_HEADER, data: any) {
        const packageData = { header, data};
        const buffer = await encodeMessage(packageData, 'src/network/grpc/package.proto', 'hcGames.PackageData');
        this.getSocket().send(buffer);
        return buffer;
    }

}

export default User;