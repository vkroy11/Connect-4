import { getValidMoves, applyMove, checkWin, isBoardFull } from './gameLogic';

const CENTER_COL = 3;

function evaluate(board, aiColor, humanColor) {
  let score = 0;

  // Prefer center column
  for (let row = 0; row < 6; row++) {
    if (board[row][CENTER_COL] === aiColor) score += 3;
    if (board[row][CENTER_COL] === humanColor) score -= 3;
  }

  // Evaluate all windows of 4
  const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];

  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 7; col++) {
      for (const [dr, dc] of directions) {
        const window = [];
        for (let i = 0; i < 4; i++) {
          const r = row + dr * i;
          const c = col + dc * i;
          if (r < 0 || r >= 6 || c < 0 || c >= 7) break;
          window.push(board[r][c]);
        }
        if (window.length === 4) {
          score += scoreWindow(window, aiColor, humanColor);
        }
      }
    }
  }

  return score;
}

function scoreWindow(window, aiColor, humanColor) {
  const aiCount = window.filter(c => c === aiColor).length;
  const humanCount = window.filter(c => c === humanColor).length;
  const emptyCount = window.filter(c => c === null).length;

  if (aiCount === 4) return 100;
  if (humanCount === 4) return -100;
  if (aiCount === 3 && emptyCount === 1) return 5;
  if (humanCount === 3 && emptyCount === 1) return -4;
  if (aiCount === 2 && emptyCount === 2) return 2;
  if (humanCount === 2 && emptyCount === 2) return -1;

  return 0;
}

function minimax(board, depth, alpha, beta, isMaximizing, aiColor, humanColor) {
  const validMoves = getValidMoves(board);

  if (depth === 0 || validMoves.length === 0) {
    return { score: evaluate(board, aiColor, humanColor), col: null };
  }

  // Order moves: center columns first for better pruning
  const orderedMoves = [...validMoves].sort((a, b) =>
    Math.abs(a.col - CENTER_COL) - Math.abs(b.col - CENTER_COL)
  );

  if (isMaximizing) {
    let bestScore = -Infinity;
    let bestCol = orderedMoves[0].col;

    for (const move of orderedMoves) {
      const newBoard = applyMove(board, move.row, move.col, aiColor);
      const winResult = checkWin(newBoard, { row: move.row, col: move.col, color: aiColor });

      if (winResult) return { score: 10000 + depth, col: move.col };

      if (isBoardFull(newBoard)) return { score: 0, col: move.col };

      const result = minimax(newBoard, depth - 1, alpha, beta, false, aiColor, humanColor);

      if (result.score > bestScore) {
        bestScore = result.score;
        bestCol = move.col;
      }
      alpha = Math.max(alpha, bestScore);
      if (alpha >= beta) break;
    }

    return { score: bestScore, col: bestCol };
  } else {
    let bestScore = Infinity;
    let bestCol = orderedMoves[0].col;

    for (const move of orderedMoves) {
      const newBoard = applyMove(board, move.row, move.col, humanColor);
      const winResult = checkWin(newBoard, { row: move.row, col: move.col, color: humanColor });

      if (winResult) return { score: -10000 - depth, col: move.col };

      if (isBoardFull(newBoard)) return { score: 0, col: move.col };

      const result = minimax(newBoard, depth - 1, alpha, beta, true, aiColor, humanColor);

      if (result.score < bestScore) {
        bestScore = result.score;
        bestCol = move.col;
      }
      beta = Math.min(beta, bestScore);
      if (alpha >= beta) break;
    }

    return { score: bestScore, col: bestCol };
  }
}

export function getBestMove(board, aiColor, difficulty = 'medium') {
  const humanColor = aiColor === 'red' ? 'yellow' : 'red';
  const validMoves = getValidMoves(board);

  if (validMoves.length === 0) return null;

  if (difficulty === 'easy') {
    // Pure random
    return validMoves[Math.floor(Math.random() * validMoves.length)];
  }

  if (difficulty === 'medium') {
    // 30% chance of random move
    if (Math.random() < 0.3) {
      return validMoves[Math.floor(Math.random() * validMoves.length)];
    }
    const result = minimax(board, 3, -Infinity, Infinity, true, aiColor, humanColor);
    return validMoves.find(m => m.col === result.col) || validMoves[0];
  }

  // Hard: deep search
  const result = minimax(board, 6, -Infinity, Infinity, true, aiColor, humanColor);
  return validMoves.find(m => m.col === result.col) || validMoves[0];
}
