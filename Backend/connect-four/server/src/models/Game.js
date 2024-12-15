const GameUtils = require('../utils/gameUtils');

class Game {
  constructor(id) {
    this.id = id;
    this.board = Array(6).fill().map(() => Array(7).fill(null));
    this.players = [];
    this.currentTurn = null;
    this.status = 'waiting'; // waiting, playing, finished
    this.winner = null;
    this.lastMove = null;
    this.moveHistory = [];
    this.startTime = null;
    this.timeouts = new Map(); // Store timeouts for each player
  }

  addPlayer(player) {
    if (this.players.length >= 2) return false;
    
    this.players.push({
      id: player.id,
      name: player.name,
      color: this.players.length === 0 ? 'red' : 'yellow'
    });

    if (this.players.length === 2) {
      this.status = 'playing';
      this.currentTurn = this.players[0].id;
      this.startTime = Date.now();
    }

    return true;
  }

  removePlayer(playerId) {
    this.players = this.players.filter(p => p.id !== playerId);
    if (this.players.length < 2) {
      this.status = 'waiting';
      this.currentTurn = null;
    }
  }

  makeMove(playerId, row, col) {
    if (
      this.status !== 'playing' ||
      this.currentTurn !== playerId ||
      !GameUtils.isValidPosition(row, col) ||
      this.board[row][col] !== null
    ) {
      return false;
    }

    const player = this.players.find(p => p.id === playerId);
    this.board[row][col] = player.color;
    this.lastMove = { row, col, player: player.color };
    this.moveHistory.push({ ...this.lastMove, timestamp: Date.now() });

    // Clear timeout for current player
    if (this.timeouts.has(playerId)) {
      clearTimeout(this.timeouts.get(playerId));
      this.timeouts.delete(playerId);
    }

    // Check for win
    const winner = GameUtils.checkWin(this.board, this.lastMove);
    if (winner) {
      this.status = 'finished';
      this.winner = player;
      return true;
    }

    // Check for draw
    if (GameUtils.isBoardFull(this.board)) {
      this.status = 'finished';
      return true;
    }

    // Switch turns
    this.currentTurn = this.players.find(p => p.id !== playerId).id;
    return true;
  }

  setMoveTimeout(playerId, callback, duration = 30000) {
    if (this.timeouts.has(playerId)) {
      clearTimeout(this.timeouts.get(playerId));
    }

    const timeout = setTimeout(() => {
      // Make random move if time runs out
      const validMoves = GameUtils.getValidMoves(this.board);
      if (validMoves.length > 0) {
        const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
        this.makeMove(playerId, randomMove.row, randomMove.col);
        callback(randomMove);
      }
    }, duration);

    this.timeouts.set(playerId, timeout);
  }

  clearTimeouts() {
    for (const timeout of this.timeouts.values()) {
      clearTimeout(timeout);
    }
    this.timeouts.clear();
  }

  getState() {
    return {
      id: this.id,
      board: this.board,
      players: this.players,
      currentTurn: this.currentTurn,
      status: this.status,
      winner: this.winner,
      lastMove: this.lastMove
    };
  }

  reset() {
    this.board = Array(6).fill().map(() => Array(7).fill(null));
    this.currentTurn = this.players[0].id;
    this.status = 'playing';
    this.winner = null;
    this.lastMove = null;
    this.moveHistory = [];
    this.startTime = Date.now();
    this.clearTimeouts();
  }
}

module.exports = Game;
