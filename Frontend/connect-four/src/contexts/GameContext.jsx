import React, { createContext, useContext, useReducer, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const GameContext = createContext();

// In production, use relative URL so nginx proxies WebSocket to backend.
// In dev, connect directly to the backend server.
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (
  import.meta.env.PROD ? '' : 'http://localhost:3001'
);

const initialState = {
  board: Array(6).fill().map(() => Array(7).fill(null)),
  currentPlayer: 'red',
  gameStatus: 'waiting',
  winner: null,
  lastMove: null,
  winningCells: null,

  playerName: '',
  playerColor: null,
  players: [],
  isMyTurn: false,

  socket: null,
  gameId: null,
  connected: true,

  opponentMousePosition: null,
  message: null,
  error: null,

  // Server-authoritative deadline (ms epoch) for the active player's turn.
  turnDeadline: null,

  // Tracks whether the second player is still in the room. False after the
  // opponent disconnects so the UI can disable rematch controls.
  opponentConnected: true,

  // Rematch negotiation: 'idle' | 'pending' | 'requested' | 'declined'
  playAgainState: 'idle',
  playAgainRequesterName: null,
};

const ACTIONS = {
  INITIALIZE_SOCKET: 'INITIALIZE_SOCKET',
  SOCKET_DISCONNECTED: 'SOCKET_DISCONNECTED',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_PLAYER_NAME: 'SET_PLAYER_NAME',
  GAME_CREATED: 'GAME_CREATED',
  GAME_START: 'GAME_START',
  UPDATE_GAME: 'UPDATE_GAME',
  GAME_WIN: 'GAME_WIN',
  GAME_DRAW: 'GAME_DRAW',
  OPPONENT_DISCONNECTED: 'OPPONENT_DISCONNECTED',
  UPDATE_MOUSE_POSITION: 'UPDATE_MOUSE_POSITION',
  RESET_GAME: 'RESET_GAME',
  GAME_RESET_REMOTE: 'GAME_RESET_REMOTE',
  PLAY_AGAIN_PENDING: 'PLAY_AGAIN_PENDING',
  PLAY_AGAIN_REQUESTED: 'PLAY_AGAIN_REQUESTED',
  PLAY_AGAIN_DECLINED: 'PLAY_AGAIN_DECLINED',
  PLAY_AGAIN_CANCELLED: 'PLAY_AGAIN_CANCELLED',
  PLAY_AGAIN_RESET_LOCAL: 'PLAY_AGAIN_RESET_LOCAL',
};

function gameReducer(state, action) {
  switch (action.type) {
    case ACTIONS.INITIALIZE_SOCKET:
      return {
        ...state,
        socket: action.payload,
        connected: true,
        error: null,
      };

    case ACTIONS.SOCKET_DISCONNECTED:
      return {
        ...state,
        connected: false,
      };

    case ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        message: action.payload,
      };

    case ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
        message: null,
      };

    case ACTIONS.SET_PLAYER_NAME:
      return {
        ...state,
        playerName: action.payload,
      };

    case ACTIONS.GAME_CREATED:
      return {
        ...state,
        gameId: action.payload.id,
        gameStatus: 'waiting',
        message: 'Waiting for opponent...',
        error: null,
        players: [{ ...action.payload.player }],
        playerColor: 'red',
        opponentConnected: true,
        playAgainState: 'idle',
        playAgainRequesterName: null,
      };

    case ACTIONS.GAME_START: {
      const myPlayer = action.payload.players.find(p => p.id === state.socket?.id);
      const isFirstTurn = action.payload.currentTurn === state.socket?.id;
      return {
        ...state,
        gameStatus: 'playing',
        players: action.payload.players,
        currentPlayer: 'red',
        playerColor: myPlayer?.color,
        isMyTurn: isFirstTurn,
        message: isFirstTurn ? 'Your turn!' : "Opponent's turn",
        turnDeadline: action.payload.turnDeadline || null,
        error: null,
        board: Array(6).fill().map(() => Array(7).fill(null)),
        gameId: action.payload.gameId,
        winningCells: null,
        winner: null,
        lastMove: null,
        opponentConnected: true,
        playAgainState: 'idle',
        playAgainRequesterName: null,
      };
    }

    case ACTIONS.UPDATE_GAME:
      return {
        ...state,
        board: action.payload.board,
        currentPlayer: action.payload.nextPlayer,
        isMyTurn: action.payload.nextTurn === state.socket?.id,
        lastMove: action.payload.lastMove,
        message: action.payload.nextTurn === state.socket?.id ? 'Your turn!' : "Opponent's turn",
        turnDeadline: action.payload.turnDeadline || null,
      };

    case ACTIONS.GAME_WIN:
      return {
        ...state,
        gameStatus: 'finished',
        winner: action.payload.winner,
        winningCells: action.payload.winningCells || null,
        board: action.payload.board || state.board,
        lastMove: action.payload.lastMove || state.lastMove,
        message: action.payload.winner === state.socket?.id ? 'You won!' : 'Opponent won!',
        isMyTurn: false,
        turnDeadline: null,
      };

    case ACTIONS.GAME_DRAW:
      return {
        ...state,
        gameStatus: 'finished',
        board: action.payload?.board || state.board,
        lastMove: action.payload?.lastMove || state.lastMove,
        message: 'Game ended in a draw!',
        isMyTurn: false,
        turnDeadline: null,
      };

    case ACTIONS.OPPONENT_DISCONNECTED: {
      // If we are mid-game we drop back to the lobby state. If the game was
      // already finished, leave the modal open and just disable rematch.
      const wasFinished = state.gameStatus === 'finished';
      if (wasFinished) {
        return {
          ...state,
          opponentConnected: false,
          playAgainState: 'idle',
          playAgainRequesterName: null,
          message: 'Opponent left the room.',
        };
      }
      return {
        ...state,
        gameStatus: 'waiting',
        message: 'Opponent disconnected. Waiting for new opponent...',
        error: 'Opponent disconnected',
        players: state.players.filter(p => p.id === state.socket?.id),
        turnDeadline: null,
        isMyTurn: false,
        opponentConnected: false,
        playAgainState: 'idle',
        playAgainRequesterName: null,
      };
    }

    case ACTIONS.UPDATE_MOUSE_POSITION:
      return {
        ...state,
        opponentMousePosition: action.payload,
      };

    case ACTIONS.RESET_GAME:
      return {
        ...initialState,
        socket: state.socket,
        connected: state.connected,
        playerName: state.playerName,
      };

    case ACTIONS.GAME_RESET_REMOTE: {
      const myPlayer = action.payload.players?.find(p => p.id === state.socket?.id);
      const isFirstTurn = action.payload.currentTurn === state.socket?.id;
      return {
        ...state,
        board: action.payload.board,
        gameStatus: 'playing',
        winner: null,
        winningCells: null,
        lastMove: null,
        currentPlayer: 'red',
        players: action.payload.players || state.players,
        playerColor: myPlayer?.color || state.playerColor,
        isMyTurn: isFirstTurn,
        turnDeadline: action.payload.turnDeadline || null,
        message: isFirstTurn ? 'Your turn!' : "Opponent's turn",
        opponentConnected: true,
        playAgainState: 'idle',
        playAgainRequesterName: null,
        error: null,
      };
    }

    case ACTIONS.PLAY_AGAIN_PENDING:
      return {
        ...state,
        playAgainState: 'pending',
        playAgainRequesterName: null,
      };

    case ACTIONS.PLAY_AGAIN_REQUESTED:
      return {
        ...state,
        playAgainState: 'requested',
        playAgainRequesterName: action.payload?.fromName || 'Opponent',
      };

    case ACTIONS.PLAY_AGAIN_DECLINED:
      return {
        ...state,
        playAgainState: 'declined',
        playAgainRequesterName: null,
      };

    case ACTIONS.PLAY_AGAIN_CANCELLED:
      return {
        ...state,
        playAgainState: 'idle',
        playAgainRequesterName: null,
      };

    case ACTIONS.PLAY_AGAIN_RESET_LOCAL:
      return {
        ...state,
        playAgainState: 'idle',
        playAgainRequesterName: null,
      };

    default:
      return state;
  }
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Socket connection
  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      dispatch({ type: ACTIONS.INITIALIZE_SOCKET, payload: socket });
    });

    socket.on('disconnect', () => {
      dispatch({ type: ACTIONS.SOCKET_DISCONNECTED });
    });

    socket.on('connect_error', () => {
      dispatch({
        type: ACTIONS.SET_ERROR,
        payload: 'Unable to connect to game server. Please try again.',
      });
    });

    socket.on('error', (error) => {
      dispatch({ type: ACTIONS.SET_ERROR, payload: error });
    });

    socket.on('gameCreated', (gameState) => {
      dispatch({ type: ACTIONS.GAME_CREATED, payload: gameState });
    });

    socket.on('gameStart', (gameState) => {
      dispatch({ type: ACTIONS.GAME_START, payload: gameState });
    });

    socket.on('moveMade', (moveData) => {
      if (moveData.gameStatus === 'finished') {
        if (moveData.winner) {
          dispatch({ type: ACTIONS.GAME_WIN, payload: moveData });
        } else {
          dispatch({ type: ACTIONS.GAME_DRAW, payload: moveData });
        }
      } else {
        dispatch({ type: ACTIONS.UPDATE_GAME, payload: moveData });
      }
    });

    socket.on('opponentMouseMove', (position) => {
      dispatch({ type: ACTIONS.UPDATE_MOUSE_POSITION, payload: position });
    });

    socket.on('playerDisconnected', () => {
      dispatch({ type: ACTIONS.OPPONENT_DISCONNECTED });
    });

    socket.on('gameReset', (gameState) => {
      dispatch({ type: ACTIONS.GAME_RESET_REMOTE, payload: gameState });
    });

    socket.on('playAgainPending', () => {
      dispatch({ type: ACTIONS.PLAY_AGAIN_PENDING });
    });

    socket.on('playAgainRequested', (payload) => {
      dispatch({ type: ACTIONS.PLAY_AGAIN_REQUESTED, payload });
    });

    socket.on('playAgainDeclined', () => {
      dispatch({ type: ACTIONS.PLAY_AGAIN_DECLINED });
    });

    socket.on('playAgainCancelled', () => {
      dispatch({ type: ACTIONS.PLAY_AGAIN_CANCELLED });
    });

    socket.on('playAgainUnavailable', () => {
      dispatch({ type: ACTIONS.PLAY_AGAIN_DECLINED });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Game Actions - use stateRef to avoid stale closures
  const createGame = useCallback((playerName) => {
    const s = stateRef.current;
    if (!s.socket) {
      dispatch({
        type: ACTIONS.SET_ERROR,
        payload: 'No connection to game server. Please refresh the page.',
      });
      return;
    }

    if (!playerName.trim()) {
      dispatch({
        type: ACTIONS.SET_ERROR,
        payload: 'Please enter your name first!',
      });
      return;
    }

    const gameId = Math.random().toString(36).substring(2, 8).toUpperCase();
    dispatch({ type: ACTIONS.SET_PLAYER_NAME, payload: playerName });
    s.socket.emit('createGame', { gameId, playerName });
  }, []);

  const joinGame = useCallback((gameId, playerName) => {
    const s = stateRef.current;
    if (!s.socket) {
      dispatch({
        type: ACTIONS.SET_ERROR,
        payload: 'No connection to game server. Please refresh the page.',
      });
      return;
    }

    if (!playerName.trim() || !gameId.trim()) {
      dispatch({
        type: ACTIONS.SET_ERROR,
        payload: 'Please enter both your name and game ID!',
      });
      return;
    }

    dispatch({ type: ACTIONS.SET_PLAYER_NAME, payload: playerName });
    s.socket.emit('joinGame', { gameId: gameId.toUpperCase(), playerName });
  }, []);

  const makeMove = useCallback((col) => {
    const s = stateRef.current;
    if (!s.isMyTurn || s.gameStatus !== 'playing') return;

    const row = s.board.findLastIndex(r => !r[col]);
    if (row === -1) return;

    s.socket.emit('makeMove', {
      gameId: s.gameId,
      move: {
        row,
        col,
        player: s.playerColor,
        currentTurn: s.socket.id
      }
    });
  }, []);

  // Server is authoritative for the auto-move when a turn expires, so the
  // client timer no longer needs to fire its own random move. Kept as a no-op
  // for backwards compatibility with the Timer onTimeUp prop.
  const makeRandomMove = useCallback(() => {}, []);

  const emitMouseMove = useCallback((position) => {
    const s = stateRef.current;
    if (s.gameStatus === 'playing' && s.gameId && s.socket) {
      s.socket.emit('mouseMove', {
        gameId: s.gameId,
        position
      });
    }
  }, []);

  const leaveGame = useCallback(() => {
    const s = stateRef.current;
    if (s.gameId && s.socket) {
      s.socket.emit('leaveGame', { gameId: s.gameId });
    }
    dispatch({ type: ACTIONS.RESET_GAME });
  }, []);

  // Multiplayer rematch: requires both players to opt in. Server confirms.
  const requestPlayAgain = useCallback(() => {
    const s = stateRef.current;
    if (!s.socket || !s.gameId) return;
    if (!s.opponentConnected) return;
    s.socket.emit('requestPlayAgain', { gameId: s.gameId });
    dispatch({ type: ACTIONS.PLAY_AGAIN_PENDING });
  }, []);

  const declinePlayAgain = useCallback(() => {
    const s = stateRef.current;
    if (!s.socket || !s.gameId) return;
    s.socket.emit('declinePlayAgain', { gameId: s.gameId });
    dispatch({ type: ACTIONS.PLAY_AGAIN_RESET_LOCAL });
  }, []);

  const dismissPlayAgainNotice = useCallback(() => {
    dispatch({ type: ACTIONS.PLAY_AGAIN_RESET_LOCAL });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: ACTIONS.CLEAR_ERROR });
  }, []);

  const value = {
    state,
    dispatch,
    actions: {
      createGame,
      joinGame,
      makeMove,
      makeRandomMove,
      emitMouseMove,
      leaveGame,
      // resetGame is the legacy "send me back to the lobby" action — kept as
      // an alias for leaveGame so older callers keep working.
      resetGame: leaveGame,
      requestPlayAgain,
      declinePlayAgain,
      dismissPlayAgainNotice,
      clearError,
    },
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
