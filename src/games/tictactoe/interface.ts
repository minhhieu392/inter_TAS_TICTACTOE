import { TICTACTOE_TYPE } from '../../utils/constants';

export interface Player {
    id: number,
    name: string
    symbol: string,
    isTurn: boolean,
    score: number
}
export interface Room {
    [roomId: string]: {
        roomId: string,
        ownerId: number,
        players: Player[];
        board: string[],
        gameType: number
    }
}
export interface DataAction {
    roomId: string,
    ownerId: string,
    players: string[] | undefined,
    board: string[],
    gameType: number
}
export interface DataMove {
    roomId: string,
    player: Player,
    to: number
    symbol: string
}

export interface PayloadHandleEvent {
    actionType: TICTACTOE_TYPE,
    data: DataAction | undefined,
    dataMove: DataMove | undefined,
    dataEndGame: DataEndGame | undefined,
    createPvE: CreatePvE | undefined
}

export interface DataEndGame {
    roomId: string,
    player: Player
}
export interface CreatePvE {
    roomId: string,
    groupRoomId: number,
    waitingTimeId: string,
    userId: number,
    status: number,
    bonusScore: number,
    async: string
}