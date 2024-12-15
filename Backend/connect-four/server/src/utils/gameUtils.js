class GameUtils {
    static checkWin(board, lastMove) {
      if (!lastMove) return null;
      const { row, col, player } = lastMove;
      
      // Check directions: horizontal, vertical, diagonal
      const directions = [
        [0, 1],  // horizontal
        [1, 0],  // vertical
        [1, 1],  // diagonal right
        [1, -1]  // diagonal left
      ];
  
      for (const [dr, dc] of directions) {
        let count = 1; // Count the current piece
        
        // Check in positive direction
        for (let i = 1; i < 4; i++) {
          const newRow = row + (dr * i);
          const newCol = col + (dc * i);
          if (!this.isValidPosition(newRow, newCol)) break;
          if (board[newRow][newCol] !== player) break;
          count++;
        }
        
        // Check in negative direction
        for (let i = 1; i < 4; i++) {
          const newRow = row - (dr * i);
          const newCol = col - (dc * i);
          if (!this.isValidPosition(newRow, newCol)) break;
          if (board[newRow][newCol] !== player) break;
          count++;
        }
  
        if (count >= 4) return player;
      }
      
      return null;
    }
  
    static isValidPosition(row, col) {
      return row >= 0 && row < 6 && col >= 0 && col < 7;
    }
  
    static isBoardFull(board) {
      return board[0].every(cell => cell !== null);
    }
  
    static getValidMoves(board) {
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
  }
  
  module.exports = GameUtils;
  