import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameCanvas } from './components/GameCanvas';
import { GameEngine } from './game/engine';
import { Play, RotateCcw, Zap, Shield, Crosshair, FastForward, Wind, ArrowRight } from 'lucide-react';

type GameState = 'menu' | 'playing' | 'gameover' | 'upgrading' | 'paused';

interface Upgrade {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  apply: (engine: GameEngine) => void;
}

const UPGRADES: Upgrade[] = [
  {
    id: 'spread',
    name: 'Multi-Shot',
    description: 'Fire an additional projectile',
    icon: <Zap className="w-8 h-8 text-yellow-400" />,
    apply: (engine) => { engine.player.spread += 1; }
  },
  {
    id: 'fireRate',
    name: 'Rapid Fire',
    description: 'Increase firing speed by 20%',
    icon: <FastForward className="w-8 h-8 text-blue-400" />,
    apply: (engine) => { engine.player.fireRate = Math.max(2, engine.player.fireRate * 0.8); }
  },
  {
    id: 'damage',
    name: 'High Caliber',
    description: 'Increase damage by 50%',
    icon: <Crosshair className="w-8 h-8 text-red-400" />,
    apply: (engine) => { engine.player.damage *= 1.5; }
  },
  {
    id: 'health',
    name: 'Armor Plating',
    description: 'Restore health and increase max health',
    icon: <Shield className="w-8 h-8 text-green-400" />,
    apply: (engine) => { 
      engine.player.maxHealth += 50; 
      engine.player.health = engine.player.maxHealth; 
    }
  },
  {
    id: 'dash',
    name: 'Thrusters',
    description: 'Reduce dash cooldown by 30%',
    icon: <Wind className="w-8 h-8 text-cyan-400" />,
    apply: (engine) => {
      engine.player.maxDashCooldown = Math.max(10, engine.player.maxDashCooldown * 0.7);
    }
  },
  {
    id: 'pierce',
    name: 'Piercing Rounds',
    description: 'Bullets pierce through an additional enemy',
    icon: <ArrowRight className="w-8 h-8 text-purple-400" />,
    apply: (engine) => {
      engine.player.pierce += 1;
    }
  }
];

export default function App() {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [highScore, setHighScore] = useState(0);
  const engineRef = useRef<GameEngine | null>(null);

  const [upgradeChoices, setUpgradeChoices] = useState<Upgrade[]>([]);

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setLevel(1);
    if (engineRef.current) {
      engineRef.current.score = 0;
      engineRef.current.level = 1;
      engineRef.current.player.health = engineRef.current.player.maxHealth;
      engineRef.current.isGameOver = false;
      engineRef.current.isPaused = false;
      engineRef.current.enemies = [];
      engineRef.current.bullets = [];
      engineRef.current.particles = [];
      engineRef.current.waveMultiplier = 1;
      engineRef.current.nextUpgradeScore = 500;
    }
  };

  const handleScoreUpdate = useCallback((newScore: number, newLevel: number) => {
    setScore(newScore);
    setLevel(newLevel);
  }, []);

  const handleGameOver = useCallback((finalScore: number) => {
    setGameState('gameover');
    setHighScore(prev => Math.max(prev, finalScore));
  }, []);

  const handleUpgradeAvailable = useCallback(() => {
    setGameState('upgrading');
    // Pick 3 random upgrades
    const shuffled = [...UPGRADES].sort(() => 0.5 - Math.random());
    setUpgradeChoices(shuffled.slice(0, 3));
  }, []);

  const handleTogglePause = useCallback(() => {
    setGameState(prev => {
      if (prev === 'playing') {
        if (engineRef.current) engineRef.current.isPaused = true;
        return 'paused';
      } else if (prev === 'paused') {
        if (engineRef.current) engineRef.current.isPaused = false;
        return 'playing';
      }
      return prev;
    });
  }, []);

  const selectUpgrade = (upgrade: Upgrade) => {
    if (engineRef.current) {
      upgrade.apply(engineRef.current);
      engineRef.current.isPaused = false;
    }
    setGameState('playing');
  };

  const healthBarRef = useRef<HTMLDivElement>(null);
  const dashBarRef = useRef<HTMLDivElement>(null);
  const vignetteRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (gameState !== 'playing') return;
    
    let animationId: number;
    const updateHUD = () => {
      if (engineRef.current) {
        if (healthBarRef.current) {
          const healthPct = Math.max(0, engineRef.current.player.health / engineRef.current.player.maxHealth) * 100;
          healthBarRef.current.style.width = `${healthPct}%`;
        }
        if (dashBarRef.current) {
          const dashPct = (1 - engineRef.current.player.dashCooldown / engineRef.current.player.maxDashCooldown) * 100;
          dashBarRef.current.style.width = `${dashPct}%`;
        }
        if (vignetteRef.current) {
          const isLowHealth = engineRef.current.player.health < engineRef.current.player.maxHealth * 0.3;
          vignetteRef.current.style.opacity = isLowHealth ? '1' : '0';
        }
      }
      animationId = requestAnimationFrame(updateHUD);
    };
    
    animationId = requestAnimationFrame(updateHUD);
    return () => cancelAnimationFrame(animationId);
  }, [gameState]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#0a0a0f] text-white font-sans selection:bg-cyan-500/30">
      {/* Game Canvas Layer */}
      <div className="absolute inset-0 z-0">
        <GameCanvas 
          onScoreUpdate={handleScoreUpdate}
          onGameOver={handleGameOver}
          onUpgradeAvailable={handleUpgradeAvailable}
          onTogglePause={handleTogglePause}
          engineRef={engineRef}
        />
      </div>

      {/* Low Health Vignette */}
      <div 
        ref={vignetteRef}
        className="absolute inset-0 pointer-events-none transition-opacity duration-300 z-0"
        style={{ boxShadow: 'inset 0 0 150px rgba(255, 0, 0, 0.4)', opacity: 0 }}
      />

      {/* HUD Layer */}
      {(gameState === 'playing' || gameState === 'paused') && (
        <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start z-10 pointer-events-none">
          <div className="flex flex-col gap-2">
            <div className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 drop-shadow-[0_0_10px_rgba(0,255,255,0.5)]">
              {score.toLocaleString()}
            </div>
            <div className="text-sm font-bold tracking-widest text-cyan-400/80 uppercase">
              Score
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <div className="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 drop-shadow-[0_0_10px_rgba(255,0,255,0.5)]">
              LVL {level}
            </div>
            <div className="w-48 h-3 bg-gray-900/80 rounded-full overflow-hidden border border-white/10 backdrop-blur-sm">
              <div 
                ref={healthBarRef}
                className="h-full bg-gradient-to-r from-green-400 to-emerald-500 shadow-[0_0_10px_rgba(0,255,0,0.5)] transition-all duration-75"
                style={{ width: '100%' }}
              />
            </div>
            <div className="w-48 h-1.5 bg-gray-900/80 rounded-full overflow-hidden border border-white/10 backdrop-blur-sm mt-1">
              <div 
                ref={dashBarRef}
                className="h-full bg-cyan-400 shadow-[0_0_10px_rgba(0,255,255,0.5)] transition-all duration-75"
                style={{ width: '100%' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* UI Overlays */}
      <AnimatePresence mode="wait">
        {gameState === 'menu' && (
          <motion.div 
            key="menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ y: 20, scale: 0.9 }}
              animate={{ y: 0, scale: 1 }}
              className="flex flex-col items-center gap-8"
            >
              <div className="text-center">
                <h1 className="text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 drop-shadow-[0_0_20px_rgba(0,255,255,0.4)] mb-4">
                  NEON SURVIVOR
                </h1>
                <p className="text-gray-400 text-lg tracking-wide">Survive the endless geometric horde.</p>
              </div>

              <div className="flex flex-col gap-4 text-sm text-gray-500 bg-white/5 p-6 rounded-2xl border border-white/10">
                <div className="flex items-center gap-3"><kbd className="px-2 py-1 bg-white/10 rounded text-gray-300 font-mono">WASD</kbd> to Move</div>
                <div className="flex items-center gap-3"><kbd className="px-2 py-1 bg-white/10 rounded text-gray-300 font-mono">MOUSE</kbd> to Aim</div>
                <div className="flex items-center gap-3"><kbd className="px-2 py-1 bg-white/10 rounded text-gray-300 font-mono">CLICK</kbd> to Shoot</div>
                <div className="flex items-center gap-3"><kbd className="px-2 py-1 bg-white/10 rounded text-gray-300 font-mono">SPACE</kbd> to Dash</div>
                <div className="flex items-center gap-3"><kbd className="px-2 py-1 bg-white/10 rounded text-gray-300 font-mono">ESC</kbd> to Pause</div>
              </div>

              <button 
                onClick={startGame}
                className="group relative px-8 py-4 bg-cyan-500 text-black font-black text-xl tracking-widest uppercase rounded-full overflow-hidden transition-transform hover:scale-105 active:scale-95"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform" />
                <span className="relative flex items-center gap-2">
                  <Play className="w-6 h-6" fill="currentColor" />
                  Start Game
                </span>
              </button>
            </motion.div>
          </motion.div>
        )}

        {gameState === 'gameover' && (
          <motion.div 
            key="gameover"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-red-950/80 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", bounce: 0.5 }}
              className="flex flex-col items-center gap-8 bg-black/50 p-12 rounded-3xl border border-red-500/30 shadow-[0_0_50px_rgba(255,0,0,0.2)]"
            >
              <h2 className="text-6xl font-black tracking-tighter text-red-500 drop-shadow-[0_0_15px_rgba(255,0,0,0.8)]">
                SYSTEM FAILURE
              </h2>
              
              <div className="flex flex-col items-center gap-2">
                <div className="text-gray-400 tracking-widest uppercase text-sm font-bold">Final Score</div>
                <div className="text-5xl font-mono text-white">{score.toLocaleString()}</div>
              </div>

              {highScore > 0 && (
                <div className="text-yellow-500/80 font-mono text-sm">
                  Best: {highScore.toLocaleString()}
                </div>
              )}

              <button 
                onClick={startGame}
                className="mt-4 group relative px-8 py-4 bg-red-600 text-white font-black text-xl tracking-widest uppercase rounded-full overflow-hidden transition-transform hover:scale-105 active:scale-95"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform" />
                <span className="relative flex items-center gap-2">
                  <RotateCcw className="w-6 h-6" />
                  Reboot System
                </span>
              </button>
            </motion.div>
          </motion.div>
        )}

        {gameState === 'upgrading' && (
          <motion.div 
            key="upgrading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md"
          >
            <motion.div 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-center mb-12"
            >
              <h2 className="text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 drop-shadow-[0_0_15px_rgba(255,165,0,0.5)]">
                SYSTEM UPGRADE
              </h2>
              <p className="text-gray-400 mt-2 tracking-widest uppercase text-sm">Select an enhancement</p>
            </motion.div>

            <div className="flex gap-6 max-w-4xl w-full px-6">
              {upgradeChoices.map((upgrade, idx) => (
                <motion.button
                  key={upgrade.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => selectUpgrade(upgrade)}
                  className="flex-1 flex flex-col items-center gap-4 p-8 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/50 rounded-2xl transition-all group hover:-translate-y-2 hover:shadow-[0_10px_30px_rgba(0,255,255,0.1)]"
                >
                  <div className="p-4 bg-black/30 rounded-full group-hover:scale-110 transition-transform">
                    {upgrade.icon}
                  </div>
                  <div className="text-xl font-bold text-white tracking-wide">{upgrade.name}</div>
                  <div className="text-sm text-gray-400 text-center leading-relaxed">
                    {upgrade.description}
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {gameState === 'paused' && (
          <motion.div 
            key="paused"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="flex flex-col items-center gap-8 bg-white/5 p-12 rounded-3xl border border-white/10"
            >
              <h2 className="text-6xl font-black tracking-tighter text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
                PAUSED
              </h2>
              
              <button 
                onClick={handleTogglePause}
                className="mt-4 group relative px-8 py-4 bg-white text-black font-black text-xl tracking-widest uppercase rounded-full overflow-hidden transition-transform hover:scale-105 active:scale-95"
              >
                <div className="absolute inset-0 bg-black/10 translate-y-full group-hover:translate-y-0 transition-transform" />
                <span className="relative flex items-center gap-2">
                  <Play className="w-6 h-6" fill="currentColor" />
                  Resume
                </span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
