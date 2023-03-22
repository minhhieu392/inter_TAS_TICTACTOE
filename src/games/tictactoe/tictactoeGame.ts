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
    playGame = (data: DataAction) => {
        const listPlayer = data.players
        listPlayer.forEach(async (player: any) => {
            if (clients.has(player.id)) {
                this.sendMessage(data, this.filePath_tictactoe, "tic_tac_toe.startGame", player, PACKAGE_HEADER.TICTACTOE_SEND_PLAYGAME)
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
    movesAction = (data: DataMove) => {
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
                const message = {
                    type: messageType,
                    data: messageData,
                };
                listPlayer.forEach(async (player: any) => {
                    if (clients.has(player.id)) {
                        this.sendMessage(message, this.filePath_tictactoe, "tic_tac_toe.sendWinStatus", player, PACKAGE_HEADER.TICTACTOE_WIN_STATUS);
                    }
                });
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
        this.makeMove(games[data.roomId], data);
        const message = {
            type: GAME_OVER_TYPE.ISSURRENDER,
            data: symbolWin,
        };
        const sendMessagePromises = listPlayer.map(async (player: any) => {
            if (clients.has(player.id)) {
                return this.sendMessage(message, this.filePath_tictactoe, "tic_tac_toe.sendWinStatus", player, PACKAGE_HEADER.TICTACTOE_WIN_STATUS);
            }
        });
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
}
