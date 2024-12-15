// src/contexts/GameContext.jsx
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { io } from 'socket.io-client';

const GameContext = createContext();

const initialState = {
  // Game board state
  board: Array(6).fill().map(() => Array(7).fill(null)),
  currentPlayer: 'red',
  gameStatus: 'waiting',
  winner: null,
  lastMove: null,
  
  // Player information
  playerName: '',
  playerColor: null,
  players: [],
  isMyTurn: false,
  
  // Connection state
  socket: null,
  gameId: null,
  connected: false,
  
  // UI state
  opponentMousePosition: null,
  message: null,
  error: null,
  
  // Timer state
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
        playerColor: 'red', // Creator is always red
      };

    case ACTIONS.GAME_START:
      const myPlayer = action.payload.players.find(p => p.id === state.socket?.id);
      const isFirstTurn = action.payload.currentTurn === state.socket?.id;
      return {
        ...state,
        gameStatus: 'playing',
        players: action.payload.players,
        currentPlayer: 'red', // Game always starts with red
        playerColor: myPlayer?.color,
        isMyTurn: isFirstTurn,
        message: isFirstTurn ? 'Your turn!' : "Opponent's turn",
        timeLeft: 30,
        error: null,
        board: Array(6).fill().map(() => Array(7).fill(null)),
        gameId: action.payload.gameId,
      };

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
        winner: action.payload,
        message: action.payload === state.socket?.id ? 'You won!' : 'Opponent won!',
        isMyTurn: false,
      };

    case ACTIONS.GAME_DRAW:
      return {
        ...state,
        gameStatus: 'finished',
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

  // Socket connection
  useEffect(() => {
    console.log('Initializing socket connection...');
    const socket = io('http://localhost:3001', {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('Connected to server:', socket.id);
      dispatch({ type: ACTIONS.INITIALIZE_SOCKET, payload: socket });
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      dispatch({
        type: ACTIONS.SET_ERROR,
        payload: 'Unable to connect to game server. Please try again.',
      });
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
      dispatch({ type: ACTIONS.SET_ERROR, payload: error });
    });

    socket.on('gameCreated', (gameState) => {
      console.log('Game created:', gameState);
      dispatch({ type: ACTIONS.GAME_CREATED, payload: gameState });
    });

    socket.on('gameStart', (gameState) => {
      console.log('Game started:', gameState);
      dispatch({ type: ACTIONS.GAME_START, payload: gameState });
    });

    socket.on('moveMade', (moveData) => {
      console.log('Move made:', moveData);
      if (moveData.gameStatus === 'finished') {
        if (moveData.winner) {
          dispatch({ type: ACTIONS.GAME_WIN, payload: moveData.winner });
        } else {
          dispatch({ type: ACTIONS.GAME_DRAW });
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

  // Timer management
  useEffect(() => {
    let timerInterval;
    if (state.gameStatus === 'playing' && state.isMyTurn && state.timeLeft > 0) {
      timerInterval = setInterval(() => {
        dispatch({ type: ACTIONS.UPDATE_TIMER, payload: state.timeLeft - 1 });
      }, 1000);
    }

    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [state.gameStatus, state.isMyTurn, state.timeLeft]);

  // Auto random move when timer expires
  useEffect(() => {
    if (state.timeLeft === 0 && state.isMyTurn && state.gameStatus === 'playing') {
      makeRandomMove();
    }
  }, [state.timeLeft]);

  // Game Actions
  const createGame = (playerName) => {
    if (!state.socket) {
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
    console.log('Creating game with ID:', gameId);
    dispatch({ type: ACTIONS.SET_PLAYER_NAME, payload: playerName });
    state.socket.emit('createGame', { gameId, playerName });
  };

  const joinGame = (gameId, playerName) => {
    if (!state.socket) {
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

    console.log('Joining game:', gameId);
    dispatch({ type: ACTIONS.SET_PLAYER_NAME, payload: playerName });
    state.socket.emit('joinGame', { gameId: gameId.toUpperCase(), playerName });
  };

  const makeMove = (col) => {
    if (!state.isMyTurn || state.gameStatus !== 'playing') {
      console.log('Not your turn or game not playing', { 
        isMyTurn: state.isMyTurn, 
        gameStatus: state.gameStatus 
      });
      return;
    }

    const row = state.board.findLastIndex(row => !row[col]);
    if (row === -1) return; // Column is full

    console.log('Making move:', { row, col, color: state.playerColor });
    state.socket.emit('makeMove', {
      gameId: state.gameId,
      move: { 
        row, 
        col,
        player: state.playerColor,
        currentTurn: state.socket.id
      }
    });
  };

  const makeRandomMove = () => {
    if (!state.isMyTurn || state.gameStatus !== 'playing') return;

    const validMoves = [];
    for (let col = 0; col < 7; col++) {
      const row = state.board.findLastIndex(row => !row[col]);
      if (row !== -1) validMoves.push({ row, col });
    }

    if (validMoves.length > 0) {
      const { row, col } = validMoves[Math.floor(Math.random() * validMoves.length)];
      state.socket.emit('makeMove', {
        gameId: state.gameId,
        move: { 
          row, 
          col,
          player: state.playerColor,
          currentTurn: state.socket.id
        }
      });
    }
  };

  const emitMouseMove = (position) => {
    if (state.gameStatus === 'playing' && state.gameId && state.socket) {
      state.socket.emit('mouseMove', {
        gameId: state.gameId,
        position
      });
    }
  };

  const resetGame = () => {
    if (state.gameId && state.socket) {
      state.socket.emit('resetGame', { gameId: state.gameId });
    }
    dispatch({ type: ACTIONS.RESET_GAME });
  };

  const clearError = () => {
    dispatch({ type: ACTIONS.CLEAR_ERROR });
  };

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