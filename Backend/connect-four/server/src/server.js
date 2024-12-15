
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

class Game {
  constructor(id) {
    this.id = id;
    this.board = Array(6).fill().map(() => Array(7).fill(null));
    this.players = [];
    this.currentTurn = null;
    this.status = 'waiting';
    this.winner = null;
    this.moveCount = 0;
    this.lastMove = null;
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

    if (this.players.length === 2) {
      this.status = 'playing';
      // Red player (first player) always starts
      this.currentTurn = this.players.find(p => p.color === 'red').id;
    }

    return newPlayer;
  }

  makeMove(playerId, row, col) {
    console.log('Making move:', { playerId, row, col, currentTurn: this.currentTurn });
    
    // Validate turn
    if (this.currentTurn !== playerId || this.status !== 'playing') {
      console.log('Invalid turn or game not playing');
      return false;
    }

    // Validate position
    if (!this.isValidPosition(row, col) || this.board[row][col] !== null) {
      console.log('Invalid position or cell not empty');
      return false;
    }

    // Get player color
    const player = this.players.find(p => p.id === playerId);
    if (!player) {
      console.log('Player not found');
      return false;
    }

    // Make move
    this.board[row][col] = player.color;
    this.lastMove = { row, col, color: player.color };
    this.moveCount++;

    // Check win
    if (this.checkWin(row, col, player.color)) {
      this.status = 'finished';
      this.winner = playerId;
      return true;
    }

    // Check draw
    if (this.moveCount === 42) {
      this.status = 'finished';
      return true;
    }

    // Switch turns
    this.currentTurn = this.players.find(p => p.id !== playerId).id;
    return true;
  }

  checkWin(row, col, color) {
    const directions = [
      [0, 1],  // horizontal
      [1, 0],  // vertical
      [1, 1],  // diagonal right
      [1, -1], // diagonal left
    ];

    return directions.some(([dr, dc]) => {
      let count = 1;
      
      // Check positive direction
      for (let i = 1; i < 4; i++) {
        const newRow = row + (dr * i);
        const newCol = col + (dc * i);
        if (!this.isValidPosition(newRow, newCol)) break;
        if (this.board[newRow][newCol] !== color) break;
        count++;
      }
      
      // Check negative direction
      for (let i = 1; i < 4; i++) {
        const newRow = row - (dr * i);
        const newCol = col - (dc * i);
        if (!this.isValidPosition(newRow, newCol)) break;
        if (this.board[newRow][newCol] !== color) break;
        count++;
      }

      return count >= 4;
    });
  }

  isValidPosition(row, col) {
    return row >= 0 && row < 6 && col >= 0 && col < 7;
  }

  removePlayer(playerId) {
    this.players = this.players.filter(p => p.id !== playerId);
    if (this.players.length < 2) {
      this.status = 'waiting';
      this.currentTurn = null;
    }
  }

  reset() {
    this.board = Array(6).fill().map(() => Array(7).fill(null));
    this.status = 'playing';
    this.currentTurn = this.players[0].id;
    this.winner = null;
    this.moveCount = 0;
    this.lastMove = null;
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
}

// Store active games
const games = new Map();

// Socket connection handler
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('createGame', ({ gameId, playerName }) => {
    console.log('Creating game:', { gameId, playerName });
    
    if (games.has(gameId)) {
      socket.emit('error', 'Game already exists');
      return;
    }

    const game = new Game(gameId);
    const player = game.addPlayer({ id: socket.id, name: playerName });
    games.set(gameId, game);
    
    socket.join(gameId);
    socket.emit('gameCreated', {
      id: gameId,
      player: player
    });
  });

  socket.on('joinGame', ({ gameId, playerName }) => {
    console.log('Joining game:', { gameId, playerName });
    
    const game = games.get(gameId);
    if (!game) {
      socket.emit('error', 'Game not found');
      return;
    }

    if (game.players.length >= 2) {
      socket.emit('error', 'Game is full');
      return;
    }

    const player = game.addPlayer({ id: socket.id, name: playerName });
    if (player) {
      socket.join(gameId);
      
      io.to(gameId).emit('gameStart', {
        gameId: game.id,
        players: game.players,
        currentTurn: game.currentTurn,
        board: game.board,
        status: game.status
      });
    }
  });

  socket.on('makeMove', ({ gameId, move }) => {
    const game = games.get(gameId);
    if (!game) return;

    console.log('Move received:', { gameId, move, playerId: socket.id });

    if (game.makeMove(socket.id, move.row, move.col)) {
      const gameState = game.getState();
      
      io.to(gameId).emit('moveMade', {
        board: gameState.board,
        move: move,
        nextPlayer: gameState.status === 'playing' ? 
          game.players.find(p => p.id === game.currentTurn).color : 
          null,
        nextTurn: game.currentTurn,
        gameStatus: gameState.status,
        winner: gameState.winner,
        lastMove: gameState.lastMove
      });
    }
  });

  socket.on('mouseMove', ({ gameId, position }) => {
    socket.to(gameId).emit('opponentMouseMove', position);
  });

  socket.on('resetGame', ({ gameId }) => {
    const game = games.get(gameId);
    if (game && game.players.some(p => p.id === socket.id)) {
      game.reset();
      io.to(gameId).emit('gameReset', game.getState());
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    for (const [gameId, game] of games.entries()) {
      if (game.players.some(p => p.id === socket.id)) {
        game.removePlayer(socket.id);
        
        if (game.players.length === 0) {
          games.delete(gameId);
        } else {
          io.to(gameId).emit('playerDisconnected', game.getState());
        }
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});