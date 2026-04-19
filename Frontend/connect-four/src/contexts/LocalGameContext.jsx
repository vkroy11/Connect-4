import React, { createContext, useContext, useReducer, useCallback, useRef, useEffect } from 'react';
import { checkWin, getLowestRow, isBoardFull, getValidMoves } from '../engine/gameLogic';
import { getBestMove } from '../engine/aiEngine';

const LocalGameContext = createContext();

const initialState = {
  board: Array(6).fill().map(() => Array(7).fill(null)),
  currentPlayer: 'red',
  gameStatus: 'playing',
  winner: null,
  lastMove: null,
  winningCells: null,

  playerName: '',
  playerColor: 'red',
  players: [],
  isMyTurn: true,

  // Not used in local mode but kept for compatibility
  socket: null,
  gameId: 'LOCAL',
  connected: true,

  opponentMousePosition: null,
  message: 'Your turn!',
  error: null,

  timeLeft: 30,
  difficulty: 'medium',
  isAiThinking: false,
};

const ACTIONS = {
  MAKE_MOVE: 'MAKE_MOVE',
  AI_MOVE: 'AI_MOVE',
  GAME_WIN: 'GAME_WIN',
  GAME_DRAW: 'GAME_DRAW',
  RESET_GAME: 'RESET_GAME',
  SET_AI_THINKING: 'SET_AI_THINKING',
  UPDATE_TIMER: 'UPDATE_TIMER',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

function localGameReducer(state, action) {
  switch (action.type) {
    case ACTIONS.MAKE_MOVE: {
      const { row, col, color, winResult, isDraw } = action.payload;
      const newBoard = state.board.map(r => [...r]);
      newBoard[row][col] = color;

      if (winResult) {
        return {
          ...state,
          board: newBoard,
          lastMove: { row, col, color },
          gameStatus: 'finished',
          winner: color === state.playerColor ? 'player' : 'computer',
          winningCells: winResult.cells,
          message: color === state.playerColor ? 'You won!' : 'Computer won!',
          isMyTurn: false,
          isAiThinking: false,
        };
      }

      if (isDraw) {
        return {
          ...state,
          board: newBoard,
          lastMove: { row, col, color },
          gameStatus: 'finished',
          message: 'Game ended in a draw!',
          isMyTurn: false,
          isAiThinking: false,
        };
      }

      const nextPlayer = color === 'red' ? 'yellow' : 'red';
      const isPlayerNext = nextPlayer === state.playerColor;

      return {
        ...state,
        board: newBoard,
        currentPlayer: nextPlayer,
        lastMove: { row, col, color },
        isMyTurn: isPlayerNext,
        isAiThinking: false,
        message: isPlayerNext ? 'Your turn!' : 'Computer is thinking...',
        timeLeft: isPlayerNext ? 30 : state.timeLeft,
      };
    }

    case ACTIONS.SET_AI_THINKING:
      return { ...state, isAiThinking: action.payload };

    case ACTIONS.UPDATE_TIMER:
      return { ...state, timeLeft: action.payload };

    case ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, message: action.payload };

    case ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };

    case ACTIONS.RESET_GAME:
      return {
        ...initialState,
        playerName: state.playerName,
        difficulty: state.difficulty,
        players: state.players,
      };

    default:
      return state;
  }
}

export function LocalGameProvider({ children, playerName, difficulty }) {
  const aiColor = 'yellow';
  const playerColor = 'red';

  const initState = {
    ...initialState,
    playerName,
    difficulty,
    playerColor,
    players: [
      { id: 'player', name: playerName || 'You', color: playerColor },
      { id: 'computer', name: `Computer (${difficulty})`, color: aiColor },
    ],
  };

  const [state, dispatch] = useReducer(localGameReducer, initState);
  const stateRef = useRef(state);
  stateRef.current = state;

  // AI makes its move when it's the computer's turn
  useEffect(() => {
    const s = stateRef.current;
    if (s.gameStatus !== 'playing' || s.isMyTurn || s.isAiThinking) return;

    dispatch({ type: ACTIONS.SET_AI_THINKING, payload: true });

    const timer = setTimeout(() => {
      const currentState = stateRef.current;
      if (currentState.gameStatus !== 'playing' || currentState.isMyTurn) return;

      const move = getBestMove(currentState.board, aiColor, currentState.difficulty);
      if (!move) return;

      const newBoard = currentState.board.map(r => [...r]);
      newBoard[move.row][move.col] = aiColor;

      const winResult = checkWin(newBoard, { row: move.row, col: move.col, color: aiColor });
      const isDraw = !winResult && isBoardFull(newBoard);

      dispatch({
        type: ACTIONS.MAKE_MOVE,
        payload: { row: move.row, col: move.col, color: aiColor, winResult, isDraw }
      });
    }, 2000 + Math.random() * 1000);

    return () => clearTimeout(timer);
  }, [state.isMyTurn, state.gameStatus]);

  const makeMove = useCallback((col) => {
    const s = stateRef.current;
    if (!s.isMyTurn || s.gameStatus !== 'playing' || s.isAiThinking) return;

    const row = getLowestRow(s.board, col);
    if (row === -1) return;

    const newBoard = s.board.map(r => [...r]);
    newBoard[row][col] = playerColor;

    const winResult = checkWin(newBoard, { row, col, color: playerColor });
    const isDraw = !winResult && isBoardFull(newBoard);

    dispatch({
      type: ACTIONS.MAKE_MOVE,
      payload: { row, col, color: playerColor, winResult, isDraw }
    });
  }, []);

  const makeRandomMove = useCallback(() => {
    const s = stateRef.current;
    if (!s.isMyTurn || s.gameStatus !== 'playing') return;
    const moves = getValidMoves(s.board);
    if (moves.length > 0) {
      makeMove(moves[Math.floor(Math.random() * moves.length)].col);
    }
  }, [makeMove]);

  const resetGame = useCallback(() => {
    dispatch({ type: ACTIONS.RESET_GAME });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: ACTIONS.CLEAR_ERROR });
  }, []);

  const emitMouseMove = useCallback(() => {}, []);

  const value = {
    state,
    dispatch,
    actions: {
      makeMove,
      makeRandomMove,
      emitMouseMove,
      resetGame,
      clearError,
    },
  };

  return <LocalGameContext.Provider value={value}>{children}</LocalGameContext.Provider>;
}

export const useLocalGame = () => {
  const context = useContext(LocalGameContext);
  if (!context) {
    throw new Error('useLocalGame must be used within a LocalGameProvider');
  }
  return context;
};
