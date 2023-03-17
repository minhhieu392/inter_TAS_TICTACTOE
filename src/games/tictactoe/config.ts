export enum GAME_OVER_TYPE {
    TIME_OVER = 0,
    QUIT = 1,
    SUCCESS = 2,
    NONE = 3,
}
export const NUMBER_ROLL_SUBTRACT = 4;

export enum POINT_MOVE_CARD {
    WASTE_TO_TABLE = 50,
    TABLE_TO_FOUNDATION = 100,
    WASTE_TO_FOUNDATION = 100,
    OPEN_CARD_TABLE = 50,
    FOUNDATION_TO_TABLE = -100,
    ROLL_4_TIMES = -50,
    FINISH_CARD = 1000,
}

export const POINT_PER_TIME_END = 10;

export enum SOLITAIRE_TYPE_MOVE_CARD {
    BOX = 1,
    COLUMN = 2,
}

export const TIME_PLAY = 1000 * 60 * 3; 