import React, { useState } from 'react';

const difficulties = [
  { id: 'easy', label: 'Easy', description: 'Random moves', color: 'from-green-500 to-green-600' },
  { id: 'medium', label: 'Medium', description: 'Moderate AI', color: 'from-yellow-500 to-yellow-600' },
  { id: 'hard', label: 'Hard', description: 'Expert AI', color: 'from-red-500 to-red-600' },
];

const DifficultySelector = ({ playerName, onSelect, onBack }) => {
  const [selected, setSelected] = useState('medium');

  return (
    <div className="relative max-w-4xl w-full mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-purple-600 opacity-10"></div>

      <div className="relative text-center py-8 px-4">
        <h1 className="text-4xl sm:text-5xl font-bold text-purple-600 mb-2">Play vs Computer</h1>
        <p className="text-gray-500 text-sm">Choose your difficulty level</p>
      </div>

      <div className="relative bg-white p-6 sm:p-8 rounded-t-3xl -mt-4">
        <div className="max-w-md mx-auto space-y-4">
          {difficulties.map((diff) => (
            <button
              key={diff.id}
              onClick={() => setSelected(diff.id)}
              className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                selected === diff.id
                  ? 'border-purple-500 bg-purple-50 shadow-md'
                  : 'border-gray-200 hover:border-purple-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-lg">{diff.label}</p>
                  <p className="text-sm text-gray-500">{diff.description}</p>
                </div>
                <div className={`w-4 h-4 rounded-full ${
                  selected === diff.id ? 'bg-purple-500' : 'bg-gray-300'
                }`} />
              </div>
            </button>
          ))}

          <button
            onClick={() => onSelect(selected)}
            className="w-full mt-6 bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 px-4 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all transform hover:scale-105"
          >
            Start Game
          </button>

          <button
            onClick={onBack}
            className="w-full text-gray-500 py-2 hover:text-gray-700 transition-colors"
          >
            Back to Lobby
          </button>
        </div>
      </div>
    </div>
  );
};

export default DifficultySelector;
