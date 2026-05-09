'use client';

import type { GameState, WinMode, SpecialMode } from '@/types/game';

interface HeaderSummary {
  mapName: string;
  participantCount: number;
  winMode: WinMode;
  specialMode: SpecialMode;
}

interface HeaderProps {
  isDark: boolean;
  onToggleTheme: () => void;
  onMenuToggle?: () => void;
  summary?: HeaderSummary;
  gameState?: GameState;
  onShuffle?: () => void;
  onStart?: () => void;
}

const winModeLabel: Record<WinMode, string> = {
  first: '첫 번째',
  last: '마지막',
  custom: '커스텀',
};

const specialModeLabel: Record<SpecialMode, string | null> = {
  none: null,
  mapFlip: '맵 뒤집기',
  gravityReverse: '중력 거스리기',
};

export function Header({
  isDark,
  onToggleTheme,
  onMenuToggle,
  summary,
  gameState,
  onShuffle,
  onStart,
}: HeaderProps) {
  const isReady = gameState === 'ready';
  const specialLabel = summary ? specialModeLabel[summary.specialMode] : null;

  return (
    <header className="border-b border-white/10">
      <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-6">
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          {onMenuToggle && (
            <button
              type="button"
              onClick={onMenuToggle}
              className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="메뉴 열기"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3 5h14M3 10h14M3 15h14"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          )}
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight whitespace-nowrap">
            <span className="text-[#00C4B3]">pinball</span>
            <span className="text-[#A0A0B0] font-normal text-sm md:text-lg ml-2">Roulette</span>
          </h1>
          <span className="hidden sm:inline text-xs text-[#A0A0B0] bg-white/5 px-2 py-0.5 rounded-full">
            Marble Run
          </span>
        </div>
        <button
          type="button"
          onClick={onToggleTheme}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors text-sm"
          aria-label={isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
        >
          {isDark ? '☀️' : '🌙'}
        </button>
      </div>
      {summary && (
        <div className="md:hidden px-4 pb-3 flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="px-2 py-0.5 rounded-full bg-[#00C4B3]/15 text-[#00C4B3] border border-[#00C4B3]/30">
              {summary.mapName}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/80">
              {summary.participantCount}명
            </span>
            <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/80">
              {winModeLabel[summary.winMode]}
            </span>
            {specialLabel && (
              <span className="px-2 py-0.5 rounded-full bg-[#FF6B35]/15 text-[#FF6B35] border border-[#FF6B35]/30">
                {specialLabel}
              </span>
            )}
          </div>
          {isReady && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onShuffle}
                className="flex-1 py-2 bg-white/10 hover:bg-white/15 rounded-lg text-sm font-medium transition-colors"
              >
                셔플
              </button>
              <button
                type="button"
                onClick={onStart}
                className="flex-1 py-2 bg-[#FF6B35] hover:bg-[#FF6B35]/80 text-white rounded-lg text-sm font-bold transition-colors"
              >
                시작!
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
