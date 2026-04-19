import React, { createContext, useContext, useReducer, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const GameContext = createContext();

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

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
  connected: false,

  opponentMousePosition: null,
  message: null,
  error: null,

  timeLeft: 30,
};

const ACTIONS = {
  INITIALIZE_SOCKET: 'INITIALIZE_SOCKET',
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
  UPDATE_TIMER: 'UPDATE_TIMER',
  RESET_GAME: 'RESET_GAME',
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
        timeLeft: 30,
        error: null,
        board: Array(6).fill().map(() => Array(7).fill(null)),
        gameId: action.payload.gameId,
        winningCells: null,
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
        timeLeft: 30,
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
      };

    case ACTIONS.GAME_DRAW:
      return {
        ...state,
        gameStatus: 'finished',
        board: action.payload?.board || state.board,
        lastMove: action.payload?.lastMove || state.lastMove,
        message: 'Game ended in a draw!',
        isMyTurn: false,
      };

    case ACTIONS.OPPONENT_DISCONNECTED:
      return {
        ...state,
        gameStatus: 'waiting',
        message: 'Opponent disconnected. Waiting for new opponent...',
        error: 'Opponent disconnected',
        players: state.players.filter(p => p.id === state.socket?.id),
      };

    case ACTIONS.UPDATE_MOUSE_POSITION:
      return {
        ...state,
        opponentMousePosition: action.payload,
      };

    case ACTIONS.UPDATE_TIMER:
      return {
        ...state,
        timeLeft: action.payload,
      };

    case ACTIONS.RESET_GAME:
      return {
        ...initialState,
        socket: state.socket,
        connected: state.connected,
        playerName: state.playerName,
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

  const makeRandomMove = useCallback(() => {
    const s = stateRef.current;
    if (!s.isMyTurn || s.gameStatus !== 'playing') return;

    const validMoves = [];
    for (let col = 0; col < 7; col++) {
      const row = s.board.findLastIndex(r => !r[col]);
      if (row !== -1) validMoves.push({ row, col });
    }

    if (validMoves.length > 0) {
      const { row, col } = validMoves[Math.floor(Math.random() * validMoves.length)];
      s.socket.emit('makeMove', {
        gameId: s.gameId,
        move: {
          row,
          col,
          player: s.playerColor,
          currentTurn: s.socket.id
        }
      });
    }
  }, []);

  const emitMouseMove = useCallback((position) => {
    const s = stateRef.current;
    if (s.gameStatus === 'playing' && s.gameId && s.socket) {
      s.socket.emit('mouseMove', {
        gameId: s.gameId,
        position
      });
    }
  }, []);

  const resetGame = useCallback(() => {
    const s = stateRef.current;
    if (s.gameId && s.socket) {
      s.socket.emit('resetGame', { gameId: s.gameId });
    }
    dispatch({ type: ACTIONS.RESET_GAME });
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
      resetGame,
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
