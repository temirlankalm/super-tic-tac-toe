'use client';

import { useState, useEffect, useCallback } from 'react';
import { generateRandomNickname, sanitizeNickname, validateNickname } from '@/lib/nickname';

const NICKNAME_STORAGE_KEY = 'ttt_nickname';
const PROMPTED_STORAGE_KEY = 'ttt_nickname_prompted';

export function useNickname() {
  const [nickname, setNicknameState] = useState<string>('Player');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFirstVisit, setIsFirstVisit] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(NICKNAME_STORAGE_KEY);
      const prompted = localStorage.getItem(PROMPTED_STORAGE_KEY);

      if (stored) {
        const clean = sanitizeNickname(stored);
        setNicknameState(clean);
        if (clean !== stored) {
          localStorage.setItem(NICKNAME_STORAGE_KEY, clean);
        }
        setIsLoaded(true);
      } else {
        // First visit: generate a friendly name and trigger prompt
        const initial = generateRandomNickname();
        setNicknameState(initial);
        localStorage.setItem(NICKNAME_STORAGE_KEY, initial);
        setIsLoaded(true);

        if (!prompted) {
          setIsFirstVisit(true);
          // Do not open blocking modal on first visit; show small hint instead
          setIsModalOpen(false);
        }
      }
    } catch {
      const fallback = generateRandomNickname();
      setNicknameState(fallback);
      setIsLoaded(true);
    }
  }, []);

  const saveNickname = useCallback((newName: string): { ok: boolean; errorKey?: string } => {
    const validation = validateNickname(newName);
    if (!validation.valid) {
      return { ok: false, errorKey: validation.errorKey };
    }

    try {
      localStorage.setItem(NICKNAME_STORAGE_KEY, validation.sanitized);
      localStorage.setItem(PROMPTED_STORAGE_KEY, 'true');
    } catch {}

    setNicknameState(validation.sanitized);
    setIsModalOpen(false);
    setIsFirstVisit(false);
    return { ok: true };
  }, []);

  const skipPrompt = useCallback(() => {
    try {
      localStorage.setItem(PROMPTED_STORAGE_KEY, 'true');
    } catch {}
    setIsModalOpen(false);
    setIsFirstVisit(false);
  }, []);

  const dismissFirstVisitHint = useCallback(() => {
    try {
      localStorage.setItem(PROMPTED_STORAGE_KEY, 'true');
    } catch {}
    setIsFirstVisit(false);
  }, []);

  const openModal = useCallback(() => {
    setIsFirstVisit(false);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const randomize = useCallback(() => {
    const random = generateRandomNickname();
    return random;
  }, []);

  const adoptNickname = useCallback((serverName: string) => {
    const clean = sanitizeNickname(serverName);
    try {
      localStorage.setItem(NICKNAME_STORAGE_KEY, clean);
    } catch {}
    setNicknameState(clean);
  }, []);

  return {
    nickname,
    isLoaded,
    isModalOpen,
    isFirstVisit,
    dismissFirstVisitHint,
    saveNickname,
    adoptNickname,
    skipPrompt,
    openModal,
    closeModal,
    randomize,
  };
}
