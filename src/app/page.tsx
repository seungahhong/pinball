'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import type { Participant, MarbleData, WinMode, SpecialMode } from '@/types/game';
import { maps } from '@/maps';
import { tokens } from '@/styles/tokens';
import { useGameEngine } from '@/hooks/useGameEngine';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Header } from '@/components/Header';
import { NameInput, parseNames } from '@/components/NameInput';
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
  const [specialMode, setSpecialMode] = useState<SpecialMode>('none');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
    setSpecialMode: setEngineSpecialMode,
    isShaking,
    isFlipping,
    scrollCamera,
    zoomCamera,
  } = useGameEngine();

  const participantCount = useMemo(() => parseNames(namesText).length, [namesText]);
  const selectedMapName = maps[selectedMapIndex].title;

  const handleMapChange = useCallback(
    (index: number) => {
      setSelectedMapIndex(index);
      setMap(maps[index]);
    },
    [setMap],
  );

  const handleSubmitNames = useCallback(
    (participants: Participant[]) => {
      setMap(maps[selectedMapIndex]);

      const marbleData: MarbleData[] = participants.map((p, i) => ({
        id: i,
        name: p.name,
        color: tokens.marble[i % tokens.marble.length],
        weight: p.weight,
      }));
      setMarbles(marbleData);
      setEngineWinMode(winMode, customRank);
      setIsMenuOpen(false);
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

  const handleSpecialModeChange = useCallback(
    (mode: SpecialMode) => {
      setSpecialMode(mode);
      setEngineSpecialMode(mode);
    },
    [setEngineSpecialMode],
  );

  const handleReset = useCallback(() => {
    handleMapChange(selectedMapIndex);
  }, [handleMapChange, selectedMapIndex]);

  useEffect(() => {
    if (!isMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isMenuOpen]);

  const settings = (
    <>
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
        specialMode={specialMode}
        onSpecialModeChange={handleSpecialModeChange}
      />
    </>
  );

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header
        isDark={isDark}
        onToggleTheme={handleToggleTheme}
        onMenuToggle={() => setIsMenuOpen((o) => !o)}
        summary={{
          mapName: selectedMapName,
          participantCount,
          winMode,
          specialMode,
        }}
        gameState={gameState}
        onShuffle={shuffle}
        onStart={start}
      />

      <main className="flex flex-1 overflow-hidden relative">
        <aside className="hidden md:flex w-80 flex-shrink-0 border-r border-white/10 p-4 overflow-y-auto flex-col gap-6">
          {settings}
        </aside>

        {isMenuOpen && (
          <div className="md:hidden fixed inset-0 z-40" role="dialog" aria-label="설정 메뉴">
            <button
              type="button"
              aria-label="메뉴 닫기"
              className="absolute inset-0 bg-black/60 animate-[fade-in_0.2s_ease-out]"
              onClick={() => setIsMenuOpen(false)}
            />
            <div className="absolute left-0 top-0 bottom-0 w-[85%] max-w-sm bg-[#1A1A2E] border-r border-white/10 p-4 overflow-y-auto flex flex-col gap-6 animate-[slide-in-left_0.25s_ease-out]">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white/80">설정</h2>
                <button
                  type="button"
                  onClick={() => setIsMenuOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/10"
                  aria-label="메뉴 닫기"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 18 18"
                    fill="none"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M4 4l10 10M14 4L4 14"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>
              {settings}
            </div>
          </div>
        )}

        <section className="flex-1 relative">
          <GameCanvas
            ref={canvasRef}
            isLoading={isLoading}
            error={error}
            isShaking={isShaking}
            isFlipping={isFlipping}
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
