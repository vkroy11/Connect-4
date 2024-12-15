import React, { useCallback, useRef, useEffect } from 'react';
import { useGame } from '../contexts/GameContext';
import classNames from 'classnames';
import Timer from './Timer';

const GameBoard = () => {
  const { state, actions } = useGame();
  const boardRef = useRef(null);

  const handleColumnClick = (colIndex) => {
    if (!state.isMyTurn || state.gameStatus !== 'playing') return;
    actions.makeMove(colIndex);
  };

  const handleMouseMove = useCallback((e) => {
    if (!boardRef.current || state.gameStatus !== 'playing') return;

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

  // Debug information
  console.log('Current game state:', {
    isMyTurn: state.isMyTurn,
    playerColor: state.playerColor,
    currentPlayer: state.currentPlayer,
    gameStatus: state.gameStatus
  });

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
              {state.currentPlayer === 'red' && (
                <Timer 
                  duration={state.timeLeft} 
                  isActive={state.isMyTurn && state.playerColor === 'red'} 
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
              {state.currentPlayer === 'yellow' && (
                <Timer 
                  duration={state.timeLeft} 
                  isActive={state.isMyTurn && state.playerColor === 'yellow'} 
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
        className="relative bg-blue-600 p-6 rounded-xl shadow-xl"
        style={{
          transform: 'perspective(1000px) rotateX(10deg)',
        }}
      >
        <div className="grid grid-cols-7 gap-3">
          {state.board.map((row, rowIndex) => (
            row.map((cell, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={classNames(
                  "relative w-16 h-16",
                  { "cursor-pointer": state.isMyTurn }
                )}
                onClick={() => handleColumnClick(colIndex)}
              >
                <div className="absolute inset-0 bg-blue-700 rounded-full"></div>
                <div 
                  className={classNames(
                    'absolute inset-0 rounded-full transform transition-all duration-300',
                    {
                      'scale-0': !cell,
                      'scale-100': cell,
                      'bg-red-500': cell === 'red',
                      'bg-yellow-400': cell === 'yellow',
                      'animate-drop': cell && state.lastMove?.row === rowIndex && state.lastMove?.col === colIndex
                    }
                  )}
                />
              </div>
            ))
          ))}
        </div>

        {/* Opponent Mouse Position */}
        {state.opponentMousePosition && (
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

      {/* Game Controls */}
      {state.gameStatus === 'finished' && (
        <button
          onClick={actions.resetGame}
          className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          Play Again
        </button>
      )}
    </div>
  );
};

export default GameBoard;