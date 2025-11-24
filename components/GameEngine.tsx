
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameStats, Mushroom, MushroomType } from '../types';
import { playCollectSound, playGoldenSound, playPoisonSound, startMusic, stopMusic } from '../services/audioService';

interface GameEngineProps {
  playerImage: HTMLImageElement | null;
  onGameOver: (stats: GameStats) => void;
}

// 3D & Game Constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const GAME_DURATION = 90;
const LANE_WIDTH_WORLD = 140; // Wider lanes
const CAMERA_HEIGHT = 160;
const FOCAL_LENGTH = 320;
const HORIZON_Y = 240; 
const SPAWN_Z = 2500; 
const PLAYER_Z = 100; 
const SPEED_INITIAL = 18; // Faster feel

// Procedural Cityscape Data
const BUILDINGS = Array.from({ length: 20 }, (_, i) => ({
  x: (Math.random() * 4000) - 2000,
  w: 60 + Math.random() * 100,
  h: 50 + Math.random() * 150,
  z: 3000 // Fixed distance
}));

export const GameEngine: React.FC<GameEngineProps> = ({ playerImage, onGameOver }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);

  // Game State
  const playerLane = useRef<-1 | 0 | 1>(0); 
  const playerX = useRef<number>(0); 
  const mushrooms = useRef<Mushroom[]>([]);
  const frameId = useRef<number>(0);
  const speed = useRef<number>(SPEED_INITIAL);
  const beatCounter = useRef<number>(0);
  const totalDistance = useRef<number>(0); // For parallax
  
  // Stats
  const stats = useRef<GameStats>({
    score: 0,
    normalCount: 0,
    goldenCount: 0,
    poisonCount: 0,
    maxCombo: 0
  });

  // --- 3D Projection Logic ---
  const project = (x: number, y: number, z: number) => {
    const scale = FOCAL_LENGTH / (FOCAL_LENGTH + z);
    const screenX = (CANVAS_WIDTH / 2) + (x * scale);
    const screenY = HORIZON_Y + ((y + CAMERA_HEIGHT) * scale);
    return { x: screenX, y: screenY, scale };
  };

  const spawnMushroom = () => {
    beatCounter.current++;
    // Sync spawning roughly to the bpm (calculated via frames)
    const spawnRate = Math.max(15, 45 - Math.floor(stats.current.score / 150)); 
    
    if (beatCounter.current > spawnRate) {
      beatCounter.current = 0;
      
      const laneRoll = Math.floor(Math.random() * 3) - 1; 
      const typeRoll = Math.random();
      let type = MushroomType.NORMAL;
      let points = 100; 

      if (typeRoll > 0.92) {
        type = MushroomType.GOLDEN;
        points = 300;
      } else if (typeRoll > 0.75) {
        type = MushroomType.POISON;
        points = -100;
      }

      mushrooms.current.push({
        id: Math.random().toString(36).substr(2, 9),
        lane: laneRoll as -1 | 0 | 1,
        z: SPAWN_Z,
        type,
        points
      });
    }
  };

  const updatePhysics = () => {
    totalDistance.current += speed.current;
    
    const targetX = playerLane.current * LANE_WIDTH_WORLD;
    playerX.current += (targetX - playerX.current) * 0.25; // Snappier movement

    mushrooms.current.forEach(m => {
      m.z -= speed.current;
    });

    mushrooms.current = mushrooms.current.filter(m => m.z > -100);
  };

  const checkCollisions = () => {
    const HIT_ZONE_START = PLAYER_Z - 60;
    const HIT_ZONE_END = PLAYER_Z + 60;

    mushrooms.current.forEach(m => {
      if (m.z > HIT_ZONE_START && m.z < HIT_ZONE_END) {
        if (m.points !== 0 && m.lane === playerLane.current) {
          
          if (m.type === MushroomType.POISON) {
             playPoisonSound();
             setCombo(0);
             stats.current.poisonCount++;
             stats.current.score += m.points;
             speed.current = Math.max(12, speed.current - 5); 
          } else {
             if (m.type === MushroomType.GOLDEN) playGoldenSound();
             else playCollectSound();
             
             const comboMult = 1 + (combo * 0.1); 
             const finalPoints = Math.floor(m.points * comboMult);
             
             setCombo(c => {
               const newC = c + 1;
               if (newC > stats.current.maxCombo) stats.current.maxCombo = newC;
               return newC;
             });

             if (m.type === MushroomType.NORMAL) stats.current.normalCount++;
             if (m.type === MushroomType.GOLDEN) stats.current.goldenCount++;
             
             stats.current.score += finalPoints;
             speed.current = Math.min(50, speed.current + 0.2);
          }

          setScore(stats.current.score);
          m.points = 0; 
        }
      }
    });
    
    mushrooms.current = mushrooms.current.filter(m => m.points !== 0 || m.z < PLAYER_Z - 20);
  };

  const drawRetroSun = (ctx: CanvasRenderingContext2D) => {
    // Sun Gradient
    const sunGrad = ctx.createLinearGradient(0, HORIZON_Y - 150, 0, HORIZON_Y);
    sunGrad.addColorStop(0, '#fcd34d'); // Yellow
    sunGrad.addColorStop(0.5, '#f472b6'); // Pink
    sunGrad.addColorStop(1, '#9333ea'); // Purple
    
    ctx.save();
    ctx.beginPath();
    ctx.arc(CANVAS_WIDTH / 2, HORIZON_Y - 40, 100, 0, Math.PI * 2);
    ctx.fillStyle = sunGrad;
    ctx.shadowColor = '#f472b6';
    ctx.shadowBlur = 40;
    ctx.fill();
    ctx.restore();

    // Sun Stripes (Blinds effect)
    ctx.fillStyle = '#0f0518'; // Sky color to mask
    for (let i = 0; i < 10; i++) {
        const h = 4 + i * 1.5;
        const y = HORIZON_Y - 40 + (i * 12) - 20;
        if (y < HORIZON_Y + 20) {
            ctx.fillRect(CANVAS_WIDTH / 2 - 110, y, 220, h);
        }
    }
  };

  const drawCityscape = (ctx: CanvasRenderingContext2D) => {
      ctx.fillStyle = '#1e1b4b'; // Dark blue-black
      ctx.shadowColor = '#4c1d95';
      ctx.shadowBlur = 10;
      
      const offset = (totalDistance.current * 0.1) % 4000; // Parallax scroll
      
      BUILDINGS.forEach(b => {
          let drawX = (b.x - offset);
          if (drawX < -2000) drawX += 4000;
          
          // Project to screen
          const scale = FOCAL_LENGTH / (FOCAL_LENGTH + b.z);
          const sx = (CANVAS_WIDTH / 2) + (drawX * scale);
          const sy = HORIZON_Y - (b.h * scale);
          const sw = b.w * scale;
          const sh = b.h * scale;

          if (sx + sw > 0 && sx < CANVAS_WIDTH) {
              ctx.fillRect(sx, sy, sw, sh);
              
              // Windows
              ctx.fillStyle = (Math.floor(Date.now() / 500) + b.x) % 2 === 0 ? '#4c1d95' : '#db2777'; 
              if (Math.random() > 0.9) ctx.fillRect(sx + sw*0.2, sy + sh*0.2, sw*0.1, sw*0.1);
              ctx.fillStyle = '#1e1b4b'; // Reset
          }
      });
      ctx.shadowBlur = 0;
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    // 1. Clear & Background
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, HORIZON_Y);
    skyGrad.addColorStop(0, '#0f0518');
    skyGrad.addColorStop(1, '#2e1065'); // Deep purple
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, HORIZON_Y);

    // Starfield (Simple)
    ctx.fillStyle = '#fff';
    for(let i=0; i<30; i++) {
        const x = (i * 137) % CANVAS_WIDTH;
        const y = (i * 63) % HORIZON_Y;
        if (Math.random() > 0.95) ctx.globalAlpha = 1; else ctx.globalAlpha = 0.3;
        ctx.fillRect(x, y, 2, 2);
    }
    ctx.globalAlpha = 1;

    // Draw Background Elements
    drawRetroSun(ctx);
    drawCityscape(ctx);

    // Ground (Grid Grid)
    const groundGrad = ctx.createLinearGradient(0, HORIZON_Y, 0, CANVAS_HEIGHT);
    groundGrad.addColorStop(0, '#1a0525');
    groundGrad.addColorStop(1, '#000000');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, HORIZON_Y, CANVAS_WIDTH, CANVAS_HEIGHT - HORIZON_Y);

    // 2. Draw Moving Grid
    ctx.shadowColor = '#06b6d4'; // Cyan Glow
    ctx.shadowBlur = 10;
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)'; // Cyan Lines
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    // Vertical Lines (Lanes)
    [-1.5, -0.5, 0.5, 1.5].forEach(laneMultiplier => {
        const x = laneMultiplier * LANE_WIDTH_WORLD;
        const p1 = project(x, 0, 10);
        const p2 = project(x, 0, SPAWN_Z);
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
    });

    // Horizontal Lines
    const gridOffset = (totalDistance.current) % 200;
    for(let z = 0; z < SPAWN_Z; z+= 200) {
        const drawZ = z - gridOffset + 200;
        if(drawZ > 10) {
            const pLeft = project(-LANE_WIDTH_WORLD * 1.5, 0, drawZ);
            const pRight = project(LANE_WIDTH_WORLD * 1.5, 0, drawZ);
            ctx.moveTo(pLeft.x, pLeft.y);
            ctx.lineTo(pRight.x, pRight.y);
        }
    }
    ctx.stroke();
    ctx.shadowBlur = 0; // Reset for performance unless needed

    // 3. Draw Mushrooms
    const renderList = [...mushrooms.current];
    renderList.sort((a, b) => b.z - a.z);

    renderList.forEach(m => {
        const p = project(m.lane * LANE_WIDTH_WORLD, 0, m.z);
        if (m.points === 0) return; 

        const size = 70 * p.scale;
        
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath();
        ctx.ellipse(p.x, p.y + size/2, size/2, size/6, 0, 0, Math.PI*2);
        ctx.fill();

        // Neon Glow per type
        if (m.type === MushroomType.NORMAL) {
            ctx.fillStyle = '#f43f5e'; // Neon Red
            ctx.shadowColor = '#f43f5e';
        }
        else if (m.type === MushroomType.GOLDEN) {
            ctx.fillStyle = '#fbbf24'; // Neon Gold
            ctx.shadowColor = '#fbbf24';
        }
        else {
            ctx.fillStyle = '#a855f7'; // Neon Purple
            ctx.shadowColor = '#a855f7';
        }
        ctx.shadowBlur = 20;

        // Shape (Cube for cyber look)
        ctx.fillRect(p.x - size/2, p.y - size, size, size);
        
        // Inner "Digital" Detail
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.shadowBlur = 0;
        ctx.fillRect(p.x - size/4, p.y - size*0.8, size/2, size/6);
        ctx.fillRect(p.x - size/4, p.y - size*0.5, size/2, size/6);
    });

    // 4. Draw Player
    const playerProj = project(playerX.current, 0, PLAYER_Z);
    const pSize = 90 * playerProj.scale;
    
    // Player Glow
    ctx.shadowColor = '#3b82f6';
    ctx.shadowBlur = 30;

    if (playerImage) {
        ctx.drawImage(playerImage, playerProj.x - pSize/2, playerProj.y - pSize, pSize, pSize);
    } else {
        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(playerProj.x - pSize/2, playerProj.y - pSize, pSize, pSize);
    }
    ctx.shadowBlur = 0;
  };

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false }); // Opt for no transparency for speed
    if (!ctx) return;

    spawnMushroom();
    updatePhysics();
    checkCollisions();
    draw(ctx);

    frameId.current = requestAnimationFrame(gameLoop);
  }, [playerImage]);

  // Controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { 
        if (e.key === 'ArrowLeft' || e.key === 'a') playerLane.current = Math.max(-1, playerLane.current - 1) as -1|0|1;
        if (e.key === 'ArrowRight' || e.key === 'd') playerLane.current = Math.min(1, playerLane.current + 1) as -1|0|1;
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    startMusic();
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          stopMusic();
          cancelAnimationFrame(frameId.current);
          onGameOver(stats.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
        clearInterval(timer);
        stopMusic();
    };
  }, []);

  useEffect(() => {
    frameId.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(frameId.current);
  }, [gameLoop]);

  const handleTouch = (dir: 'left' | 'right') => {
      if (dir === 'left') playerLane.current = Math.max(-1, playerLane.current - 1) as -1|0|1;
      else playerLane.current = Math.min(1, playerLane.current + 1) as -1|0|1;
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-4">
      {/* HUD */}
      <div className="absolute top-4 left-0 right-0 flex justify-between px-4 max-w-[800px] mx-auto z-10 pointer-events-none">
        <div className="flex gap-4">
            <div className="bg-black/60 backdrop-blur-md border-2 border-cyan-400/50 rounded-xl p-3 font-pixel text-3xl text-cyan-50 shadow-[0_0_15px_rgba(34,211,238,0.4)]">
            <span className="text-xs block text-cyan-400 font-bold -mb-1 tracking-widest">SCORE</span>
            {score}
            </div>
            {combo > 1 && (
                <div className="bg-purple-900/80 border-2 border-pink-400 rounded-xl p-3 font-pixel text-3xl text-pink-300 shadow-[0_0_15px_rgba(236,72,153,0.5)] animate-pulse">
                <span className="text-xs block text-pink-100 font-bold -mb-1 tracking-widest">COMBO</span>
                x{combo}
                </div>
            )}
        </div>
        
        <div className={`bg-black/60 backdrop-blur-md border-2 rounded-xl p-3 font-pixel text-3xl shadow-xl ${timeLeft < 10 ? 'text-red-400 border-red-500/80 animate-pulse' : 'text-white border-cyan-400/50'}`}>
           <span className="text-xs block text-gray-400 font-bold -mb-1 tracking-widest">TIME</span>
           {timeLeft}s
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="bg-black border-4 border-cyan-900 rounded-xl shadow-2xl max-w-full max-h-[70vh] object-contain image-pixelated"
        style={{
          boxShadow: '0 0 50px rgba(6, 182, 212, 0.3)'
        }}
      />

      {/* Mobile Controls */}
      <div className="flex md:hidden w-full justify-between px-8 mt-6 z-20 select-none">
        <button
          className="w-24 h-24 bg-cyan-900/30 backdrop-blur-md border border-cyan-400/30 text-cyan-100 rounded-full active:bg-cyan-400/40 active:scale-95 transition-all flex items-center justify-center text-5xl shadow-[0_0_20px_rgba(6,182,212,0.4)]"
          onTouchStart={() => handleTouch('left')}
          onMouseDown={() => handleTouch('left')}
        >
          ←
        </button>
        
        <button
          className="w-24 h-24 bg-cyan-900/30 backdrop-blur-md border border-cyan-400/30 text-cyan-100 rounded-full active:bg-cyan-400/40 active:scale-95 transition-all flex items-center justify-center text-5xl shadow-[0_0_20px_rgba(6,182,212,0.4)]"
          onTouchStart={() => handleTouch('right')}
          onMouseDown={() => handleTouch('right')}
        >
          →
        </button>
      </div>

      <div className="hidden md:block mt-4 text-cyan-200/80 font-pixel text-xl drop-shadow-[0_0_5px_rgba(6,182,212,0.8)] tracking-wider">
        ◄ Left / Right ► to Switch Lanes
      </div>
    </div>
  );
};
