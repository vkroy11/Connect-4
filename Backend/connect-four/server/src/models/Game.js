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
    this.moveCount = 0;
    this.startTime = null;
    this.createdAt = Date.now();
    this.lastActivityAt = Date.now();
    this.timeouts = new Map();
    this.winningCells = null;
  }

  addPlayer(player) {
    if (this.players.length >= 2) return false;

    const color = this.players.length === 0 ? 'red' : 'yellow';
    const newPlayer = {
      id: player.id,
      name: player.name,
      color: color
    };

    this.players.push(newPlayer);
    this.lastActivityAt = Date.now();

    if (this.players.length === 2) {
      this.status = 'playing';
      this.currentTurn = this.players.find(p => p.color === 'red').id;
      this.startTime = Date.now();
    }

    return newPlayer;
  }

  removePlayer(playerId) {
    this.players = this.players.filter(p => p.id !== playerId);
    this.lastActivityAt = Date.now();
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
    this.lastMove = { row, col, color: player.color };
    this.moveCount++;
    this.moveHistory.push({ ...this.lastMove, timestamp: Date.now() });
    this.lastActivityAt = Date.now();

    // Clear timeout for current player
    if (this.timeouts.has(playerId)) {
      clearTimeout(this.timeouts.get(playerId));
      this.timeouts.delete(playerId);
    }

    // Check for win
    const winResult = GameUtils.checkWin(this.board, this.lastMove);
    if (winResult) {
      this.status = 'finished';
      this.winner = playerId;
      this.winningCells = winResult.cells || null;
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
      lastMove: this.lastMove,
      winningCells: this.winningCells
    };
  }

  reset() {
    this.board = Array(6).fill().map(() => Array(7).fill(null));
    this.currentTurn = this.players[0].id;
    this.status = 'playing';
    this.winner = null;
    this.lastMove = null;
    this.moveHistory = [];
    this.moveCount = 0;
    this.startTime = Date.now();
    this.lastActivityAt = Date.now();
    this.winningCells = null;
    this.clearTimeouts();
  }
}

module.exports = Game;
