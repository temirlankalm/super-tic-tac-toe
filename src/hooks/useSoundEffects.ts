'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  playPencilScratch,
  playClockClick,
  playSectorWin,
  playGameOver,
  triggerHaptic,
  getAudioContext,
} from '@/lib/sound';

export function useSoundEffects() {
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(true);

  // Restore user sound preference on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ttt_sound');
      if (saved === 'off') {
        setIsSoundEnabled(false);
      } else if (saved === 'on') {
        setIsSoundEnabled(true);
      }
    } catch {
      // ignore localStorage errors
    }
  }, []);

  const toggleSound = useCallback(() => {
    setIsSoundEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('ttt_sound', next ? 'on' : 'off');
      } catch {
        // ignore
      }
      // On user gesture unmute, warm up AudioContext
      if (next) {
        getAudioContext();
      }
      return next;
    });
  }, []);

  const playScratch = useCallback(
    (variant?: number) => {
      if (isSoundEnabled) {
        playPencilScratch(variant);
      }
    },
    [isSoundEnabled]
  );

  const playClock = useCallback(() => {
    if (isSoundEnabled) {
      playClockClick();
    }
  }, [isSoundEnabled]);

  const playWinSector = useCallback(() => {
    if (isSoundEnabled) {
      playSectorWin();
    }
  }, [isSoundEnabled]);

  const playGameVictory = useCallback(
    (isTie = false) => {
      if (isSoundEnabled) {
        playGameOver(isTie);
      }
    },
    [isSoundEnabled]
  );

  const haptic = useCallback((type: 'tap' | 'sector' | 'win') => {
    triggerHaptic(type);
  }, []);

  return {
    isSoundEnabled,
    toggleSound,
    playScratch,
    playClock,
    playWinSector,
    playGameVictory,
    haptic,
  };
}
