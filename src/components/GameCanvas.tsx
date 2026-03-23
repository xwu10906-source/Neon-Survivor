import React, { useEffect, useRef } from 'react';
import { GameEngine } from '../game/engine';

interface GameCanvasProps {
  onScoreUpdate: (score: number, level: number) => void;
  onGameOver: (score: number) => void;
  onUpgradeAvailable: () => void;
  onTogglePause: () => void;
  engineRef: React.MutableRefObject<GameEngine | null>;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  onScoreUpdate,
  onGameOver,
  onUpgradeAvailable,
  onTogglePause,
  engineRef,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    
    // Set canvas size to window size
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    const engine = new GameEngine(canvas);
    engineRef.current = engine;
    
    engine.onScoreUpdate = onScoreUpdate;
    engine.onGameOver = onGameOver;
    engine.onUpgradeAvailable = onUpgradeAvailable;
    engine.onTogglePause = onTogglePause;

    engine.start();

    return () => {
      window.removeEventListener('resize', resize);
      engine.stop();
    };
  }, [onScoreUpdate, onGameOver, onUpgradeAvailable, onTogglePause, engineRef]);

  return (
    <canvas
      ref={canvasRef}
      className="block w-full h-full bg-[#0a0a0f] cursor-none"
    />
  );
};
