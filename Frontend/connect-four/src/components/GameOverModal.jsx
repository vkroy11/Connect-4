import React from 'react';

const GameOverModal = ({ result, onPlayAgain, onBackToLobby }) => {
  // result: 'win' | 'lose' | 'draw'
  const config = {
    win: {
      title: 'You Win!',
      subtitle: 'Congratulations!',
      bgGradient: 'from-green-500 to-emerald-600',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      icon: (
        <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      ),
    },
    lose: {
      title: 'You Lose',
      subtitle: 'Better luck next time!',
      bgGradient: 'from-red-500 to-rose-600',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      icon: (
        <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    draw: {
      title: "It's a Draw!",
      subtitle: 'Evenly matched!',
      bgGradient: 'from-yellow-500 to-amber-600',
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      icon: (
        <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  };

  const c = config[result] || config.draw;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden animate-modal-pop">
        {/* Colored header */}
        <div className={`bg-gradient-to-r ${c.bgGradient} p-6 flex flex-col items-center`}>
          <div className={`${c.iconBg} ${c.iconColor} rounded-full p-4 mb-3`}>
            {c.icon}
          </div>
          <h2 className="text-3xl font-extrabold text-white">{c.title}</h2>
          <p className="text-white/80 text-sm mt-1">{c.subtitle}</p>
        </div>

        {/* Buttons */}
        <div className="p-6 space-y-3">
          <button
            onClick={onPlayAgain}
            className={`w-full bg-gradient-to-r ${c.bgGradient} text-white py-3 px-4 rounded-lg font-semibold hover:opacity-90 transition-all transform hover:scale-105`}
          >
            Play Again
          </button>
          <button
            onClick={onBackToLobby}
            className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-200 transition-all"
          >
            Back to Lobby
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameOverModal;
