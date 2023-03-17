import { string } from "joi";

export const WIN_STATES = Array(
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6])
export const BOARD: string[] = ["", "", "", "", "", "", "", "", ""];
export enum GAME_TYPE {
    NONE = 0,
    BILLIARDS = 1,
    BINGO = 2,
    PUZZLE = 3,
    SOLITAIRE = 4,
    BUBBLE_SHOOTER = 5,
    TICTACTOE = 6
}

export enum BALL_GROUP_TYPE {
    BGT_NONE = 0,
    BGT_17 = 1,
    BGT_915 = 2,
}

export enum SHOOT_ERROR_CODE {
    SEC_NONE = 0,
    SEC_WHITE_BALL_DIE = 1,
    SEC_INVALID_BALL_GROUP = 2,
    SEC_WHITE_BALL_NOT_IMPACT_ANYTHING = 3,
    SEC_DONT_ANY_BALL_IMPACT_BUMPER = 4,
    SEC_WHITE_BALL_NOT_IMPACT_ANYBALL = 5,
}

export enum GAME_ACTION {
    CREATE_ROOM = "create-room",
    JOIN_ROOM = "join-room",
    END_USER = "end_user",
    END_ROOM = "end-room",
}

export enum ROOM_STATUS {
    RS_NONE = 0,
    RS_WAITING = 1,
    RS_PLAYING = 2,
    RS_STOPPED = 3,
}

export enum POSITION_JOIN_ROOM {
    FIRST_JOIN = 1,
    SECOND_JOIN = 2,
}

export enum GAME_MODE {
    KNOCKOUT_8 = 1,
    KNOCKOUT_16 = 2,
    KNOCKOUT_32 = 3,
    KNOCKOUT_64 = 4,
    ROUND_ROBIN = 5,
    ONE_VS_MANY = 6,
    HEAD_TO_HEAD = 7,
}

export enum GAME_MODE_TYPE {
    NONE = 0,
    HEAD_TO_HEAD = 1,
    KNOCKOUT_ROUND_TOUR = 2,
    ROUND_ROBIN = 3,
    ONE_VS_MANY = 4,
}

export enum MESSAGE_ERROR_BONUSGAME_TYPE {
    SUCCESS = 1,
    ERROR_AUTHORIZE = 2,
    ERROR_NOT_ENOUGH_FEE = 3,
    ERROR_NOTFOUND = 4,
    ERROR_NOT_ENOUGH_TICKET = 5,
    ERROR_NOT_ENOUGH_HC = 6,
}

export enum GAME_OVER_TYPE {
    TIME_OVER = 0,
    QUIT = 1,
    SUCCESS = 2,
    NONE = 3,
}

export enum PACKAGE_HEADER {
    FINDING_ROOM_TICTICTOE = 12,
    NONE = 0,
    FINDING_ROOM = 1,
    FINDING_ROOM_RESP = 2,
    CREATE_ROOM = 3,
    CREATE_ROOM_RESP = 4,
    UPDATE_JOIN_ROOM = 5,
    UPDATE_TURN = 6,
    DISCONNECTED = 7,
    PING = 8,
    VERIFY = 9,
    FINDING_MINIGAME_EVENT = 10,
    JOIN_NEXT_MINIGAME_ROUND = 11,

    //tic-tac-toe
    TICTACTOE_END_GAME = 9000,
    TICTACTOE_UPDATE_END_GAME = 9001,
    TICTACTOE_PLAY_GAME = 9002,
    TICTACTOE_ACTION = 9003,

}

export const WS_PORT = 2023;

export enum SCRATCH_MESSAGE_TYPE {
    PLAY_GAME = 1,
    INIT_GAME = 2,
}

export enum SOLITAIRE_ERROR_CODE {
    NONE = 0,
    MOVE_CARD_INVALID = 1,
    GAME_NOT_START = 2,
    CAN_NOT_UNDO = 3,
}

export enum ROULETTE_MESSAGE_TYPE {
    PLAY_GAME = 1,
    INIT_GAME = 2,
}

export enum ROULETTE_INIT_TYPE {
    FREE = 1,
    NOT_FREE = 2,
}

export enum RANDOM_BOX_MESSAGE_TYPE {
    PLAY_GAME = 1,
    INIT_GAME = 2,
}

// constant Tetris
export enum TETRIS_MESSAGE_TYPE {
    PLAY_GAME = 1,
    PAUSE_GAME = 2,
    EXIT_GAME = 3,
    ENTER_RIGHT = 4,
    ENTER_LEFT = 5,
    ENTER_DOWN = 6,
    ENTER_DROP = 7,
    ENTER_ROTATE = 8,
}

export enum TETRIS_STATUS_PLAY {
    END = 0,
    PLAYING = 1,
    PAUSE = 2,
}

// constant puzzle
export enum PUZZLE_TYPE {
    PLAY_GAME = 1,
    END_GAME = 2,
    CLEAR = 3,
    RESET = 4,
    SWAP_UP = 5,
    SWAP_DOWN = 6,
    SWAP_LEFT = 7,
    SWAP_RIGHT = 8,
}

export enum BUBBLE_SHOOTER_TYPE {
    PLAY_GAME = 1,
    UPDATE_POINT = 2,
    END_GAME = 3,
}

export enum PUZZLE_STATUS_PLAY {
    INIT = 0,
    PLAYING = 1,
    END = 2,
    WIN = 3,
    LOSE = 4,
}

export enum BUBBLE_SHOOTER_STATUS_PLAY {
    INIT = 0,
    PLAYING = 1,
    END = 2,
    WIN = 3,
    LOSE = 4,
}

// constant solitaire
export enum SOLITAIRE_STATUS_PLAY {
    INIT = 0,
    PLAYING = 1,
    END = 2,
}

export enum SOLITAIRE_TYPE {
    PLAY_GAME = 1,
    MOVE_CARD = 2,
    ROLL_REMAIN = 3,
    UNDO_ACTION = 4,
    END_GAME = 5,
}

export enum TICTACTOE_STATUS_PLAY {
    INIT = 0,
    PLAYING = 1,
    END = 2,
}

export enum TICTACTOE_TYPE {
    PLAY_GAME = 1,
    ACTION = 2,
    END_GAME = 5,
}


export enum BONUS_GAME_DATA_REDIS_TYPE {
    ALL = 1,
    BONUS_GAME_LIST = 2,
    BONUS_REWARD_BY_ID = 3,
}

export enum BONUS_GAME_NAME {
    SCRATCH = "SCRATCH",
    ROULETTE = "ROULETTE",
    RANDOMBOX = "RANDOMBOX",
}

export enum BONUS_GAME_ROULETTE_INDEX {
    SLOT_SPIN = 1,
    JACKPOT = 2,
    TICKET = 3,
    GOLD = 4,
    HC_TOKEN = 5,
}

export enum BONUS_GAME_ROULETTE_TITLE {
    SLOT_SPIN = "Slot Spin",
    JACKPOT = "Jackpot",
    TICKET = "Ticket",
    GOLD = "Gold",
    HC_TOKEN = "HC Token",
}

export enum USER_STATUS_PLAY_BONUSGAME {
    NOT_ALLOW = 0,
    ALLOW = 1,
}

export enum USER_FEE_PLAY_BONUSGAME {
    BY_TICKET = 1,
    BY_TOKEN = 2,
}

export enum PUZZLE_TYPE_RESPONSE {
    GAME_INFO = 1,
    GAME_INFO_OTHER_PLAYER = 2,
}

export enum BUBBLE_SHOOTER_TYPE_RESPONSE {
    GAME_INFO = 1,
    GAME_INFO_OTHER_PLAYER = 2,
}

export enum ROOM_TYPE {
    ASYNCHRONOUS = 1, // bất đồng bộ
    SYNCHRONOUS = 2, // đồng bộ
}

export const MATCHING_MMR_RANGE = [
    { from: 0, to: 500 },
    { from: 501, to: 1000 },
    { from: 1001, to: 5000 },
    { from: 5001, to: 10000 },
    { from: 10001, to: 50000 },
    { from: 50001, to: null },
];

export enum ROOM_WAITING_STATUS {
    READY = "READY",
    PROCESS = "PROCESS",
}
