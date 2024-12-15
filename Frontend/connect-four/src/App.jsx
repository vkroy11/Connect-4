import React from 'react';
import { GameProvider } from './contexts/GameContext';
import { useGame } from './contexts/GameContext';
import GameBoard from './components/GameBoard';
import GameLobby from './components/GameLobby';

const GameContainer = () => {
  const { state } = useGame();

  console.log('Current game state:', state); // Add this for debugging

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-500 to-blue-700">
      {state.gameStatus === 'waiting' ? (
        <GameLobby />
      ) : (
        <GameBoard />
      )}
    </div>
  );
};

function App() {
  return (
    <GameProvider>
      <GameContainer />
    </GameProvider>
  );
}

export default App;
