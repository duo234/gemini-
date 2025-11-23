import React, { useState } from 'react';
import { GameEngine } from './components/GameEngine';
import { WelcomeScreen } from './components/WelcomeScreen';
import { GameOverScreen } from './components/GameOverScreen';
import { GameState, GameStats } from './types';

function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [playerImage, setPlayerImage] = useState<HTMLImageElement | null>(null);
  const [finalStats, setFinalStats] = useState<GameStats | null>(null);

  const handleStart = (img: HTMLImageElement | null) => {
    setPlayerImage(img);
    setGameState(GameState.PLAYING);
  };

  const handleGameOver = (stats: GameStats) => {
    setFinalStats(stats);
    setGameState(GameState.GAME_OVER);
  };

  const handleRestart = () => {
    setGameState(GameState.MENU);
    setFinalStats(null);
  };

  return (
    <div className="min-h-screen bg-green-950 flex items-center justify-center font-sans overflow-hidden bg-[url('https://picsum.photos/1920/1080?grayscale&blur=10')] bg-cover bg-center">
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>
      
      {/* Main Content Area */}
      <div className="relative z-10 w-full h-full flex items-center justify-center">
        {gameState === GameState.MENU && (
          <WelcomeScreen onStart={handleStart} />
        )}

        {gameState === GameState.PLAYING && (
          <GameEngine 
            playerImage={playerImage} 
            onGameOver={handleGameOver} 
          />
        )}

        {gameState === GameState.GAME_OVER && finalStats && (
          <GameOverScreen 
            stats={finalStats} 
            onRestart={handleRestart} 
          />
        )}
      </div>
    </div>
  );
}

export default App;
