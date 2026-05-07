'use client';

import type { GameState, WinMode } from '@/types/game';
import type { MapData } from '@/types/game';
import { maps } from '@/maps';

interface ControlPanelProps {
  gameState: GameState;
  winMode: WinMode;
  customRank: number;
  selectedMapIndex: number;
  switchEnabled: boolean;
  obstacleEnabled: boolean;
  resultMessage: string;
  onWinModeChange: (mode: WinMode) => void;
  onCustomRankChange: (rank: number) => void;
  onMapChange: (index: number) => void;
  onShuffle: () => void;
  onStart: () => void;
  onSwitchToggle: (enabled: boolean) => void;
  onObstacleToggle: (enabled: boolean) => void;
  onResultMessageChange: (message: string) => void;
}

export function ControlPanel({
  gameState,
  winMode,
  customRank,
  selectedMapIndex,
  switchEnabled,
  obstacleEnabled,
  resultMessage,
  onWinModeChange,
  onCustomRankChange,
  onMapChange,
  onShuffle,
  onStart,
  onSwitchToggle,
  onObstacleToggle,
  onResultMessageChange,
}: ControlPanelProps) {
  const isRunning = gameState === 'running';

  return (
    <div className="flex flex-col gap-4">
      {/* Map selector */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="map-select" className="text-sm font-medium text-[#A0A0B0]">
          맵 선택
        </label>
        <select
          id="map-select"
          value={selectedMapIndex}
          onChange={(e) => onMapChange(Number(e.target.value))}
          disabled={isRunning}
          className="w-full p-2.5 bg-white/5 border border-white/10 rounded-lg text-sm
            focus:outline-none focus:border-[#00C4B3]/50 disabled:opacity-50"
        >
          {maps.map((map: MapData, i: number) => (
            <option key={map.title} value={i} className="bg-[#1A1A2E]">
              {map.title}
            </option>
          ))}
        </select>
      </div>

      {/* Win mode */}
      <fieldset className="flex flex-col gap-1.5">
        <legend className="text-sm font-medium text-[#A0A0B0]">당첨 모드</legend>
        <div className="flex gap-2">
          {(
            [
              ['first', '첫 번째'],
              ['last', '마지막'],
              ['custom', '커스텀'],
            ] as const
          ).map(([mode, label]) => (
            <button
              key={mode}
              type="button"
              onClick={() => onWinModeChange(mode)}
              disabled={isRunning}
              className={`flex-1 py-2 text-xs rounded-lg border transition-colors
                ${
                  winMode === mode
                    ? 'bg-[#00C4B3]/20 border-[#00C4B3] text-[#00C4B3]'
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                }
                disabled:opacity-50`}
              aria-pressed={winMode === mode}
            >
              {label}
            </button>
          ))}
        </div>
        {winMode === 'custom' && (
          <input
            type="number"
            min={1}
            value={customRank}
            onChange={(e) => onCustomRankChange(Math.max(1, Number(e.target.value)))}
            disabled={isRunning}
            className="w-full p-2 bg-white/5 border border-white/10 rounded-lg text-sm
              focus:outline-none focus:border-[#00C4B3]/50"
            aria-label="당첨 순위"
          />
        )}
      </fieldset>

      {/* Effects toggles */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-[#A0A0B0]">효과</span>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={switchEnabled}
            onChange={(e) => onSwitchToggle(e.target.checked)}
            disabled={isRunning}
            className="accent-[#00C4B3]"
          />
          <span className="text-sm">공 스위칭</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={obstacleEnabled}
            onChange={(e) => onObstacleToggle(e.target.checked)}
            disabled={isRunning}
            className="accent-[#00C4B3]"
          />
          <span className="text-sm">동적 장애물</span>
        </label>
      </div>

      {/* Result message */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="result-message" className="text-sm font-medium text-[#A0A0B0]">
          결과 문구
        </label>
        <input
          id="result-message"
          type="text"
          value={resultMessage}
          onChange={(e) => onResultMessageChange(e.target.value)}
          placeholder="결과 발표!"
          disabled={isRunning}
          className="w-full p-2.5 bg-white/5 border border-white/10 rounded-lg text-sm
            placeholder:text-white/20 focus:outline-none focus:border-[#00C4B3]/50
            disabled:opacity-50"
        />
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onShuffle}
          disabled={gameState !== 'ready'}
          className="flex-1 py-2.5 bg-white/10 hover:bg-white/15 rounded-lg text-sm
            font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          셔플
        </button>
        <button
          type="button"
          onClick={onStart}
          disabled={gameState !== 'ready'}
          className="flex-1 py-2.5 bg-[#FF6B35] hover:bg-[#FF6B35]/80 text-white rounded-lg
            text-sm font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          시작!
        </button>
      </div>
    </div>
  );
}
