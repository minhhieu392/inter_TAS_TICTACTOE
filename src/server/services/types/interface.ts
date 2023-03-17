export interface ParamsCreateRoom {
  miniGameEventId: number, 
  roomId: string, 
  groupRoomId?: string, 
  userId: string, 
  typeRoom: number, 
  round?: number, 
  positionUser?: number, 
  positionRoom?: number
}

export interface ParamsJoinRoom {
  miniGameEventId: number, 
  roomId: string, 
  groupRoomId?: string, 
  userId: string, 
  positionRoom?: number
}

export interface ParamsEndUser {
  userId: string, 
  roomId: string, 
  playTime?: number, 
  point?: number,
  pointGameLogic?: string,
}

export interface ParamsEndRoom {
  roomId: string, 
  userIdWin: string,
  nextRound?: number,
  positionRoom?: number,
  positionUser?: number,
  ranks?: Array<any>,
}

export interface ParamsValidateUser {
  userId: string,
  miniGameEventId: number,
  round: number,
}