'use client';

import type { GoalEvent, GameState, WinMode } from '@/types/game';

interface ResultOverlayProps {
  gameState: GameState;
  winners: GoalEvent[];
  winMode: WinMode;
  customRank: number;
  resultMessage: string;
  onReset: () => void;
}

function getDisplayWinners(
  winners: GoalEvent[],
  winMode: WinMode,
  customRank: number,
): GoalEvent[] {
  if (winners.length === 0) return [];
  switch (winMode) {
    case 'first':
      return [winners[0]];
    case 'last':
      return [winners[winners.length - 1]];
    case 'custom':
      return winners.length >= customRank ? [winners[customRank - 1]] : [];
  }
}

export function ResultOverlay({
  gameState,
  winners,
  winMode,
  customRank,
  resultMessage,
  onReset,
}: ResultOverlayProps) {
  if (gameState !== 'finished' || winners.length === 0) return null;

  const displayWinners = getDisplayWinners(winners, winMode, customRank);
  const modeLabel =
    winMode === 'first' ? '첫 번째 도착' : winMode === 'last' ? '마지막 도착' : `${customRank}등`;

  return (
    <div
      className="absolute inset-0 flex items-center justify-center bg-black/60 z-20
        animate-[fade-in_0.3s_ease-out]"
      role="dialog"
      aria-label="게임 결과"
    >
      <div
        className="bg-[#16213E] border border-[#00C4B3]/30 rounded-2xl p-8 max-w-sm w-full
          mx-4 shadow-2xl shadow-[#00C4B3]/10 animate-[scale-in_0.4s_ease-out]"
      >
        <h2 className="text-center text-2xl font-bold text-[#FFD700] mb-2">
          {resultMessage || '결과 발표!'}
        </h2>
        <p className="text-center text-sm text-[#A0A0B0] mb-6">당첨 모드: {modeLabel}</p>
        <ol className="space-y-3" aria-label="당첨자">
          {displayWinners.map((w) => (
            <li
              key={`${w.marbleId}-${w.rank}`}
              className="flex items-center gap-3 p-4 bg-[#FFD700]/10 border border-[#FFD700]/30 rounded-lg"
            >
              <span className="text-2xl">🏆</span>
              <span className="text-lg font-bold text-[#FFD700]">{w.playerName}</span>
            </li>
          ))}
        </ol>
        <button
          type="button"
          onClick={onReset}
          className="w-full mt-6 py-3 bg-[#00C4B3] hover:bg-[#00C4B3]/80 text-white font-semibold
            rounded-lg transition-colors text-sm"
        >
          다시 하기
        </button>
      </div>
    </div>
  );
}
