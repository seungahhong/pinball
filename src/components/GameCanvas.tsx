'use client';

import { forwardRef, useEffect, useRef, useCallback } from 'react';

interface GameCanvasProps {
  isLoading: boolean;
  error: string | null;
  onScroll?: (deltaY: number) => void;
  onZoom?: (delta: number) => void;
}

export const GameCanvas = forwardRef<HTMLCanvasElement, GameCanvasProps>(function GameCanvas(
  { isLoading, error, onScroll, onZoom },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        onZoom?.(e.deltaY > 0 ? -2 : 2);
      } else {
        onScroll?.(e.deltaY);
      }
    },
    [onScroll, onZoom],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[400px]"
      role="img"
      aria-label="핀볼 게임 화면"
    >
      <canvas ref={ref} className="w-full h-full block" />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#1A1A2E]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-[#00C4B3] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-[#A0A0B0]">물리 엔진 로딩 중...</p>
          </div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#1A1A2E]">
          <div className="text-center p-6">
            <p className="text-[#FF4757] font-medium mb-2">엔진 초기화 실패</p>
            <p className="text-xs text-[#A0A0B0]">{error}</p>
          </div>
        </div>
      )}
      {!isLoading && !error && (
        <p className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-white/30 pointer-events-none">
          스크롤: 맵 탐색 / Ctrl+스크롤: 줌
        </p>
      )}
    </div>
  );
});
