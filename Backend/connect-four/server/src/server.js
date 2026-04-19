const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const config = require('./config/config');
const Game = require('./models/Game');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: config.corsOrigin,
    methods: ["GET", "POST"]
  }
});

// Store active games
const games = new Map();

// Cleanup stale games every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [gameId, game] of games.entries()) {
    if (now - game.lastActivityAt > 30 * 60 * 1000) {
      game.clearTimeouts();
      games.delete(gameId);
    }
  }
}, 5 * 60 * 1000);

// Socket connection handler
io.on('connection', (socket) => {
  socket.on('createGame', ({ gameId, playerName }) => {
    try {
      if (!gameId || !playerName || typeof playerName !== 'string') {
        socket.emit('error', 'Invalid game ID or player name');
        return;
      }

      if (games.has(gameId)) {
        socket.emit('error', 'Game already exists');
        return;
      }

      const game = new Game(gameId);
      const player = game.addPlayer({ id: socket.id, name: playerName.trim() });
      games.set(gameId, game);

      socket.join(gameId);
      socket.emit('gameCreated', {
        id: gameId,
        player: player
      });
    } catch (err) {
      socket.emit('error', 'Failed to create game');
    }
  });

  socket.on('joinGame', ({ gameId, playerName }) => {
    try {
      if (!gameId || !playerName || typeof playerName !== 'string') {
        socket.emit('error', 'Invalid game ID or player name');
        return;
      }

      const game = games.get(gameId);
      if (!game) {
        socket.emit('error', 'Game not found');
        return;
      }

      if (game.players.length >= 2) {
        socket.emit('error', 'Game is full');
        return;
      }

      const player = game.addPlayer({ id: socket.id, name: playerName.trim() });
      if (player) {
        socket.join(gameId);

        // Set move timeout for the first player
        const firstPlayer = game.players.find(p => p.id === game.currentTurn);
        if (firstPlayer) {
          game.setMoveTimeout(firstPlayer.id, (randomMove) => {
            const gameState = game.getState();
            io.to(gameId).emit('moveMade', {
              board: gameState.board,
              move: randomMove,
              nextPlayer: gameState.status === 'playing'
                ? game.players.find(p => p.id === game.currentTurn)?.color
                : null,
              nextTurn: game.currentTurn,
              gameStatus: gameState.status,
              winner: gameState.winner,
              lastMove: gameState.lastMove
            });
          });
        }

        io.to(gameId).emit('gameStart', {
          gameId: game.id,
          players: game.players,
          currentTurn: game.currentTurn,
          board: game.board,
          status: game.status
        });
      }
    } catch (err) {
      socket.emit('error', 'Failed to join game');
    }
  });

  socket.on('makeMove', ({ gameId, move }) => {
    try {
      const game = games.get(gameId);
      if (!game) return;

      if (!move || typeof move.row !== 'number' || typeof move.col !== 'number') {
        socket.emit('error', 'Invalid move');
        return;
      }

      if (game.makeMove(socket.id, move.row, move.col)) {
        const gameState = game.getState();

        // Set move timeout for next player
        if (gameState.status === 'playing') {
          game.setMoveTimeout(game.currentTurn, (randomMove) => {
            const updatedState = game.getState();
            io.to(gameId).emit('moveMade', {
              board: updatedState.board,
              move: randomMove,
              nextPlayer: updatedState.status === 'playing'
                ? game.players.find(p => p.id === game.currentTurn)?.color
                : null,
              nextTurn: game.currentTurn,
              gameStatus: updatedState.status,
              winner: updatedState.winner,
              lastMove: updatedState.lastMove
            });
          });
        }

        io.to(gameId).emit('moveMade', {
          board: gameState.board,
          move: move,
          nextPlayer: gameState.status === 'playing'
            ? game.players.find(p => p.id === game.currentTurn)?.color
            : null,
          nextTurn: game.currentTurn,
          gameStatus: gameState.status,
          winner: gameState.winner,
          lastMove: gameState.lastMove
        });
      }
    } catch (err) {
      socket.emit('error', 'Failed to make move');
    }
  });

  socket.on('mouseMove', ({ gameId, position }) => {
    socket.to(gameId).emit('opponentMouseMove', position);
  });

  socket.on('resetGame', ({ gameId }) => {
    try {
      const game = games.get(gameId);
      if (game && game.players.some(p => p.id === socket.id)) {
        game.reset();
        io.to(gameId).emit('gameReset', game.getState());
      }
    } catch (err) {
      socket.emit('error', 'Failed to reset game');
    }
  });

  socket.on('disconnect', () => {
    for (const [gameId, game] of games.entries()) {
      if (game.players.some(p => p.id === socket.id)) {
        game.clearTimeouts();
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

server.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});