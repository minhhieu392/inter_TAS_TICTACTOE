import { TICTACTOE_TYPE } from '../../utils/constants';


export interface DataAction {
    roomId: string,
    ownerId: string,
    players: string[] | undefined,
    board: string[]
}
export interface DataMove {
    roomId: string,
    player: string,
    to: number
}

export interface PayloadHandleEvent {
    actionType: TICTACTOE_TYPE,
    data: DataAction | undefined,
    dataMove: DataMove | undefined
}