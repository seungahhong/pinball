'use client';

import { useState, useCallback, useMemo, useId } from 'react';
import type { Participant } from '@/types/game';

interface NameInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (participants: Participant[]) => void;
  disabled: boolean;
}

export function parseNames(input: string): Participant[] {
  const lines = input
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);

  const result: Participant[] = [];

  for (const line of lines) {
    let name = line;
    let weight = 1;
    let count = 1;

    // weight: name/3
    const weightMatch = name.match(/^(.+?)\/(\d+)$/);
    if (weightMatch) {
      name = weightMatch[1].trim();
      weight = parseInt(weightMatch[2], 10);
    }

    // duplicate: name*3
    const dupMatch = name.match(/^(.+?)\*(\d+)$/);
    if (dupMatch) {
      name = dupMatch[1].trim();
      count = parseInt(dupMatch[2], 10);
    }

    for (let i = 0; i < count; i++) {
      result.push({ name, weight });
    }
  }

  return result;
}

export function NameInput({ value, onChange, onSubmit, disabled }: NameInputProps) {
  const inputId = useId();
  const errorId = useId();
  const [error, setError] = useState('');

  const handleSubmit = useCallback(() => {
    const participants = parseNames(value);
    if (participants.length < 2) {
      setError('2명 이상 입력해주세요');
      return;
    }
    setError('');
    onSubmit(participants);
  }, [value, onSubmit]);

  const count = useMemo(() => parseNames(value).length, [value]);

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={inputId} className="text-sm font-medium text-[#A0A0B0]">
        참가자 이름 <span className="text-[#00C4B3]">({count}명)</span>
      </label>
      <textarea
        id={inputId}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setError('');
        }}
        disabled={disabled}
        placeholder="이름을 입력하세요 (쉼표 또는 줄바꿈으로 구분)&#10;예: 홍길동, 김철수/3, 이영희*2"
        className="w-full h-32 p-3 bg-white/5 border border-white/10 rounded-lg text-sm
          placeholder:text-white/20 focus:outline-none focus:border-[#00C4B3]/50
          disabled:opacity-50 resize-none"
        aria-describedby={error ? errorId : undefined}
        aria-invalid={!!error}
      />
      {error && (
        <p id={errorId} className="text-xs text-[#FF4757]" role="alert">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={disabled || !value.trim()}
        className="w-full py-2.5 bg-[#00C4B3] hover:bg-[#00C4B3]/80 text-white font-semibold
          rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm"
      >
        참가자 등록
      </button>
    </div>
  );
}
