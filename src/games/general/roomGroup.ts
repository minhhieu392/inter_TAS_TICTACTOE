import { v4 as uuidv4 } from 'uuid';
import { GAME_MODE } from '../../utils/constants';
import Room from './room';
import User from './user';

export default class RoomGroup {
  private id: string; // id groupRoomId
  private rooms: Array<any>; // rooms in groupRoom
  private gameMode: number; // groupRoom MODE
  private members: Array<any>; // users in groupRoom 
  private maxMembers: number = 0;
  private isFullMember: boolean;
  private miniGameEventId: number;
  private round: number;
  private numberInMiniGame: number;

  constructor(mode, miniGameEventId, numberInMiniGame) {
    this.rooms = [];
    this.members = [];
    this.round = 1;
    this.id = uuidv4();
    this.gameMode = mode;
    this.miniGameEventId = miniGameEventId;
    this.isFullMember = false;
    this.numberInMiniGame = numberInMiniGame;
    this.checkMaxMemberInRoomGroup()
  }

  public init() {
    console.log(13, 'RoomGroup.init');
  };

  getId() {
    return this.id;
  }

  getRoom() {
    return this.rooms
  }

  setRoom(rooms) {
    this.rooms = rooms;
  };

  setRound(round: number) {
    this.round = round;
  }

  getGameMode() {
    return this.gameMode;
  }

  getMiniGameEventId() {
    return this.miniGameEventId;
  }

  getNumberInMiniGame() {
    return this.numberInMiniGame;
  }

  getIsFullMember() {
    return this.isFullMember;
  }

  getMembers() {
    return this.members;
  }

  getMaxMembers() {
    return this.maxMembers;
  }

  addMember(user: User) {
    if (this.isFullMember) return;
    this.members.push(user);
    if (this.members.length >= this.maxMembers) {
      this.isFullMember = true;
    } else {
      this.isFullMember = false;
    };
    this.startRoomGroup()
  };

  startRoomGroup() {
    if (this.members.length === this.numberInMiniGame) {
      // group room đã đủ người
      
    }
  }

  addRoom(room: Room) {
    this.rooms.push(room);
  }

  checkMaxMemberInRoomGroup() {
    switch(this.gameMode) {
      case GAME_MODE.KNOCKOUT_8: {
        this.maxMembers = 8;
        break;
      };
      case GAME_MODE.KNOCKOUT_16: {
        this.maxMembers = 16;
        break;
      }
      case GAME_MODE.KNOCKOUT_32: {
        this.maxMembers = 32;
        break;
      }
      case GAME_MODE.KNOCKOUT_64: {
        this.maxMembers = 64;
        break;
      }
      case GAME_MODE.ROUND_ROBIN: {
        this.maxMembers = 6;
        break;
      }
      case GAME_MODE.ONE_VS_MANY: {
        this.maxMembers = 8;
        break;
      }
      default: {
        console.log("ERROR GET MAX MEMBER RoomGroup")
        break;
      }  
    } 
  }

}