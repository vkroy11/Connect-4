import React, { useState } from 'react';
import { useGame } from '../contexts/GameContext';
import Toast from './Toast';
import Spinner from './Spinner';

const GameLobby = ({ onPlayComputer }) => {
  const { state, actions } = useGame();
  const [gameId, setGameId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [copyState, setCopyState] = useState('idle'); // 'idle' | 'code' | 'invite' | 'error'

  const handleCreateGame = (e) => {
    e.preventDefault();
    actions.createGame(playerName);
  };

  const handleJoinGame = (e) => {
    e.preventDefault();
    actions.joinGame(gameId, playerName);
  };

  const inviteText = state.gameId
    ? `Let's play Connect Four! Join my room with code: ${state.gameId}`
    : '';

  const copyToClipboard = async (text, kind) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers / non-secure contexts.
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopyState(kind);
      setTimeout(() => setCopyState('idle'), 1800);
    } catch {
      setCopyState('error');
      setTimeout(() => setCopyState('idle'), 1800);
    }
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
              <p className="text-center text-gray-700 mb-2">Game ID</p>
              <div className="flex items-center justify-center gap-2">
                <span className="font-bold text-blue-700 text-2xl tracking-wider bg-white px-4 py-2 rounded-lg border border-blue-200 select-all">
                  {state.gameId}
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(state.gameId, 'code')}
                  title="Copy game code"
                  aria-label="Copy game code"
                  className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition-all"
                >
                  {copyState === 'code' ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
              </div>

              <p className="text-center text-xs text-gray-500 mt-3">
                Send this code to a friend so they can join your room.
              </p>

              <button
                type="button"
                onClick={() => copyToClipboard(inviteText, 'invite')}
                className="mt-3 w-full text-sm bg-white border border-blue-200 text-blue-700 hover:bg-blue-100 transition-colors py-2 px-3 rounded-lg flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4h16v16H4z M4 4l8 8 8-8" />
                </svg>
                {copyState === 'invite' ? 'Invite copied!' : 'Copy invite message'}
              </button>

              {copyState === 'error' && (
                <p className="text-center text-xs text-red-500 mt-2">
                  Couldn't copy automatically — please copy the code manually.
                </p>
              )}

              <div className="flex items-center justify-center mt-3 space-x-2">
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
