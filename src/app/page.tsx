'use client';

import { useState, useCallback } from 'react';
import type { Participant, MarbleData, WinMode } from '@/types/game';
import { maps } from '@/maps';
import { tokens } from '@/styles/tokens';
import { useGameEngine } from '@/hooks/useGameEngine';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Header } from '@/components/Header';
import { NameInput } from '@/components/NameInput';
import { ControlPanel } from '@/components/ControlPanel';
import { GameCanvas } from '@/components/GameCanvas';
import { ResultOverlay } from '@/components/ResultOverlay';

export default function Home() {
  const [isDark, setIsDark] = useState(true);
  const [namesText, setNamesText] = useLocalStorage('pinball_names', '');
  const [selectedMapIndex, setSelectedMapIndex] = useState(0);
  const [winMode, setWinMode] = useState<WinMode>('first');
  const [customRank, setCustomRank] = useState(1);
  const [switchEnabled, setSwitchEnabled] = useState(true);
  const [obstacleEnabled, setObstacleEnabled] = useState(true);
  const [resultMessage, setResultMessage] = useState('');

  const {
    canvasRef,
    gameState,
    winners,
    isLoading,
    error,
    setMap,
    setMarbles,
    start,
    shuffle,
    setWinMode: setEngineWinMode,
    setTheme,
    setSwitchEnabled: setEngineSwitchEnabled,
    setObstacleEnabled: setEngineObstacleEnabled,
    scrollCamera,
    zoomCamera,
  } = useGameEngine();

  const handleMapChange = useCallback(
    (index: number) => {
      setSelectedMapIndex(index);
      setMap(maps[index]);
    },
    [setMap],
  );

  const handleSubmitNames = useCallback(
    (participants: Participant[]) => {
      // Ensure map is loaded
      setMap(maps[selectedMapIndex]);

      const marbleData: MarbleData[] = participants.map((p, i) => ({
        id: i,
        name: p.name,
        color: tokens.marble[i % tokens.marble.length],
        weight: p.weight,
      }));
      setMarbles(marbleData);
      setEngineWinMode(winMode, customRank);
    },
    [selectedMapIndex, setMap, setMarbles, setEngineWinMode, winMode, customRank],
  );

  const handleWinModeChange = useCallback(
    (mode: WinMode) => {
      setWinMode(mode);
      setEngineWinMode(mode, customRank);
    },
    [setEngineWinMode, customRank],
  );

  const handleCustomRankChange = useCallback(
    (rank: number) => {
      setCustomRank(rank);
      setEngineWinMode(winMode, rank);
    },
    [setEngineWinMode, winMode],
  );

  const handleToggleTheme = useCallback(() => {
    setIsDark((prev) => {
      setTheme(!prev);
      return !prev;
    });
  }, [setTheme]);

  const handleSwitchToggle = useCallback(
    (enabled: boolean) => {
      setSwitchEnabled(enabled);
      setEngineSwitchEnabled(enabled);
    },
    [setEngineSwitchEnabled],
  );

  const handleObstacleToggle = useCallback(
    (enabled: boolean) => {
      setObstacleEnabled(enabled);
      setEngineObstacleEnabled(enabled);
    },
    [setEngineObstacleEnabled],
  );

  const handleReset = useCallback(() => {
    handleMapChange(selectedMapIndex);
  }, [handleMapChange, selectedMapIndex]);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header isDark={isDark} onToggleTheme={handleToggleTheme} />

      <main className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-80 flex-shrink-0 border-r border-white/10 p-4 overflow-y-auto flex flex-col gap-6">
          <NameInput
            value={namesText}
            onChange={setNamesText}
            onSubmit={handleSubmitNames}
            disabled={gameState === 'running'}
          />
          <ControlPanel
            gameState={gameState}
            winMode={winMode}
            customRank={customRank}
            selectedMapIndex={selectedMapIndex}
            switchEnabled={switchEnabled}
            obstacleEnabled={obstacleEnabled}
            onWinModeChange={handleWinModeChange}
            onCustomRankChange={handleCustomRankChange}
            onMapChange={handleMapChange}
            onShuffle={shuffle}
            onStart={start}
            onSwitchToggle={handleSwitchToggle}
            onObstacleToggle={handleObstacleToggle}
            resultMessage={resultMessage}
            onResultMessageChange={setResultMessage}
          />
        </aside>

        {/* Game area */}
        <section className="flex-1 relative">
          <GameCanvas
            ref={canvasRef}
            isLoading={isLoading}
            error={error}
            onScroll={scrollCamera}
            onZoom={zoomCamera}
          />
          <ResultOverlay
            gameState={gameState}
            winners={winners}
            winMode={winMode}
            customRank={customRank}
            resultMessage={resultMessage}
            onReset={handleReset}
          />
        </section>
      </main>
    </div>
  );
}
