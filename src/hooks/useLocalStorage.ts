'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      }
    } catch {
      // ignore
    }
  }, [key]);

  const setValue = useCallback(
    (value: T) => {
      setStoredValue(value);
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch {
        // ignore
      }
    },
    [key],
  );

  return [storedValue, setValue];
}
