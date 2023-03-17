import { v4 as uuidv4 } from 'uuid';
import User from './user';
import { encodeMessage } from '../../utils/helpers';
import { PACKAGE_HEADER, ROOM_STATUS } from '../../utils/constants';
import GameManger from '../gameManager';
import { OutgameService } from '../../server/services';
import { ParamsEndUser } from '../../server/services/types/interface';

class Room {
    id: string; // room's id
    members = []; // users joinned room
    turnId: number; // current user's turn
    roomStatus: ROOM_STATUS;
    miniGameEventId: number;
    roomGrId: string;
    mmr: number;
    
    constructor(user: User, params?: any) {
        // this.id = uuidv4();
        if (params && params.id) {
          this.id = params.id;
        } else {
          this.id = uuidv4()
        }
        this.members = [user];
        if (params) {
            const {miniGameEventId, roomGrId} = params;
            this.miniGameEventId = miniGameEventId;
            this.roomGrId = roomGrId;
        }
        this.mmr = user.mmr;
        this.resetGame();
    }
    
    public init() {
        console.log(111, 'Billiard.init');
    }

    public resetGame() {
        this.turnId = this.getMaster().getId();
        this.roomStatus = ROOM_STATUS.RS_WAITING;
    }

    getMaster() {
        return this.members.length > 0 ?  this.members[0] : null;
    }

    isMaster(user: User) {
        if (!this.getMaster())
            return false;
        return user.getId() == this.getMaster().getId();
    }
    
    getPlayer() {
        return this.members.length > 1 ? this.members[1] : null;
    }

    isPlayer(user: User) {
        if (!this.getPlayer())
            return false;
        return user.getId() == this.getPlayer().getId();
    }

    isMember(user: User) {
        for(let member of this.members) {
            if(user.getId() === member.getId()) {
                return true;
            }
        }
        return false;
    }

    getId() {
        return this.id;
    }

    userLeave(user: User) {
        const index = this.members.indexOf(user);
        if (index > -1)
            this.members.splice(index, 1);
    }

    joinRoom(user: User) {
        console.log(1199, this.members.length);
        this.members.push(user);
        this.roomStatus = ROOM_STATUS.RS_PLAYING;
        console.log(1199, this.members.length);
    }

    setRoomToPlaying() {
        this.roomStatus = ROOM_STATUS.RS_PLAYING;
    }

    isUserEmpty() {
        return this.members.length == 0;
    }

    getTurn() {
        return this.turnId;
    }
    
    getMemberCount() {
        return this.members.length;
    }

    sendDataAll(payload: any, userSkip: User = null) {
        this.members.forEach(m => {
            if (!userSkip || userSkip.getId() != m.getId())
                m.sendData(payload);
        });
    }

    async endGame(winnerId: string, otherplayer: string = '') {
        const endGame = { winnerId };
        const buffer = await encodeMessage(endGame, GameManger.filePath, 'hcGames.EndGame');
        if (this.members[0]) {
            this.members[0].sendPackage(PACKAGE_HEADER.BILLIARDS_UPDATE_END_GAME, buffer);

            // end user first
            const paramsFirst: ParamsEndUser = {
                roomId: this.getId(), 
                userId: this.members[0].getId(), 
                playTime: 2191, 
                point: 0
            }
            OutgameService.endUser(paramsFirst);
            if (this.members[1]) {
                this.members[1].sendPackage(PACKAGE_HEADER.BILLIARDS_UPDATE_END_GAME, buffer);
            }

            // end user second
            const paramsSecond: ParamsEndUser = {
                roomId: this.getId(), 
                userId: otherplayer, 
                playTime: 2191, 
                point: 0
            }
            OutgameService.endUser(paramsSecond);
        }
        this.roomStatus = ROOM_STATUS.RS_STOPPED;
        console.log(111, 'Room.endGame', endGame)
        //if (this.members.length > 1) {
        //    const result = this.members[1].getId() === winnerId ? 1 : 0;
        //    OutgameService.endRoom(this.members[0].getId(), this.members[1].getId(), this.getId(), result);
        //}
    
        //const result = this.members[0].getId() === winnerId ? 0 : 1;
        const result = 1; // 0 là hòa, 1 là ???
        // OutgameService.endRoom(this.members[0].getId(), otherplayer, this.getId(), result);
        console.log(1258911, this.members[0].getId(), otherplayer, this.getId(), result);
        
    }

    isPlaying() {
        return this.roomStatus === ROOM_STATUS.RS_PLAYING;
    }
}

export default Room;