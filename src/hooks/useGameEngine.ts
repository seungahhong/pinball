'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import type { GameState, MarbleData, MapData, WinMode, GoalEvent } from '@/types/game';
import { GameLoop } from '@/engine/GameLoop';
import { gameEvents } from '@/engine/EventBus';
import { Fanfare } from '@/audio/Fanfare';

interface UseGameEngineReturn {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  gameState: GameState;
  winners: GoalEvent[];
  isLoading: boolean;
  error: string | null;
  setMap: (map: MapData) => void;
  setMarbles: (data: MarbleData[]) => void;
  start: () => void;
  shuffle: () => void;
  setWinMode: (mode: WinMode, rank?: number) => void;
  setSpeed: (multiplier: number) => void;
  setTheme: (dark: boolean) => void;
  setSwitchEnabled: (enabled: boolean) => void;
  setObstacleEnabled: (enabled: boolean) => void;
  scrollCamera: (deltaY: number) => void;
  zoomCamera: (delta: number) => void;
}

export function useGameEngine(): UseGameEngineReturn {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameLoop | null>(null);
  const fanfareRef = useRef<Fanfare | null>(null);
  const initRef = useRef(false);

  const [gameState, setGameState] = useState<GameState>('idle');
  const [winners, setWinners] = useState<GoalEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initRef.current || !canvasRef.current) return;
    initRef.current = true;

    const canvas = canvasRef.current;
    const engine = new GameLoop(canvas);
    engineRef.current = engine;
    fanfareRef.current = new Fanfare();

    engine
      .init()
      .then(() => setIsLoading(false))
      .catch((err) => {
        setError(err.message || 'Failed to initialize physics engine');
        setIsLoading(false);
      });

    const unsubState = gameEvents.on('game:stateChange', ({ state }) => {
      setGameState(state);
    });

    const unsubGoal = gameEvents.on('goal:reached', (event) => {
      setWinners((prev) => [...prev, event]);
    });

    const unsubFinished = gameEvents.on('game:finished', () => {
      fanfareRef.current?.play();
    });

    const unsubSwitch = gameEvents.on('marble:switch', () => {
      fanfareRef.current?.playSwitch();
    });

    const handleResize = () => engine.resize();
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(canvas);

    return () => {
      unsubState();
      unsubGoal();
      unsubFinished();
      unsubSwitch();
      resizeObserver.disconnect();
      engine.destroy();
      initRef.current = false;
    };
  }, []);

  const setMap = useCallback((map: MapData) => {
    engineRef.current?.setMap(map);
    setWinners([]);
  }, []);

  const setMarbles = useCallback((data: MarbleData[]) => {
    fanfareRef.current?.resume();
    engineRef.current?.setMarbles(data);
    setWinners([]);
  }, []);

  const start = useCallback(() => {
    engineRef.current?.start();
  }, []);

  const shuffle = useCallback(() => {
    engineRef.current?.shuffle();
  }, []);

  const setWinMode = useCallback((mode: WinMode, rank?: number) => {
    engineRef.current?.setWinMode(mode, rank);
  }, []);

  const setSpeed = useCallback((multiplier: number) => {
    engineRef.current?.setSpeed(multiplier);
  }, []);

  const setTheme = useCallback((dark: boolean) => {
    engineRef.current?.setTheme(dark);
  }, []);

  const setSwitchEnabled = useCallback((enabled: boolean) => {
    engineRef.current?.setSwitchEnabled(enabled);
  }, []);

  const setObstacleEnabled = useCallback((enabled: boolean) => {
    engineRef.current?.setObstacleEnabled(enabled);
  }, []);

  const scrollCamera = useCallback((deltaY: number) => {
    engineRef.current?.scrollCamera(deltaY);
  }, []);

  const zoomCamera = useCallback((delta: number) => {
    engineRef.current?.zoomCamera(delta);
  }, []);

  return {
    canvasRef,
    gameState,
    winners,
    isLoading,
    error,
    setMap,
    setMarbles,
    start,
    shuffle,
    setWinMode,
    setSpeed,
    setTheme,
    setSwitchEnabled,
    setObstacleEnabled,
    scrollCamera,
    zoomCamera,
  };
}
