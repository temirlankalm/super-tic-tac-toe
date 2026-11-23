'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Player, BoardWinner, TimeControl } from '@/types/game';

interface UseChessClockProps {
  currentPlayer: Player;
  winner: BoardWinner;
  isPaused: boolean;
  onTimeout: (timedOutPlayer: Player) => void;
}

export function useChessClock({
  currentPlayer,
  winner,
  isPaused,
  onTimeout,
}: UseChessClockProps) {
  const [timeControl, setTimeControlState] = useState<TimeControl>('off');
  const [timeX, setTimeX] = useState<number>(180);
  const [timeO, setTimeO] = useState<number>(180);

  const timeXRef = useRef<number>(180);
  const timeORef = useRef<number>(180);
  const timedOutRef = useRef<boolean>(false);
  const lastTickRef = useRef<number | null>(null);
  const onTimeoutRef = useRef(onTimeout);
  onTimeoutRef.current = onTimeout;

  // Sync refs with state when updated externally
  useEffect(() => {
    timeXRef.current = timeX;
  }, [timeX]);

  useEffect(() => {
    timeORef.current = timeO;
  }, [timeO]);

  // Restore saved preference
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ttt_time_control');
      if (saved) {
        if (saved === 'off') {
          setTimeControlState('off');
        } else {
          const parsed = parseInt(saved, 10);
          if ([60, 120, 180, 300].includes(parsed)) {
            setTimeControlState(parsed as TimeControl);
            setTimeX(parsed);
            setTimeO(parsed);
            timeXRef.current = parsed;
            timeORef.current = parsed;
          }
        }
      }
    } catch {
      // ignore localStorage errors
    }
  }, []);

  const resetClocks = useCallback(
    (customTc?: TimeControl) => {
      const targetTc = customTc !== undefined ? customTc : timeControl;
      const initialSeconds = targetTc === 'off' ? 180 : targetTc;
      setTimeX(initialSeconds);
      setTimeO(initialSeconds);
      timeXRef.current = initialSeconds;
      timeORef.current = initialSeconds;
      timedOutRef.current = false;
      lastTickRef.current = null;
    },
    [timeControl]
  );

  const setTimeControl = useCallback((tc: TimeControl) => {
    setTimeControlState(tc);
    try {
      localStorage.setItem('ttt_time_control', String(tc));
    } catch {
      // ignore
    }
    const initialSeconds = tc === 'off' ? 180 : tc;
    setTimeX(initialSeconds);
    setTimeO(initialSeconds);
    timeXRef.current = initialSeconds;
    timeORef.current = initialSeconds;
    timedOutRef.current = false;
    lastTickRef.current = null;
  }, []);

  // Timer loop with drift-free delta calculation and pure state updates
  useEffect(() => {
    if (timeControl === 'off' || winner !== null || isPaused) {
      lastTickRef.current = null;
      return;
    }

    lastTickRef.current = Date.now();

    const interval = setInterval(() => {
      if (timedOutRef.current) {
        clearInterval(interval);
        return;
      }

      const now = Date.now();
      const last = lastTickRef.current ?? now;
      const elapsed = (now - last) / 1000;
      lastTickRef.current = now;

      if (currentPlayer === 'X') {
        const next = Math.max(0, timeXRef.current - elapsed);
        timeXRef.current = next;
        setTimeX(next);

        if (next <= 0 && !timedOutRef.current) {
          timedOutRef.current = true;
          clearInterval(interval);
          onTimeoutRef.current('X');
        }
      } else {
        const next = Math.max(0, timeORef.current - elapsed);
        timeORef.current = next;
        setTimeO(next);

        if (next <= 0 && !timedOutRef.current) {
          timedOutRef.current = true;
          clearInterval(interval);
          onTimeoutRef.current('O');
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [timeControl, currentPlayer, winner, isPaused]);

  const syncClocks = useCallback((newTimeX: number, newTimeO: number) => {
    setTimeX(newTimeX);
    setTimeO(newTimeO);
    timeXRef.current = newTimeX;
    timeORef.current = newTimeO;
    timedOutRef.current = false;
    lastTickRef.current = Date.now();
  }, []);

  return {
    timeControl,
    setTimeControl,
    timeX,
    timeO,
    resetClocks,
    syncClocks,
  };
}
