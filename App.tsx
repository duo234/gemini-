
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
    <div className="min-h-screen bg-black flex items-center justify-center font-sans overflow-hidden relative">
      {/* Global CSS for CRT lines */}
      <style>{`
        .scanlines {
          background: linear-gradient(
            to bottom,
            rgba(255,255,255,0),
            rgba(255,255,255,0) 50%,
            rgba(0,0,0,0.2) 50%,
            rgba(0,0,0,0.2)
          );
          background-size: 100% 4px;
          pointer-events: none;
        }
      `}</style>

      {/* Background Ambience */}
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-950 via-purple-950 to-black opacity-80"></div>
      
      {/* Scanline Overlay */}
      <div className="absolute inset-0 scanlines z-50 opacity-20"></div>
      
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
