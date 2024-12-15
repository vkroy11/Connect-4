
import React, { useState } from 'react';
import { useGame } from '../contexts/GameContext';

const GameLobby = () => {
  const { state, actions } = useGame();
  const [gameId, setGameId] = useState('');
  const [playerName, setPlayerName] = useState('');

  const handleCreateGame = (e) => {
    e.preventDefault();
    if (!playerName.trim()) {
      alert('Please enter your name first!');
      return;
    }
    actions.createGame(playerName);
  };

  const handleJoinGame = (e) => {
    e.preventDefault();
    if (!playerName.trim()) {
      alert('Please enter your name first!');
      return;
    }
    if (!gameId.trim()) {
      alert('Please enter a game ID!');
      return;
    }
    actions.joinGame(gameId, playerName);
  };

  // Show error message if there is one
  if (state.error) {
    console.error('Game Error:', state.error);
  }

  return (
    <div className="relative max-w-4xl w-full mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 opacity-10"></div>
      
      {/* Game Title and Logo */}
      <div className="relative text-center py-8 px-4">
        <h1 className="text-5xl font-bold text-blue-600 mb-2">Connect Four</h1>
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

      {/* Game Controls */}
      <div className="relative bg-white p-8 rounded-t-3xl -mt-4">
        <div className="max-w-md mx-auto space-y-6">
          {/* Error Message */}
          {state.error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
              {state.error}
            </div>
          )}

          {/* Player Name Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Your Name</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Create Game Button */}
          <button
            onClick={handleCreateGame}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all transform hover:scale-105"
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
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 px-4 rounded-lg hover:from-green-700 hover:to-green-800 transition-all transform hover:scale-105"
            >
              Join Game
            </button>
          </form>

          {/* Game ID Display */}
          {state.gameId && (
            <div className="mt-4 p-4 bg-gray-100 rounded-lg">
              <p className="text-center text-gray-700">Game ID: <span className="font-bold">{state.gameId}</span></p>
              <p className="text-center text-sm text-gray-500">Share this code with your opponent</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameLobby;