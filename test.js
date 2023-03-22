let gameBoard = ["", "", "", "", "", "", "", "", ""];

// Hàm để đánh dấu ô đã được chọn
function markCell(index, symbol) {
  gameBoard[index] = symbol;
}

// Hàm để kiểm tra xem ai đã thắng
function checkWinner() {
  // Kiểm tra hàng ngang
  for (let i = 0; i <= 6; i += 3) {
    if (
      gameBoard[i] !== "" &&
      gameBoard[i] === gameBoard[i + 1] &&
      gameBoard[i] === gameBoard[i + 2]
    ) {
      return gameBoard[i];
    }
  }
  // Kiểm tra hàng dọc
  for (let i = 0; i <= 2; i++) {
    if (
      gameBoard[i] !== "" &&
      gameBoard[i] === gameBoard[i + 3] &&
      gameBoard[i] === gameBoard[i + 6]
    ) {
      return gameBoard[i];
    }
  }
  // Kiểm tra đường chéo
  if (
    gameBoard[0] !== "" &&
    gameBoard[0] === gameBoard[4] &&
    gameBoard[0] === gameBoard[8]
  ) {
    return gameBoard[0];
  }
  if (
    gameBoard[2] !== "" &&
    gameBoard[2] === gameBoard[4] &&
    gameBoard[2] === gameBoard[6]
  ) {
    return gameBoard[2];
  }
  // Kiểm tra xem bảng đã đầy chưa
  if (!gameBoard.includes("")) {
    return "draw";
  }
  // Nếu chưa ai thắng và bảng còn trống, trả về null
  return null;
}

// Hàm tính giá trị Minimax
function minimax(depth, maximizingPlayer) {
  // Kiểm tra xem trò chơi đã kết thúc chưa
  let result = checkWinner();
  if (result !== null) {
    // Nếu trò chơi kết thúc, trả về giá trị tương ứng
    if (result === "O") {
      return 10 - depth;
    } else if (result === "X") {
      return depth - 10;
    } else {
      return 0;
    }
  }

  if (maximizingPlayer) {
    let bestScore = -Infinity;
    let bestMove = null;
    // Lặp lại tất cả các ô trống trên bảng
    for (let i = 0; i < gameBoard.length; i++) {
      if (gameBoard[i] === "") {
        // Đánh O vào ô trống hiện tại
        markCell(i, "O");
        // Gọi đệ quy tính giá trị Minimax cho nước đi này
        let score = minimax(depth + 1, false);
        // Hủy đánh dấu ô hiện tại
        markCell(i, "");
        // Nếu giá trị Minimax cho nước đi này tốt hơn nước đi tốt nhất trước đó, lưu lại vị trí đó và giá trị Minimax
        if (score > bestScore) {
          bestScore = score;
          bestMove = i;
        }
      }
    }
    // Nếu đây là lần đầu tiên gọi hàm Minimax (không phải đệ quy), trả về vị trí đánh O tốt nhất
    if (depth === 0) {
      return bestMove;
    }
    // Nếu không phải lần đầu tiên gọi hàm Minimax, trả về giá trị Minimax tốt nhất cho người chơi hiện tại
    return bestScore;
  } else {
    let bestScore = Infinity;
    // Lặp lại tất cả các ô trống trên bảng
    for (let i = 0; i < gameBoard.length; i++) {
      if (gameBoard[i] === "") {
        // Đánh X vào ô trống hiện tại
        markCell(i, "X");
        // Gọi đệ quy tính giá trị Minimax cho nước đi này
        let score = minimax(depth + 1, true);
        // Hủy đánh dấu ô hiện tại
        markCell(i, "");
        // Nếu giá trị Minimax cho nước đi này tốt hơn nước đi tốt nhất trước đó, cập nhật giá trị Minimax
        if (score < bestScore) {
          bestScore = score;
        }
      }
    }
    // Trả về giá trị Minimax tốt nhất cho người chơi hiện tại
    return bestScore;
  }
}

// Hàm đánh O
function playO() {
  // Gọi hàm Minimax để tính vị trí đánh O tốt nhất
  let index = minimax(0, true);
  // Đánh O vào vị trí tính được
  markCell(index, "O");
  // Kiểm tra xem trò chơi đã kết thúc chưa
  let result = checkWinner();
  if (result !== null) {
    // Nếu trò chơi kết thúc, hiển thị thông báo kết quả và hỏi người chơi có muốn chơi lại không
    let message;
    if (result === "O") {
      message = "Bạn đã thắng!";
    } else if (result === "X") {
      message = "Bạn đã thua!";
    } else {
      message = "Hòa!";
    }
    // let playAgain = confirm(${message} Chơi lại?);
    let playAgain;
    if (playAgain) {
      resetBoard();
    }
  }
}

// Hàm đánh X
function playX(index) {
  // Đánh X vào vị trí được chọn
  markCell(index, "X");
  // Kiểm tra xem trò chơi đã kết thúc chưa
  let result = checkWinner();
  if (result !== null) {
    // Nếu trò chơi kết thúc, hiển thị thông báo kết quả và hỏi người chơi có muốn chơi lại không
    let message;
    if (result === "O") {
      message = "Bạn đã thắng!";
    } else if (result === "X") {
      message = "Bạn đã thua!";
    } else {
      message = "Hòa!";
    }
    // let playAgain = confirm(${message} Chơi lại?);
    let playAgain;
    if (playAgain) {
      resetBoard();
    }
  } else {
    // Nếu trò chơi chưa kết thúc, đánh O
    playO();
  }
}

// Gán sự kiện click cho tất cả các ô trên bảng
let cells = document.querySelectorAll(".cell");
for (let i = 0; i < cells.length; i++) {
  cells[i].addEventListener("click", function() {
    if (gameBoard[i] === "") {
      playX(i);
    }
  });
}

// Reset bảng
function resetBoard() {
  gameBoard = ["", "", "", "", "", "", "", "", ""];
  for (let i = 0; i < cells.length; i++) {
    cells[i].textContent = "";
  }
}
