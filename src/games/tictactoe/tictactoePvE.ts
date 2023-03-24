
import { tictactoeGame } from "./tictactoeGame";
import { games } from '../../server/routes/v1/websocket/index'

/**
 * Description : It's a class that has a method that marks a cell on a board, and if the cell is marked by the
 * player, it will automatically mark a cell for the computer
 */
export class tictactoePvE {
    private gameMain = new tictactoeGame()

    /**
     * Description : Function markCell()
     * If the player's move is valid, then mark the cell with the player's symbol. If the player's move
     * is invalid, then mark the cell with the computer's symbol.
     * @param payload 
     */
    async markCell(payload) {
        games[payload.roomId].board[payload.to] = payload.symbol;
        const moveAction = await this.gameMain.movesAction(payload)
        if (!moveAction && !games[payload.roomId] ?.players[0].isTurn) this.autoMarkO(payload)
    }

    private anyEmptyCell(payload) {
        return games[payload.roomId] ?.board.includes("");
    }

    /**
     * Description : Function randomEmptyCell
     * It returns a random index of an empty cell in the board.
     * @param payload 
     * @returns The index of the empty cell.
     */
    private randomEmptyCell(payload) {
        let emptyCells = [];
        for (let i = 0; i < games[payload.roomId].board.length; i++) {
            if (games[payload.roomId].board[i] === "") {
                emptyCells.push(i);
            }
        }
        let randomIndex = Math.floor(Math.random() * emptyCells.length);
        return emptyCells[randomIndex];
    }

    /**
     * Description : Function autoMarkO
     * It takes a payload, checks if there are any empty cells, if there are, it picks a random empty
     * cell, marks it with an 'o', and returns the index of the cell it marked.
     * @param payload 
     * @returns The randomIndex is being returned.
     */
    private autoMarkO(payload) {
        let randomIndex: any
        if (this.anyEmptyCell(payload)) {
            randomIndex = this.randomEmptyCell(payload);
            payload.player.symbol = 'o'
            const dataMove = {
                player: payload.player,
                roomId: payload.roomId,
                to: randomIndex,
                symbol: 'o'
            }
            this.markCell(dataMove);
        }
        return randomIndex
    }
}

