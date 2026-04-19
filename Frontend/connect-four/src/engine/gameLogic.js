export function isValidPosition(row, col) {
  return row >= 0 && row < 6 && col >= 0 && col < 7;
}

export function isBoardFull(board) {
  return board[0].every(cell => cell !== null);
}

export function getValidMoves(board) {
  const moves = [];
  for (let col = 0; col < 7; col++) {
    for (let row = 5; row >= 0; row--) {
      if (!board[row][col]) {
        moves.push({ row, col });
        break;
      }
    }
  }
  return moves;
}

export function getLowestRow(board, col) {
  for (let row = 5; row >= 0; row--) {
    if (!board[row][col]) return row;
  }
  return -1;
}

export function applyMove(board, row, col, color) {
  const newBoard = board.map(r => [...r]);
  newBoard[row][col] = color;
  return newBoard;
}

export function checkWin(board, lastMove) {
  if (!lastMove) return null;
  const { row, col, color } = lastMove;

  const directions = [
    [0, 1],  // horizontal
    [1, 0],  // vertical
    [1, 1],  // diagonal right
    [1, -1]  // diagonal left
  ];

  for (const [dr, dc] of directions) {
    const cells = [{ row, col }];

    for (let i = 1; i < 4; i++) {
      const newRow = row + (dr * i);
      const newCol = col + (dc * i);
      if (!isValidPosition(newRow, newCol)) break;
      if (board[newRow][newCol] !== color) break;
      cells.push({ row: newRow, col: newCol });
    }

    for (let i = 1; i < 4; i++) {
      const newRow = row - (dr * i);
      const newCol = col - (dc * i);
      if (!isValidPosition(newRow, newCol)) break;
      if (board[newRow][newCol] !== color) break;
      cells.push({ row: newRow, col: newCol });
    }

    if (cells.length >= 4) return { winner: color, cells };
  }

  return null;
}
