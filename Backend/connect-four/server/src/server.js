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

function buildMovePayload(game, move) {
  const state = game.getState();
  return {
    board: state.board,
    move: move,
    nextPlayer: state.status === 'playing'
      ? game.players.find(p => p.id === game.currentTurn)?.color
      : null,
    nextTurn: game.currentTurn,
    gameStatus: state.status,
    winner: state.winner,
    winningCells: state.winningCells,
    lastMove: state.lastMove,
    turnDeadline: state.turnDeadline,
  };
}

function startTurnTimer(io, gameId, game, playerId) {
  game.setMoveTimeout(playerId, (randomMove) => {
    const payload = buildMovePayload(game, randomMove);
    io.to(gameId).emit('moveMade', payload);

    // If the auto-move did not end the game, start a timer for the next player.
    if (payload.gameStatus === 'playing') {
      startTurnTimer(io, gameId, game, game.currentTurn);
    }
  });
}

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

        // Start move timeout for the first player and stamp the deadline.
        if (game.currentTurn) {
          startTurnTimer(io, gameId, game, game.currentTurn);
        }

        io.to(gameId).emit('gameStart', {
          gameId: game.id,
          players: game.players,
          currentTurn: game.currentTurn,
          board: game.board,
          status: game.status,
          turnDeadline: game.turnDeadline,
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
        const payload = buildMovePayload(game, move);

        // Set move timeout for next player (only if the game continues)
        if (payload.gameStatus === 'playing') {
          startTurnTimer(io, gameId, game, game.currentTurn);
          // startTurnTimer mutated turnDeadline; re-read it for the broadcast.
          payload.turnDeadline = game.turnDeadline;
        }

        io.to(gameId).emit('moveMade', payload);
      }
    } catch (err) {
      socket.emit('error', 'Failed to make move');
    }
  });

  socket.on('mouseMove', ({ gameId, position }) => {
    socket.to(gameId).emit('opponentMouseMove', position);
  });

  socket.on('requestPlayAgain', ({ gameId }) => {
    try {
      const game = games.get(gameId);
      if (!game) return;
      if (game.status !== 'finished') return;
      if (game.players.length < 2) {
        socket.emit('playAgainUnavailable', { reason: 'opponent-left' });
        return;
      }

      const requester = game.players.find(p => p.id === socket.id);
      if (!requester) return;

      game.playAgainRequests.add(socket.id);
      const opponent = game.players.find(p => p.id !== socket.id);

      // If both players have requested, restart the match.
      if (opponent && game.playAgainRequests.has(opponent.id)) {
        game.reset();
        startTurnTimer(io, gameId, game, game.currentTurn);
        io.to(gameId).emit('gameReset', {
          ...game.getState(),
          gameId: game.id,
          turnDeadline: game.turnDeadline,
        });
        return;
      }

      // Otherwise prompt the opponent and let the requester know we are waiting.
      socket.emit('playAgainPending');
      if (opponent) {
        io.to(opponent.id).emit('playAgainRequested', {
          fromName: requester.name,
        });
      }
    } catch (err) {
      socket.emit('error', 'Failed to request rematch');
    }
  });

  socket.on('declinePlayAgain', ({ gameId }) => {
    try {
      const game = games.get(gameId);
      if (!game) return;
      const opponent = game.players.find(p => p.id !== socket.id);
      game.playAgainRequests.clear();
      if (opponent) {
        io.to(opponent.id).emit('playAgainDeclined');
      }
    } catch (err) {
      // best-effort notification
    }
  });

  socket.on('cancelPlayAgain', ({ gameId }) => {
    try {
      const game = games.get(gameId);
      if (!game) return;
      game.playAgainRequests.delete(socket.id);
      const opponent = game.players.find(p => p.id !== socket.id);
      if (opponent) {
        io.to(opponent.id).emit('playAgainCancelled');
      }
    } catch (err) {
      // best-effort notification
    }
  });

  socket.on('leaveGame', ({ gameId }) => {
    try {
      const game = games.get(gameId);
      if (!game) return;
      const wasMember = game.players.some(p => p.id === socket.id);
      if (!wasMember) return;

      game.removePlayer(socket.id);
      socket.leave(gameId);

      if (game.players.length === 0) {
        game.clearTimeouts();
        games.delete(gameId);
      } else {
        io.to(gameId).emit('playerDisconnected', game.getState());
      }
    } catch (err) {
      // best-effort cleanup
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
