import React from 'react';

/**
 * Props:
 *  - result: 'win' | 'lose' | 'draw'
 *  - onPlayAgain: () => void
 *  - onBackToLobby: () => void
 *  - playAgainDisabled?: boolean    (e.g. opponent has left the room)
 *  - playAgainDisabledReason?: string  (shown under the button)
 *  - playAgainState?: 'idle' | 'pending' | 'requested' | 'declined'
 *  - playAgainRequesterName?: string
 *  - onAcceptPlayAgain?: () => void
 *  - onDeclinePlayAgain?: () => void
 *  - onDismissPlayAgainNotice?: () => void
 *  - playAgainLabel?: string         (override the primary button label)
 *  - slowAnimation?: boolean         (use the slow win animation)
 */
const GameOverModal = ({
  result,
  onPlayAgain,
  onBackToLobby,
  playAgainDisabled = false,
  playAgainDisabledReason = null,
  playAgainState = 'idle',
  playAgainRequesterName = null,
  onAcceptPlayAgain,
  onDeclinePlayAgain,
  onDismissPlayAgainNotice,
  playAgainLabel = 'Play Again',
  slowAnimation = false,
}) => {
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

  const backdropAnim = slowAnimation ? 'animate-fade-in-slow' : 'animate-fade-in';
  const modalAnim = slowAnimation ? 'animate-modal-slow' : 'animate-modal-pop';

  // Body content varies based on rematch negotiation state.
  const renderBody = () => {
    if (playAgainState === 'requested') {
      return (
        <div className="p-6 space-y-4">
          <div className="text-center">
            <p className="text-gray-800 font-semibold">
              {playAgainRequesterName || 'Opponent'} wants a rematch.
            </p>
            <p className="text-sm text-gray-500 mt-1">Accept to start a new game in this room.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onAcceptPlayAgain}
              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-4 rounded-lg font-semibold hover:opacity-90 transition-all transform hover:scale-105"
            >
              Accept
            </button>
            <button
              onClick={onDeclinePlayAgain}
              className="bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-200 transition-all"
            >
              Decline
            </button>
          </div>
          <button
            onClick={onBackToLobby}
            className="w-full text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Back to lobby
          </button>
        </div>
      );
    }

    if (playAgainState === 'pending') {
      return (
        <div className="p-6 space-y-3">
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 text-blue-600">
              <span className="w-3 h-3 rounded-full border-2 border-blue-300 border-t-blue-600 animate-spin" />
              <span className="font-semibold">Waiting for opponent to accept…</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">They'll see your rematch request now.</p>
          </div>
          <button
            onClick={onBackToLobby}
            className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-200 transition-all"
          >
            Cancel & back to lobby
          </button>
        </div>
      );
    }

    if (playAgainState === 'declined') {
      return (
        <div className="p-6 space-y-3">
          <div className="text-center">
            <p className="text-gray-800 font-semibold">Opponent declined the rematch.</p>
            <p className="text-sm text-gray-500 mt-1">You can head back to the lobby.</p>
          </div>
          <button
            onClick={onDismissPlayAgainNotice || onBackToLobby}
            className={`w-full bg-gradient-to-r ${c.bgGradient} text-white py-3 px-4 rounded-lg font-semibold hover:opacity-90 transition-all transform hover:scale-105`}
          >
            OK
          </button>
          <button
            onClick={onBackToLobby}
            className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-200 transition-all"
          >
            Back to Lobby
          </button>
        </div>
      );
    }

    // Default idle state.
    return (
      <div className="p-6 space-y-3">
        <button
          onClick={onPlayAgain}
          disabled={playAgainDisabled}
          className={`w-full bg-gradient-to-r ${c.bgGradient} text-white py-3 px-4 rounded-lg font-semibold transition-all transform ${
            playAgainDisabled
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:opacity-90 hover:scale-105'
          }`}
        >
          {playAgainLabel}
        </button>
        {playAgainDisabled && playAgainDisabledReason && (
          <p className="text-xs text-center text-gray-500 -mt-1">{playAgainDisabledReason}</p>
        )}
        <button
          onClick={onBackToLobby}
          className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-200 transition-all"
        >
          Back to Lobby
        </button>
      </div>
    );
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm ${backdropAnim}`}>
      <div className={`bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden ${modalAnim}`}>
        <div className={`bg-gradient-to-r ${c.bgGradient} p-6 flex flex-col items-center`}>
          <div className={`${c.iconBg} ${c.iconColor} rounded-full p-4 mb-3`}>
            {c.icon}
          </div>
          <h2 className="text-3xl font-extrabold text-white">{c.title}</h2>
          <p className="text-white/80 text-sm mt-1">{c.subtitle}</p>
        </div>
        {renderBody()}
      </div>
    </div>
  );
};

export default GameOverModal;
