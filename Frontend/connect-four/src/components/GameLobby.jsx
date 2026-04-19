import React, { useState } from 'react';
import { useGame } from '../contexts/GameContext';
import Toast from './Toast';
import Spinner from './Spinner';

const GameLobby = ({ onPlayComputer }) => {
  const { state, actions } = useGame();
  const [gameId, setGameId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateGame = (e) => {
    e.preventDefault();
    actions.createGame(playerName);
  };

  const handleJoinGame = (e) => {
    e.preventDefault();
    actions.joinGame(gameId, playerName);
  };

  return (
    <div className="relative max-w-4xl w-full mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
      {/* Toast notifications */}
      {state.error && (
        <Toast message={state.error} type="error" onDismiss={actions.clearError} />
      )}

      {/* Decorative Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 opacity-10"></div>

      {/* Game Title and Logo */}
      <div className="relative text-center py-8 px-4">
        <h1 className="text-4xl sm:text-5xl font-bold text-blue-600 mb-2">Connect Four</h1>
        <p className="text-gray-500 text-sm mb-4">Drop your pieces to connect four in a row!</p>
        <div className="flex justify-center mb-8">
          <div className="grid grid-cols-4 gap-2">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-red-600 animate-bounce-slow"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Connection Status */}
      {!state.connected && (
        <div className="relative flex items-center justify-center space-x-2 py-3 bg-yellow-50 border-y border-yellow-200">
          <Spinner size="sm" className="border-yellow-400 border-t-yellow-600" />
          <span className="text-sm text-yellow-700">Connecting to server...</span>
        </div>
      )}

      {/* Game Controls */}
      <div className="relative bg-white p-6 sm:p-8 rounded-t-3xl -mt-4">
        <div className="max-w-md mx-auto space-y-6">
          {/* Player Name Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Your Name</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              maxLength={20}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Create Game Button */}
          <button
            onClick={handleCreateGame}
            disabled={!state.connected}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            Create New Game
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or join existing game</span>
            </div>
          </div>

          {/* Join Game Form */}
          <form onSubmit={handleJoinGame} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Game Code</label>
              <input
                type="text"
                value={gameId}
                onChange={(e) => setGameId(e.target.value.toUpperCase())}
                placeholder="Enter Game ID"
                maxLength={6}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={!state.connected}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 px-4 rounded-lg hover:from-green-700 hover:to-green-800 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              Join Game
            </button>
          </form>

          {/* Game ID Display */}
          {state.gameId && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-center text-gray-700">Game ID: <span className="font-bold text-blue-600 text-lg">{state.gameId}</span></p>
              <p className="text-center text-sm text-gray-500 mt-1">Share this code with your opponent</p>
              <div className="flex items-center justify-center mt-2 space-x-2">
                <Spinner size="sm" className="border-blue-300 border-t-blue-600" />
                <span className="text-sm text-blue-600">Waiting for opponent...</span>
              </div>
            </div>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or play solo</span>
            </div>
          </div>

          {/* Play vs Computer */}
          <button
            onClick={() => onPlayComputer?.(playerName)}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 px-4 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all transform hover:scale-105"
          >
            Play vs Computer
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameLobby;
