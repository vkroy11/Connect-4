import React, { useCallback, useRef, useEffect, useState } from 'react';
import { useGame } from '../contexts/GameContext';
import classNames from 'classnames';
import Timer from './Timer';
import GameOverModal from './GameOverModal';
import Confetti from './Confetti';
import { playDropSound, playWinSound, playLoseSound, playDrawSound } from '../utils/sounds';

// Time the player gets to enjoy the winning highlight + confetti before the
// modal slides in.
const WIN_REVEAL_DELAY_MS = 3500;

const GameBoard = () => {
  const { state, actions } = useGame();
  const boardRef = useRef(null);
  const lastMouseEmit = useRef(0);
  const [hoveredCol, setHoveredCol] = useState(null);
  const prevGameStatus = useRef(state.gameStatus);
  const prevLastMove = useRef(state.lastMove);

  // Modal is gated behind a short delay so the user can actually see why the
  // game ended (winning four highlighted, confetti firing).
  const [showEndModal, setShowEndModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Sound effects
  useEffect(() => {
    if (state.lastMove && state.lastMove !== prevLastMove.current) {
      playDropSound();
    }
    prevLastMove.current = state.lastMove;
  }, [state.lastMove]);

  useEffect(() => {
    if (prevGameStatus.current === 'playing' && state.gameStatus === 'finished') {
      if (state.winner === state.socket?.id) {
        playWinSound();
      } else if (state.winner) {
        playLoseSound();
      } else {
        playDrawSound();
      }
    }
    prevGameStatus.current = state.gameStatus;
  }, [state.gameStatus, state.winner, state.socket]);

  // Win reveal sequence: highlight + confetti first, modal afterwards.
  useEffect(() => {
    if (state.gameStatus !== 'finished') {
      setShowEndModal(false);
      setShowConfetti(false);
      return;
    }

    // Confetti is celebratory: only fire it for the winner so the losing
    // player isn't taunted, but both players see the highlighted four.
    const iWon = !!state.winner && state.winner === state.socket?.id;
    if (iWon) setShowConfetti(true);

    const t = setTimeout(() => {
      setShowEndModal(true);
      // Confetti naturally fades; clear after animation completes.
      setTimeout(() => setShowConfetti(false), 2000);
    }, WIN_REVEAL_DELAY_MS);

    return () => clearTimeout(t);
  }, [state.gameStatus, state.winner, state.socket]);

  // If we receive a rematch request from the opponent, show the modal
  // immediately so the user can respond.
  useEffect(() => {
    if (state.playAgainState === 'requested' || state.playAgainState === 'pending' || state.playAgainState === 'declined') {
      setShowEndModal(true);
    }
  }, [state.playAgainState]);

  const handleColumnClick = (colIndex) => {
    if (!state.isMyTurn || state.gameStatus !== 'playing') return;
    actions.makeMove(colIndex);
  };

  const handleMouseMove = useCallback((e) => {
    if (!boardRef.current || state.gameStatus !== 'playing') return;

    const now = Date.now();
    if (now - lastMouseEmit.current < 50) return;
    lastMouseEmit.current = now;

    const rect = boardRef.current.getBoundingClientRect();
    const position = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };

    actions.emitMouseMove(position);
  }, [state.gameStatus, actions]);

  useEffect(() => {
    const board = boardRef.current;
    if (board) {
      board.addEventListener('mousemove', handleMouseMove);
      return () => board.removeEventListener('mousemove', handleMouseMove);
    }
  }, [handleMouseMove]);

  // Find the preview row for the hovered column
  const getPreviewRow = (col) => {
    if (col === null) return -1;
    return state.board.findLastIndex(r => !r[col]);
  };

  const previewRow = getPreviewRow(hoveredCol);

  const isWinningCell = (row, col) => {
    if (!state.winningCells) return false;
    return state.winningCells.some(c => c.row === row && c.col === col);
  };

  // Derived: result + rematch availability for the modal.
  const result = state.winner === state.socket?.id ? 'win'
    : state.winner ? 'lose'
    : 'draw';
  const playAgainDisabled = !state.opponentConnected || !state.connected;
  const playAgainDisabledReason = !state.opponentConnected
    ? 'Opponent left the room — rematch unavailable.'
    : !state.connected
      ? 'Disconnected from server.'
      : null;

  return (
    <div className="flex flex-col items-center space-y-8 max-w-4xl mx-auto p-4">
      {/* Game Info */}
      <div className="w-full bg-white rounded-lg shadow-lg p-4">
        <div className="flex justify-between items-center">
          {/* Player 1 (Red) */}
          <div className={`flex items-center space-x-4 ${state.playerColor === 'red' ? 'font-bold' : ''}`}>
            <div className="w-8 h-8 rounded-full bg-red-500"></div>
            <div>
              <p className="text-lg">{state.players.find(p => p.color === 'red')?.name || 'Player 1'}</p>
              {state.currentPlayer === 'red' && state.gameStatus === 'playing' && (
                <Timer
                  deadline={state.turnDeadline}
                  isActive={state.currentPlayer === 'red'}
                />
              )}
            </div>
          </div>

          {/* Game Status */}
          <div className="text-center">
            <p className="text-lg font-bold">{state.message}</p>
            <p className="text-sm text-gray-600">Game ID: {state.gameId}</p>
          </div>

          {/* Player 2 (Yellow) */}
          <div className={`flex items-center space-x-4 ${state.playerColor === 'yellow' ? 'font-bold' : ''}`}>
            <div>
              <p className="text-lg text-right">
                {state.players.find(p => p.color === 'yellow')?.name || 'Player 2'}
              </p>
              {state.currentPlayer === 'yellow' && state.gameStatus === 'playing' && (
                <Timer
                  deadline={state.turnDeadline}
                  isActive={state.currentPlayer === 'yellow'}
                />
              )}
            </div>
            <div className="w-8 h-8 rounded-full bg-yellow-500"></div>
          </div>
        </div>
      </div>

      {/* Game Board */}
      <div
        ref={boardRef}
        className="relative bg-blue-600 p-3 sm:p-4 md:p-6 rounded-xl shadow-xl"
        style={{
          transform: 'perspective(1000px) rotateX(10deg)',
        }}
        onMouseLeave={() => setHoveredCol(null)}
      >
        <div className="grid grid-cols-7 gap-1 sm:gap-2 md:gap-3">
          {state.board.map((row, rowIndex) => (
            row.map((cell, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={classNames(
                  "relative w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16",
                  { "cursor-pointer": state.isMyTurn && state.gameStatus === 'playing' }
                )}
                onClick={() => handleColumnClick(colIndex)}
                onMouseEnter={() => state.isMyTurn && state.gameStatus === 'playing' && setHoveredCol(colIndex)}
              >
                <div className="absolute inset-0 bg-blue-700 rounded-full"></div>
                {/* Hover preview */}
                {!cell && hoveredCol === colIndex && rowIndex === previewRow && state.isMyTurn && state.gameStatus === 'playing' && (
                  <div className={classNames(
                    'absolute inset-0 rounded-full opacity-30',
                    {
                      'bg-red-500': state.playerColor === 'red',
                      'bg-yellow-400': state.playerColor === 'yellow',
                    }
                  )} />
                )}
                <div
                  className={classNames(
                    'absolute inset-0 rounded-full transform transition-all duration-300',
                    {
                      'scale-0': !cell,
                      'scale-100': cell,
                      'bg-red-500': cell === 'red',
                      'bg-yellow-400': cell === 'yellow',
                      'animate-drop': cell && state.lastMove?.row === rowIndex && state.lastMove?.col === colIndex,
                      'ring-4 ring-white animate-win-pulse z-10': isWinningCell(rowIndex, colIndex)
                    }
                  )}
                />
              </div>
            ))
          ))}
        </div>

        {/* Opponent Mouse Position */}
        {state.opponentMousePosition && state.gameStatus === 'playing' && (
          <div
            className="absolute w-4 h-4 rounded-full bg-gray-500 opacity-50 pointer-events-none transform -translate-x-1/2 -translate-y-1/2 transition-all duration-75"
            style={{
              left: `${state.opponentMousePosition.x}px`,
              top: `${state.opponentMousePosition.y}px`,
            }}
          />
        )}

        {/* Board Stand */}
        <div className="absolute -bottom-8 left-0 right-0 h-8 bg-blue-800 rounded-b-xl"></div>
      </div>

      {/* Confetti — only fires for the winning client during the reveal window */}
      {showConfetti && <Confetti />}

      {/* Game Over Modal — shown after WIN_REVEAL_DELAY_MS so the player can
          actually see the winning four and the confetti first. */}
      {state.gameStatus === 'finished' && showEndModal && (
        <GameOverModal
          result={result}
          slowAnimation
          playAgainLabel="Play Again"
          playAgainDisabled={playAgainDisabled}
          playAgainDisabledReason={playAgainDisabledReason}
          playAgainState={state.playAgainState}
          playAgainRequesterName={state.playAgainRequesterName}
          onPlayAgain={actions.requestPlayAgain}
          onAcceptPlayAgain={actions.requestPlayAgain}
          onDeclinePlayAgain={actions.declinePlayAgain}
          onDismissPlayAgainNotice={actions.dismissPlayAgainNotice}
          onBackToLobby={actions.leaveGame}
        />
      )}
    </div>
  );
};

export default GameBoard;
