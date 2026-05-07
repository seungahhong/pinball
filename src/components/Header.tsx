'use client';

interface HeaderProps {
  isDark: boolean;
  onToggleTheme: () => void;
}

export function Header({ isDark, onToggleTheme }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-white/10">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight">
          <span className="text-[#00C4B3]">wadiz</span>
          <span className="text-[#A0A0B0] font-normal text-lg ml-2">FE Team</span>
        </h1>
        <span className="text-xs text-[#A0A0B0] bg-white/5 px-2 py-0.5 rounded-full">
          Pinball Roulette
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
    </header>
  );
}
