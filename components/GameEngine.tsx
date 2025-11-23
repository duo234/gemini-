
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameStats, Mushroom, MushroomType } from '../types';
import { playCollectSound, playGoldenSound, playPoisonSound } from '../services/audioService';

interface GameEngineProps {
  playerImage: HTMLImageElement | null;
  onGameOver: (stats: GameStats) => void;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  size: number;
  type: 'firefly' | 'leaf';
  phase: number; // for swaying
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PLAYER_SIZE = 48;
const MUSHROOM_SIZE = 32;
const GAME_DURATION = 60;

// A realistic deep forest background
const FOREST_BG_URL = "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1600&auto=format&fit=crop";

export const GameEngine: React.FC<GameEngineProps> = ({ playerImage, onGameOver }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [score, setScore] = useState(0);

  // Game State Refs
  const playerPos = useRef({ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 });
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const mushrooms = useRef<Mushroom[]>([]);
  const particles = useRef<Particle[]>([]);
  const frameId = useRef<number>(0);
  const lastSpawnTime = useRef<number>(0);
  
  // Stats accumulation
  const stats = useRef<GameStats>({
    score: 0,
    normalCount: 0,
    goldenCount: 0,
    poisonCount: 0
  });

  const updatePlayerPosition = () => {
    const speed = 7;
    if (keysPressed.current['ArrowUp'] || keysPressed.current['w']) playerPos.current.y -= speed;
    if (keysPressed.current['ArrowDown'] || keysPressed.current['s']) playerPos.current.y += speed;
    if (keysPressed.current['ArrowLeft'] || keysPressed.current['a']) playerPos.current.x -= speed;
    if (keysPressed.current['ArrowRight'] || keysPressed.current['d']) playerPos.current.x += speed;

    // Bounds
    playerPos.current.x = Math.max(0, Math.min(CANVAS_WIDTH - PLAYER_SIZE, playerPos.current.x));
    playerPos.current.y = Math.max(0, Math.min(CANVAS_HEIGHT - PLAYER_SIZE, playerPos.current.y));
  };

  const spawnMushroom = () => {
    const now = Date.now();
    if (now - lastSpawnTime.current > 600) {
      const typeRoll = Math.random();
      let type = MushroomType.NORMAL;
      let points = 10;

      if (typeRoll > 0.92) {
        type = MushroomType.GOLDEN;
        points = 50;
      } else if (typeRoll > 0.75) {
        type = MushroomType.POISON;
        points = -20;
      }

      mushrooms.current.push({
        id: Math.random().toString(36).substr(2, 9),
        x: Math.random() * (CANVAS_WIDTH - MUSHROOM_SIZE),
        y: Math.random() * (CANVAS_HEIGHT - MUSHROOM_SIZE),
        type,
        points
      });
      lastSpawnTime.current = now;
    }
  };

  const spawnParticles = () => {
    // Spawn Fireflies
    if (Math.random() < 0.05) {
      particles.current.push({
        id: Math.random(),
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        alpha: 0,
        size: Math.random() * 3 + 1,
        type: 'firefly',
        phase: Math.random() * Math.PI * 2
      });
    }
    // Spawn Leaves
    if (Math.random() < 0.02) {
      particles.current.push({
        id: Math.random(),
        x: Math.random() * CANVAS_WIDTH,
        y: -10,
        vx: (Math.random() - 0.5),
        vy: Math.random() * 1 + 0.5,
        alpha: 0.8,
        size: Math.random() * 5 + 3,
        type: 'leaf',
        phase: Math.random() * Math.PI * 2
      });
    }
  };

  const updateParticles = () => {
    particles.current.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.phase += 0.05;

      if (p.type === 'firefly') {
        // Fireflies glow in and out
        p.alpha = (Math.sin(p.phase) + 1) / 2 * 0.8; 
      } else {
        // Leaves sway
        p.x += Math.sin(p.phase) * 0.5;
        if (p.y > CANVAS_HEIGHT) p.alpha = 0; // Kill logic helper
      }
    });

    // Cleanup dead particles
    particles.current = particles.current.filter(p => 
      p.y < CANVAS_HEIGHT + 20 && p.x > -20 && p.x < CANVAS_WIDTH + 20
    );
  };

  const checkCollisions = () => {
    const px = playerPos.current.x;
    const py = playerPos.current.y;
    const hitBox = PLAYER_SIZE * 0.5; 
    const pCenter = { x: px + PLAYER_SIZE/2, y: py + PLAYER_SIZE/2 };

    mushrooms.current = mushrooms.current.filter(m => {
      const mCenter = { x: m.x + MUSHROOM_SIZE/2, y: m.y + MUSHROOM_SIZE/2 };
      const dx = pCenter.x - mCenter.x;
      const dy = pCenter.y - mCenter.y;
      const distance = Math.sqrt(dx*dx + dy*dy);

      if (distance < (hitBox + MUSHROOM_SIZE/2)) {
        stats.current.score += m.points;
        setScore(stats.current.score);
        
        if (m.type === MushroomType.NORMAL) {
          stats.current.normalCount++;
          playCollectSound();
        } else if (m.type === MushroomType.GOLDEN) {
          stats.current.goldenCount++;
          playGoldenSound();
        } else if (m.type === MushroomType.POISON) {
          stats.current.poisonCount++;
          playPoisonSound();
        }
        
        return false;
      }
      return true;
    });
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.imageSmoothingEnabled = false;

    // --- Environment Effects (Underlay) ---
    // Light shafts
    const gradient = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    gradient.addColorStop(0, 'rgba(255, 255, 200, 0.1)');
    gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw Mushrooms
    mushrooms.current.forEach(m => {
      const mx = Math.floor(m.x);
      const my = Math.floor(m.y);

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath();
      ctx.ellipse(mx + 16, my + 30, 10, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Stem
      ctx.fillStyle = '#fefce8';
      ctx.fillRect(mx + 10, my + 16, 12, 16);
      
      // Cap Color
      if (m.type === MushroomType.NORMAL) ctx.fillStyle = '#ef4444';
      else if (m.type === MushroomType.GOLDEN) ctx.fillStyle = '#fbbf24';
      else ctx.fillStyle = '#9333ea';
      
      // Cap
      ctx.fillRect(mx + 4, my + 8, 24, 12);
      ctx.fillRect(mx + 8, my + 4, 16, 4);
      
      // Spots
      if (m.type !== MushroomType.GOLDEN) {
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.fillRect(mx + 8, my + 10, 4, 4);
        ctx.fillRect(mx + 20, my + 8, 4, 4);
        ctx.fillRect(mx + 14, my + 6, 4, 2);
      } else {
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.6 + Math.sin(Date.now() / 200) * 0.4;
        ctx.fillRect(mx + 10, my + 6, 4, 4);
        ctx.globalAlpha = 1.0;
      }
    });

    // Draw Player
    if (playerImage) {
      // Simple drop shadow for player
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(playerPos.current.x + PLAYER_SIZE/2, playerPos.current.y + PLAYER_SIZE - 2, PLAYER_SIZE/3, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.drawImage(playerImage, Math.floor(playerPos.current.x), Math.floor(playerPos.current.y), PLAYER_SIZE, PLAYER_SIZE);
    } else {
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(playerPos.current.x, playerPos.current.y, PLAYER_SIZE, PLAYER_SIZE);
    }

    // --- Foreground Effects ---
    // Particles
    particles.current.forEach(p => {
      if (p.type === 'firefly') {
        ctx.fillStyle = `rgba(200, 255, 100, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'leaf') {
        ctx.fillStyle = `rgba(45, 90, 30, ${p.alpha})`;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.phase);
        ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
        ctx.restore();
      }
    });

    // Vignette
    const rad = ctx.createRadialGradient(CANVAS_WIDTH/2, CANVAS_HEIGHT/2, CANVAS_WIDTH/3, CANVAS_WIDTH/2, CANVAS_HEIGHT/2, CANVAS_WIDTH);
    rad.addColorStop(0, 'rgba(0,0,0,0)');
    rad.addColorStop(1, 'rgba(10, 25, 10, 0.6)');
    ctx.fillStyle = rad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  };

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    updatePlayerPosition();
    spawnMushroom();
    spawnParticles();
    updateParticles();
    checkCollisions();
    draw(ctx);

    frameId.current = requestAnimationFrame(gameLoop);
  }, [playerImage]);

  // Input listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { keysPressed.current[e.key] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keysPressed.current[e.key] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          cancelAnimationFrame(frameId.current);
          onGameOver(stats.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Start Loop
  useEffect(() => {
    frameId.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(frameId.current);
  }, [gameLoop]);

  // Mobile Controls
  const handleTouchStart = (key: string) => { keysPressed.current[key] = true; };
  const handleTouchEnd = () => { 
    keysPressed.current['ArrowUp'] = false;
    keysPressed.current['ArrowDown'] = false;
    keysPressed.current['ArrowLeft'] = false;
    keysPressed.current['ArrowRight'] = false;
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-4">
      {/* HUD */}
      <div className="absolute top-4 left-0 right-0 flex justify-between px-4 max-w-[800px] mx-auto z-10 pointer-events-none">
        <div className="bg-black/50 backdrop-blur-md border-2 border-green-400/50 rounded-xl p-3 font-pixel text-3xl text-white shadow-xl shadow-black/40">
          <span className="text-xs block text-green-300 font-bold -mb-1 tracking-widest">SCORE</span>
          {score}
        </div>
        <div className={`bg-black/50 backdrop-blur-md border-2 rounded-xl p-3 font-pixel text-3xl shadow-xl shadow-black/40 ${timeLeft < 10 ? 'text-red-400 border-red-500/80 animate-pulse' : 'text-white border-green-400/50'}`}>
           <span className="text-xs block text-gray-400 font-bold -mb-1 tracking-widest">TIME</span>
           {timeLeft}s
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="bg-green-900 border-4 border-green-900/50 rounded-xl shadow-2xl max-w-full max-h-[70vh] object-contain image-pixelated cursor-none"
        style={{
          backgroundImage: `url('${FOREST_BG_URL}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          boxShadow: '0 0 50px rgba(0,0,0,0.5)'
        }}
      />

      {/* Mobile Controls */}
      <div className="flex md:hidden gap-6 mt-6 z-20 select-none">
        <button
          className="w-16 h-16 bg-white/10 backdrop-blur-md border border-white/30 text-white rounded-full active:bg-white/30 active:scale-95 transition-all flex items-center justify-center text-3xl shadow-lg"
          onTouchStart={() => handleTouchStart('ArrowLeft')}
          onTouchEnd={handleTouchEnd}
          onMouseDown={() => handleTouchStart('ArrowLeft')}
          onMouseUp={handleTouchEnd}
        >
          ←
        </button>
        <div className="flex flex-col gap-4">
          <button
            className="w-16 h-16 bg-white/10 backdrop-blur-md border border-white/30 text-white rounded-full active:bg-white/30 active:scale-95 transition-all flex items-center justify-center text-3xl shadow-lg"
            onTouchStart={() => handleTouchStart('ArrowUp')}
            onTouchEnd={handleTouchEnd}
            onMouseDown={() => handleTouchStart('ArrowUp')}
            onMouseUp={handleTouchEnd}
          >
            ↑
          </button>
          <button
            className="w-16 h-16 bg-white/10 backdrop-blur-md border border-white/30 text-white rounded-full active:bg-white/30 active:scale-95 transition-all flex items-center justify-center text-3xl shadow-lg"
            onTouchStart={() => handleTouchStart('ArrowDown')}
            onTouchEnd={handleTouchEnd}
            onMouseDown={() => handleTouchStart('ArrowDown')}
            onMouseUp={handleTouchEnd}
          >
            ↓
          </button>
        </div>
        <button
          className="w-16 h-16 bg-white/10 backdrop-blur-md border border-white/30 text-white rounded-full active:bg-white/30 active:scale-95 transition-all flex items-center justify-center text-3xl shadow-lg"
          onTouchStart={() => handleTouchStart('ArrowRight')}
          onTouchEnd={handleTouchEnd}
          onMouseDown={() => handleTouchStart('ArrowRight')}
          onMouseUp={handleTouchEnd}
        >
          →
        </button>
      </div>

      <div className="hidden md:block mt-4 text-white/80 font-pixel text-xl drop-shadow-md tracking-wider opacity-70">
        Use <span className="text-yellow-200 font-bold">Arrow Keys</span> to explore the woods
      </div>
    </div>
  );
};
