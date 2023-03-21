import { encodeMessage, decodeMessage } from "../src/utils/helpers";
import catchAsync from "../src/utils/catchAsync";
const filePath_tictactoe = "src/network/grpc/tic_tac_toe.proto";
const packageType_tnp = "hcGames.PackageData";
const filePath_tmp = "src/network/grpc/package.proto";
let clientId;
let gameId;
let isTurn = false;
let yourSymbol;
let socket;
let board;
let game;

const connectBtn = document.getElementById("connectBtn");
const newGameBtn = document.getElementById("newGame");
const currGames = document.getElementById("currGames");
const joinGame = document.querySelector('button[type="submit"]');
const cells = document.querySelectorAll("#cell");
const gameBoard = document.querySelector("#board");
const userCol = document.querySelector(".flex-col1");

connectBtn.addEventListener("click", () => {
  console.log("okokoko");
  socket = new WebSocket("ws://localhost:8080");
  socket.onopen = function(event) {};
  newGameBtn.addEventListener("click", () => {
    const payloadData = {
        userCodeId: "23f11630827f18e0781431534140465e_1677928900536",
        ccData: {
          miniGameEventId: 222,
          token:
            "create_token_c405a57714e888b441eefa2d8cf2b76b5c7285613d303ac8f2fb00499cc8941c",
        },
      };
      const [errorDataEn, payloadDataEn] = await catchAsync(
        encodeMessage(
          payloadData,
          "src/network/grpc/package.proto",
          "hcGames.FindingRoom"
        )
      );
      const message = {
        header: 1,
        data: payloadDataEn,
      };
      const [error, payloadEn] = await catchAsync(
        encodeMessage(message, this.filePath_tmp, this.packageType_tnp)
      );
  
      socket.send(JSON.stringify(payloadEn));
  });

  socket.onmessage = function(msg) {
    const data = JSON.parse(msg.data);
    switch (data.method) {
      case "connect":
        clientId = data.clientId;
        userCol.innerHTML = `ClientId: ${clientId}`;
        userCol.classList.add("joinLabel");
        break;
      case "create":
        // inform you have successfully created the game and been added as player1
        gameId = data.game.gameId;
        yourSymbol = data.game.players[0].symbol;
        console.log(`game id is ${gameId} and your symbol is ${yourSymbol}`);
        cells.forEach((cell) => {
          cell.classList.remove("x");
          cell.classList.remove("cirlce");
        });
        break;

      case "gamesAvail":
        while (currGames.firstChild) {
          currGames.removeChild(currGames.lastChild);
        }
        const games = data.games;
        games.forEach((game) => {
          const li = document.createElement("li");
          li.addEventListener("click", selectGame);
          li.innerText = game;
          currGames.appendChild(li);
        });
        break;
      case "join":
        gameId = data.game.gameId;
        yourSymbol = data.game.players[1].symbol;
        console.log(`game id is ${gameId} and your symbol is ${yourSymbol}`);
        cells.forEach((cell) => {
          console.log(`cell classes are ${cell.classList}`);
          cell.classList.remove("x");
          cell.classList.remove("cirlce");
        });
        break;
      case "updateBoard":
        gameBoard.style.display = "grid";
        console.log(`game updateBoard is ${data.game.board}`);
        game = data.game;
        console.log("game", game);
        board = game.board;
        const symbolClass = yourSymbol == "x" ? "x" : "circle";
        gameBoard.classList.add(symbolClass);
        index = 0;
        cells.forEach((cell) => {
          if (board[index] == "x") cell.classList.add("x");
          else if (board[index] == "o") cell.classList.add("circle");
          else cell.addEventListener("click", clickCell);
          index++;
        });

        game.players.forEach((player) => {
          if (player.clientId == +clientId && player.isTurn == true) {
            isTurn = true;
            console.log(`your turn`);
          }
        });
        break;

      case "gameEnds":
        console.log(`Winner is ${data.winner}`);
        window.alert(`Winner is ${data.winner}`);
        break;
      case "draw":
        alert("Its a draw");
        break;
    }
  };

  socket.onclose = function(event) {};

  socket.onerror = function(err) {};
});

function selectGame(src) {
  gameId = +src.target.innerText;
  joinGame.addEventListener("click", joingm, { once: true });
}

function joingm() {
  const payLoad = {
    method: "join",
    clientId: clientId,
    gameId: gameId,
  };
  socket.send(JSON.stringify(payLoad));
}

function clickCell(event) {
  if (
    !isTurn ||
    event.target.classList.contains("x") ||
    event.target.classList.contains("circle")
  )
    return;

  const cellclass = yourSymbol == "x" ? "x" : "circle";
  event.target.classList.add(cellclass);

  index = 0;
  cells.forEach((cell) => {
    if (cell.classList.contains("x")) board[index] = "x";
    if (cell.classList.contains("circle")) board[index] = "o";
    index++;
  });
  isTurn = false;
  makeMove();
}

function makeMove() {
  index = 0;
  cells.forEach((cell) => {
    if (cell.classList.contains("x")) game.board[index] == "x";

    if (cell.classList.contains("circle")) game.board[index] == "o";
    index++;
  });
  cells.forEach((cell) => cell.removeEventListener("click", clickCell));
  const payLoad = {
    method: "makeMove",
    game: game,
  };
  socket.send(JSON.stringify(payLoad));
  console.log("payload", payLoad);
}
