import { TICTACTOE_TYPE } from '../../utils/constants';

export interface Player {
    id: string,
    symbol: string,
    isTurn: boolean,
    wins: number,
    lost: number
}
export interface Room {
    [roomId: string]: {
        roomId: string,
        ownerId: string,
        players: Player[];
        board: string[]
    }
}
export interface DataAction {
    roomId: string,
    ownerId: string,
    players: string[] | undefined,
    board: string[]
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
    dataMove: DataMove | undefined
}