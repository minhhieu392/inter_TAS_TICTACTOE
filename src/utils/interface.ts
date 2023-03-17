import User from "../games/general/user";
import { ROOM_TYPE } from "./constants";

// Interface gift type in random box
interface GiftTypeElement {
  index: number,
  title: string,
}

// Interface gift random box
interface GiftElement {
  bonusGameRewardId: number,
  quantity?: number,
  rate?: number,
  bonusGameRewardName: string,
  jackpot?: number,
  type?: number,
}

interface HcBonusGameReward {
  id: number,
  bonusGameSettingId: number,
  percentJackpot: number,
  hcToken: number,
  gold: number,
  ticket: number,
  type: number,
  rate: number,
  oneMoreSpin: number,
  jackpot: number,
}

interface ResBonusGameSettingApp {
  id: number,
  bonusGameId: number,
  bonusGame: string,
  feeToken: number,
  feeTicket: number,
  bonusGameReward: Array<HcBonusGameReward>,
}

interface RouletteInit {
  type?: number,
  userId?: number,
}

interface ReqEndBonusGame {
  userId: number;
  bonusGameId: number;
  rewardId: Array<number>;
  feeTicket?: number;
  feeHcToken?: number;
}

interface ResFindRoomGroup {
  roomGrId?: string,
  roomId: string,
  status: 'CREATE' | 'JOIN' | null,
  firstUserId?: string,
  secondUserId?: string,
  typeRoom: 1 | 2, // 1 là bất đồng bộ, 2 là đồng bộ
  firstUserPoint?: number,
  secondUserPoint?: number,
  firstUser?: User,
  secondUser?: User,
  round: number,
  firstUserPlayTime?: number,
  secondUserPlayTime?: number,
  position?: number,
  positionUser?: number,
}

interface RoomInGroup {
  id: string,
  firstUserId?: string,
  secondUserId?: string,
  firstUserPoint?: number,
  secondUserPoint?: number,
  userIdWin?: string,
  createdDate?: string,
  userStartRoom?: string,
  firstUserPlayTime?: number,
  secondUserPlayTime?: number,
  round?: number,
  status?: 'READY' | 'PROCESS' | null,
}

interface OtherPlayerResult {
  userId: string,
  points: number,
  timePlay: number,
}

interface ParamsContructorRoom {
  typeRoom: ROOM_TYPE,
  id?: string,
  miniGameEventId?: number,
  roomGrId?: string,
  otherPlayerResult? : OtherPlayerResult
}

export {
  GiftTypeElement,
  GiftElement,
  RouletteInit,
  ReqEndBonusGame,
  ResFindRoomGroup,
  RoomInGroup,
  OtherPlayerResult,
  ParamsContructorRoom
}