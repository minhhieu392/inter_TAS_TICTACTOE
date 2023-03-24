import { TICTACTOE_TYPE, PACKAGE_HEADER } from '../../utils/constants';
import { DataAction, DataEndGame, DataMove } from '../../games/tictactoe/interface';
import { clients } from '../../config/websocket'
import { games } from '../../server/routes/v1/websocket/index'
import { WIN_STATES } from '../../utils/constants';
import catchAsync from "../../utils/catchAsync";
import { Player } from '../../games/tictactoe/interface';
import { encodeMessage, decodeMessage } from '../../utils/helpers';
import { GAME_OVER_TYPE } from './config'
import { WebSocket } from "ws";
import { createPost, deletePost, findAllPosts, findPost, findUniquePost, updatePost } from '../../server/services/game.service';
import { findUser, updateUser } from '../../server/services/user.service';
import {
    hset,
    hget,
    deleteHash,
    hdel,
    hgetall,
    hexists,
    searchKeys,
    scan
} from "../../config/redisClientTictactoe";
const { v4: uuidv4 } = require('uuid');
/* The class is a wrapper for a gRPC service. It has a method for each of the gRPC service's methods.
The methods are called by the gRPC server. The methods call other methods in the class to do the
actual work. The methods also call methods in the gRPC server to send responses to the client. */
export class tictactoeGame {
    private socket: WebSocket;
    private readonly filePath_tictactoe = "src/network/grpc/tic_tac_toe.proto";
    private readonly packageType_tnp = "hcGames.PackageData";
    private readonly filePath_tmp = "src/network/grpc/package.proto";

    /**
     * Description: This is a function that is called when a player joins a game. It sends the game data to the
     * player.
     * @param data 
     */
    playGame = async (data: DataAction) => {
        const listPlayer = data.players
        listPlayer.forEach(async (player: any) => {
            if (clients.has(player.id)) {
                await this.sendMessage(data, this.filePath_tictactoe, "tic_tac_toe.startGame", player, PACKAGE_HEADER.TICTACTOE_SEND_PLAYGAME)
                const newGame = {
                    roomId: data.roomId,
                    groupRoomId: data.gameType,
                    waitingTimeId: '',
                    userId: player.id,
                    status: 0,
                    bonusScore: 0,
                    async: null
                }
                await this.createGame(newGame)
            }
        })
    }
    /**
     * Description: This function is used to check the winner and draw.
     * check moves :
     * 1: isWin => send status win to players
     * 2: isdraw => send status draw to players
     * 3: eles => send movedata to players
     * @param data 
     * @returns 
     */
    movesAction = async (data: DataMove) => {
        let checkStatus = false;
        const game = games[data.roomId];
        const listPlayer = game.players;
        let isWinner = false;
        const curPlayer = data.player;
        if (curPlayer.isTurn) {
            game.board[data.to] = curPlayer.symbol;
            isWinner = WIN_STATES.some((row) => {
                return row.every((cell) => game.board[cell] === curPlayer.symbol);
            });
            if (isWinner || this.checkDraw(game.board)) {
                checkStatus = true;
                this.makeMove(game, data);
                const messageType = isWinner ? GAME_OVER_TYPE.ISWIN : GAME_OVER_TYPE.DRAW;
                const messageData = isWinner ? curPlayer.symbol : 'draw';
                await this.checkBonus(game, messageData)

                await Promise.all(listPlayer.map(async (player: any) => {
                    const message = {
                        type: messageType,
                        data: messageData,
                        score: player.score
                    };
                    if (listPlayer.length === 2) {
                        const updateGame = {
                            userId: player.id,
                            roomId: data.roomId,
                            status: 1,
                            score: player.score,
                            async: null
                        }
                        await this.updateGame(updateGame)
                    }
                    if (clients.has(player.id)) {

                        this.sendMessage(message, this.filePath_tictactoe, "tic_tac_toe.sendWinStatus", player, PACKAGE_HEADER.TICTACTOE_WIN_STATUS);
                    }
                })
                )
                if (game.players.length === 1) {
                    const dataGame = JSON.parse(JSON.stringify(game));
                    await this.gameResultRedis(dataGame)
                }
                delete games[data.roomId];
                listPlayer.forEach((player) => {
                    clients.delete(player.id);
                });
                return;
            }
            game.players.forEach((player) => {
                player.isTurn = !(player.isTurn);
            });
            this.makeMove(game, data);
        } else {
            console.log('err');
        }
        return checkStatus;
    }

    checkDraw(board: any) {
        return WIN_STATES.every((state) => {
            return (
                state.some((index) => board[index] === 'x') &&
                state.some((index) => board[index] === 'o')
            );
        });
    }
    /**
     * Description : This function is used to send a message to the player in the room,
     * informing the opponent has surrendered
     * @param data 
     */
    endGame = async (data: DataEndGame) => {
        const listPlayer = games[data.roomId].players;
        const curPlayer = data.player;
        const symbolWin = (curPlayer.symbol === 'x') ? 'o' : 'x';
        await this.checkBonus(games[data.roomId], symbolWin)
        const message = {
            type: GAME_OVER_TYPE.ISSURRENDER,
            data: symbolWin,
        };
        const sendMessagePromises = listPlayer.map(async (player: any) => {
            if (clients.has(player.id)) {
                return this.sendMessage(message, this.filePath_tictactoe, "tic_tac_toe.sendWinStatus", player, PACKAGE_HEADER.TICTACTOE_WIN_STATUS);
            }
        });
        if (games[data.roomId].players.length === 1) {

        }
        await Promise.all(sendMessagePromises);
        delete games[data.roomId];
        listPlayer.forEach((player) => {
            clients.delete(player.id);
        });
    }
    /**
     * Description : This function is used to send message to players in room.
     * @param payload 
     * @param filePath_tictactoe 
     * @param packageType 
     * @param player 
     * @param header 
     */
    sendMessage = async (payload: any, filePath_tictactoe: any, packageType: any, player: any, header: any) => {
        const toClient = clients.get(player.id);
        const [errorDataEn, payloadDataEn] = await catchAsync(
            encodeMessage(payload, filePath_tictactoe, packageType)
        );
        if (errorDataEn) return;

        const message = {
            header: header,
            data: payloadDataEn,
        };
        const [error, payloadEn] = await catchAsync(
            encodeMessage(message, this.filePath_tmp, this.packageType_tnp)
        );
        if (error) return;

        toClient.send(payloadEn);
    }
    /**
     * Description : This function is used to send movedatas to players in room.
     * @param game 
     * @param dataMove 
     */
    makeMove = (game: any, dataMove: any) => {
        const payload = {
            players: game.players,
            to: dataMove.to,
            symbol: dataMove.player.symbol
        }
        const sendMessagePromises = game.players.map(async (player: Player) => {
            if (clients.has(player.id)) {
                return this.sendMessage(payload, this.filePath_tictactoe, "tic_tac_toe.sendDataAction", player, PACKAGE_HEADER.TICTACTOE_SEND_MOVES);
            }
        });
        Promise.all(sendMessagePromises);
    }
    gameResultRedis = async (game: any) => {
        const dataCheckAsync = {
            userId: (game.players[0].id).toString(),
            gameType: (game.gameType).toString()
        }
        const checkAsyncPlayer = await this.findRecordWithin7DaysByGameType(dataCheckAsync)
        console.log('checkAsyncPlayer', checkAsyncPlayer)
        if (checkAsyncPlayer) {
            let curScore = game.players[0].score;
            let otherScore = parseInt(checkAsyncPlayer.score);
            curScore === otherScore ? (curScore = 0, otherScore = 0) : curScore > otherScore ? (curScore = 10, otherScore = 0) : (curScore = 0, otherScore = 10);
            const asyncId = uuidv4();
            const matchAsyncs = []
            matchAsyncs.push({ roomId: game.roomId, userId: game.players[0].id, score: curScore, async: asyncId })
            matchAsyncs.push({ roomId: checkAsyncPlayer.roomId, userId: parseInt(checkAsyncPlayer.playerId), score: otherScore, async: asyncId })
            await Promise.all(
                matchAsyncs.map(async (matchAsync) => {
                    console.log("matchAsync", matchAsync);
                    await this.updateGame(matchAsync);
                    await this.updatePlayerScore(matchAsync);
                })
            );

            await deleteHash(checkAsyncPlayer.roomId)
        }
        else {
            const currentTime = new Date().toISOString();
            await hset(game.roomId, "roomId", game.roomId);
            await hset(game.roomId, "playerId", game.players[0].id);
            await hset(game.roomId, "gameType", game.gameType);
            await hset(game.roomId, "score", game.players[0].score);
            await hset(game.roomId, "createdAt", currentTime);
        }
    }
    checkBonus = async (game: any, winStatus: string) => {
        game.players.forEach(async (player: any) => {
            if (winStatus === 'draw') player.score = player.score + 0
            else if (winStatus === player.symbol) player.score = player.score + 10
            else player.score = player.score - 10
        })
    }
    updateGame = async (data: any) => {
        try {
            const currentTime = new Date()
            const roomExists = await findPost({ userId: data.userId, roomId: data.roomId })
            console.log('roomExists', roomExists)
            if (!roomExists) throw new Error('room not fount')
            const updateRoom = await updatePost({ id: roomExists.id }, {
                status: data.status,
                bonusScore: data.score,
                updated_at: currentTime,
                async: data.async
            })
            if (updateRoom) console.log('update ok', updateRoom)
        } catch (error) {
            console.log(error)
        }
    }
    updatePlayerScore = async (data: any) => {
        try {
            const currentTime = new Date()
            const userExists = await findUser({ id: data.userId })
            if (!userExists) throw new Error('user not fount')
            const updatePlayerScore = await updateUser({ id: data.userId }, {
                score: data.score,
            })
            if (updatePlayerScore) console.log('update ok', updatePlayerScore)
        } catch (error) {
            console.log(error)
        }
    }
    createGame = async (data: any) => {
        try {
            await createPost({
                roomId: data.roomId,
                groupRoomId: data.groupRoomId,
                waitingTimeId: data.waitingTimeId,
                userId: data.userId,
                status: data.status,
                bonusScore: data.bonusScore,
                async: data.async
            })
        } catch (error) {
            console.log(error)
        }
    }
    findRecordWithin7DaysByGameType = async (data: any) => {
        let cursor = "0";
        let record: { key: string; createdAt: string } = { key: "", createdAt: new Date().toISOString() };
        const currentTime = new Date().getTime();
        const sevenDaysInMillis = 7 * 24 * 60 * 60 * 1000;

        do {
            const [nextCursor, keys] = await scan(cursor, "MATCH", "*");

            for (const key of keys) {
                const createdAt = await hget(key, "createdAt");
                const createdAtTime = new Date(createdAt).getTime();
                const gameType = await hget(key, "gameType");
                const userId = await hget(key, "playerId")

                if (gameType === data.gameType && userId !== data.userId && currentTime - createdAtTime <= sevenDaysInMillis && createdAt < record.createdAt) {
                    record = { key, createdAt };
                }
            }

            cursor = nextCursor;
        } while (cursor !== "0");

        const roomId = await hget(record.key, "roomId");
        const playerId = await hget(record.key, "playerId");
        const score = await hget(record.key, "score");
        const resultKey = record.key
        let result = {
            playerId, score, resultKey, roomId
        }
        if (record.key === '') result = undefined
        return result;
    };
}
