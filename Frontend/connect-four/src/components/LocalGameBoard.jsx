import React, { useRef, useEffect, useState } from 'react';
import { useLocalGame } from '../contexts/LocalGameContext';
import classNames from 'classnames';
import Timer from './Timer';
import GameOverModal from './GameOverModal';
import Confetti from './Confetti';
import { playDropSound, playWinSound, playLoseSound, playDrawSound } from '../utils/sounds';

const WIN_REVEAL_DELAY_MS = 3500;

const LocalGameBoard = ({ onBack }) => {
  const { state, actions } = useLocalGame();
  const [hoveredCol, setHoveredCol] = useState(null);
  const prevGameStatus = useRef(state.gameStatus);
  const prevLastMove = useRef(state.lastMove);

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
      if (state.winner === 'player') {
        playWinSound();
      } else if (state.winner === 'computer') {
        playLoseSound();
      } else {
        playDrawSound();
      }
    }
    prevGameStatus.current = state.gameStatus;
  }, [state.gameStatus, state.winner]);

  // Delay the modal so the user sees the winning four + confetti first.
  useEffect(() => {
    if (state.gameStatus !== 'finished') {
      setShowEndModal(false);
      setShowConfetti(false);
      return;
    }

    // Only fire confetti for the human player's wins (keeps it celebratory).
    if (state.winner === 'player') setShowConfetti(true);

    const t = setTimeout(() => {
      setShowEndModal(true);
      setTimeout(() => setShowConfetti(false), 2000);
    }, WIN_REVEAL_DELAY_MS);

    return () => clearTimeout(t);
  }, [state.gameStatus, state.winner]);

  const handleColumnClick = (colIndex) => {
    if (!state.isMyTurn || state.gameStatus !== 'playing') return;
    actions.makeMove(colIndex);
  };

  const getPreviewRow = (col) => {
    if (col === null) return -1;
    return state.board.findLastIndex(r => !r[col]);
  };

  const previewRow = getPreviewRow(hoveredCol);

  const isWinningCell = (row, col) => {
    if (!state.winningCells) return false;
    return state.winningCells.some(c => c.row === row && c.col === col);
  };

  const result = state.winner === 'player' ? 'win' : state.winner === 'computer' ? 'lose' : 'draw';

  return (
    <div className="flex flex-col items-center space-y-8 max-w-4xl mx-auto p-4">
      {/* Game Info */}
      <div className="w-full bg-white rounded-lg shadow-lg p-4">
        <div className="flex justify-between items-center">
          {/* Player (Red) */}
          <div className={`flex items-center space-x-4 ${state.isMyTurn ? 'font-bold' : ''}`}>
            <div className="w-8 h-8 rounded-full bg-red-500"></div>
            <div>
              <p className="text-lg">{state.playerName || 'You'}</p>
              {state.currentPlayer === 'red' && state.gameStatus === 'playing' && (
                <Timer
                  duration={30}
                  isActive={state.isMyTurn}
                  onTimeUp={actions.makeRandomMove}
                />
              )}
            </div>
          </div>

          {/* Game Status */}
          <div className="text-center">
            <p className="text-lg font-bold">{state.message}</p>
            <p className="text-sm text-gray-600">vs Computer ({state.difficulty})</p>
          </div>

          {/* Computer (Yellow) */}
          <div className={`flex items-center space-x-4 ${!state.isMyTurn && state.gameStatus === 'playing' ? 'font-bold' : ''}`}>
            <div>
              <p className="text-lg text-right">Computer</p>
              {state.isAiThinking && (
                <p className="text-sm text-gray-500 text-right">Thinking...</p>
              )}
            </div>
            <div className="w-8 h-8 rounded-full bg-yellow-500"></div>
          </div>
        </div>
      </div>

      {/* Game Board */}
      <div
        className="relative bg-blue-600 p-3 sm:p-4 md:p-6 rounded-xl shadow-xl"
        style={{ transform: 'perspective(1000px) rotateX(10deg)' }}
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
                  <div className="absolute inset-0 rounded-full opacity-30 bg-red-500" />
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

        {/* Board Stand */}
        <div className="absolute -bottom-8 left-0 right-0 h-8 bg-blue-800 rounded-b-xl"></div>
      </div>

      {/* Confetti only on a player win */}
      {showConfetti && state.winner === 'player' && <Confetti />}

      {/* Game Over Modal — delayed so the winning four registers first.
          In computer mode, "Play Again" restarts a fresh match at the same
          difficulty (LocalGameContext's RESET_GAME preserves difficulty). */}
      {state.gameStatus === 'finished' && showEndModal && (
        <GameOverModal
          result={result}
          slowAnimation
          playAgainLabel={`Play Again (${state.difficulty})`}
          onPlayAgain={actions.resetGame}
          onBackToLobby={onBack}
        />
      )}
    </div>
  );
};

export default LocalGameBoard;
