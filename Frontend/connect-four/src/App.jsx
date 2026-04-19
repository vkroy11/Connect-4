import React, { useState } from 'react';
import { GameProvider } from './contexts/GameContext';
import { useGame } from './contexts/GameContext';
import { LocalGameProvider } from './contexts/LocalGameContext';
import GameBoard from './components/GameBoard';
import GameLobby from './components/GameLobby';
import DifficultySelector from './components/DifficultySelector';
import LocalGameBoard from './components/LocalGameBoard';

const OnlineGameContainer = ({ onPlayComputer }) => {
  const { state } = useGame();

  return (
    <>
      {state.gameStatus === 'waiting' ? (
        <GameLobby onPlayComputer={onPlayComputer} />
      ) : (
        <GameBoard />
      )}
    </>
  );
};

function App() {
  const [gameMode, setGameMode] = useState('lobby'); // 'lobby' | 'difficulty' | 'computer'
  const [playerName, setPlayerName] = useState('');
  const [difficulty, setDifficulty] = useState('medium');

  const handlePlayComputer = (name) => {
    setPlayerName(name || 'Player');
    setGameMode('difficulty');
  };

  const handleSelectDifficulty = (diff) => {
    setDifficulty(diff);
    setGameMode('computer');
  };

  const handleBackToLobby = () => {
    setGameMode('lobby');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-500 to-blue-700">
      {gameMode === 'computer' ? (
        <LocalGameProvider playerName={playerName} difficulty={difficulty}>
          <LocalGameBoard onBack={handleBackToLobby} />
        </LocalGameProvider>
      ) : gameMode === 'difficulty' ? (
        <DifficultySelector
          playerName={playerName}
          onSelect={handleSelectDifficulty}
          onBack={handleBackToLobby}
        />
      ) : (
        <GameProvider>
          <OnlineGameContainer onPlayComputer={handlePlayComputer} />
        </GameProvider>
      )}
    </div>
  );
}

export default App;
