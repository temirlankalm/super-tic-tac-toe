'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { GameOutcome, MoveStep, PlayerProfile, RecordAiGameResponse, RecordRoomGameResponse } from '@/lib/elo/types';
import { INITIAL_ELO } from '@/lib/elo/calculator';

const PLAYER_ID_STORAGE_KEY = 'ttt_player_id';
const RATING_STORAGE_KEY = 'ttt_player_rating';

export function getOrCreatePlayerId(): string {
  if (typeof window === 'undefined') return 'p_server';
  try {
    let id = localStorage.getItem(PLAYER_ID_STORAGE_KEY);
    if (!id) {
      id = `p_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem(PLAYER_ID_STORAGE_KEY, id);
    }
    return id;
  } catch {
    return `p_${Date.now()}`;
  }
}

export function useElo(
  nickname: string,
  isNicknameLoaded: boolean = true,
  onSyncServerNickname?: (serverNickname: string) => void
) {
  const [playerId, setPlayerId] = useState<string>('');
  const [rating, setRating] = useState<number>(INITIAL_ELO);
  const [games, setGames] = useState<number>(0);
  const [wins, setWins] = useState<number>(0);
  const [isProvisional, setIsProvisional] = useState<boolean>(true);
  const [lastDelta, setLastDelta] = useState<number | null>(null);
  const [isLastRated, setIsLastRated] = useState<boolean | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const nicknameRef = useRef(nickname);
  nicknameRef.current = nickname;
  const onSyncRef = useRef(onSyncServerNickname);
  onSyncRef.current = onSyncServerNickname;

  // Initialize playerId and fetch profile from server once nickname is ready
  useEffect(() => {
    const pid = getOrCreatePlayerId();
    setPlayerId(pid);

    try {
      const cachedRating = localStorage.getItem(RATING_STORAGE_KEY);
      if (cachedRating) {
        const parsed = parseInt(cachedRating, 10);
        if (!isNaN(parsed) && parsed >= 100) {
          setRating(parsed);
        }
      }
    } catch {}

    // Do not register profile on server before client auto-nickname has loaded from localStorage
    if (!isNicknameLoaded || !nickname || !pid) return;

    let cancelled = false;
    fetch(
      `/api/elo/profile?playerId=${encodeURIComponent(pid)}&nickname=${encodeURIComponent(nickname)}`,
      { cache: 'no-store' }
    )
      .then((res) => (res.ok ? res.json() : null))
      .then(async (data: PlayerProfile | null) => {
        if (!data || cancelled) return;
        let profile = data;

        // Keep client nickname and server Elo profile strictly synchronized (single source of truth)
        if (profile.nickname !== nickname) {
          try {
            const syncRes = await fetch('/api/elo/profile', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ playerId: pid, nickname }),
            });
            const syncJson = await syncRes.json().catch(() => ({ ok: false }));
            if (syncJson?.ok && syncJson?.player) {
              profile = syncJson.player as PlayerProfile;
            } else {
              // Server nickname differed due to collision; adopt server's canonical name
              onSyncRef.current?.(profile.nickname);
            }
          } catch {
            // Ignore transient network errors
          }
        }

        if (cancelled) return;
        setRating(profile.rating);
        setGames(profile.games);
        setWins(profile.wins);
        setIsProvisional(profile.isProvisional);
        try {
          localStorage.setItem(RATING_STORAGE_KEY, String(profile.rating));
        } catch {}
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [nickname, isNicknameLoaded]);

  // Record an AI game result with server-side validation
  const recordAiGame = useCallback(
    async (
      difficulty: 'easy' | 'medium' | 'hard' | 'qnet',
      result: GameOutcome,
      moves: MoveStep[],
      durationMs: number,
      humanPlayer: 'X' | 'O' = 'X'
    ): Promise<RecordAiGameResponse | null> => {
      const pid = playerId || getOrCreatePlayerId();
      setIsUpdating(true);

      try {
        const res = await fetch('/api/elo/record-ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            playerId: pid,
            nickname: nicknameRef.current || 'Player',
            difficulty,
            result,
            moves,
            durationMs,
            humanPlayer,
          }),
        });

        const data: RecordAiGameResponse = await res.json();
        if (data.ok && typeof data.ratingAfter === 'number') {
          setRating(data.ratingAfter);
          setLastDelta(data.delta ?? null);
          setIsLastRated(data.rated);
          if (typeof data.games === 'number') setGames(data.games);
          if (typeof data.wins === 'number') setWins(data.wins);
          if (typeof data.isProvisional === 'boolean') setIsProvisional(data.isProvisional);

          try {
            localStorage.setItem(RATING_STORAGE_KEY, String(data.ratingAfter));
          } catch {}
        } else {
          setLastDelta(null);
          setIsLastRated(false);
        }
        return data;
      } catch (err) {
        console.warn('[Elo] Failed to record AI game:', err);
        setLastDelta(null);
        setIsLastRated(false);
        return null;
      } finally {
        setIsUpdating(false);
      }
    },
    [playerId]
  );

  // Record an online room game result with bilateral consensus
  const recordRoomGame = useCallback(
    async (
      matchId: string,
      roomId: string,
      opponentId: string,
      opponentNickname: string,
      role: 'host' | 'guest',
      myPlayer: 'X' | 'O',
      result: GameOutcome,
      reason: 'normal' | 'timeout' | 'resignation' | 'forfeit' | 'agreement',
      movesCount: number
    ): Promise<RecordRoomGameResponse | null> => {
      const pid = playerId || getOrCreatePlayerId();
      setIsUpdating(true);

      try {
        const res = await fetch('/api/elo/record-room', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            matchId,
            roomId,
            playerId: pid,
            nickname: nicknameRef.current || 'Player',
            opponentId,
            opponentNickname,
            role,
            myPlayer,
            result,
            reason,
            movesCount,
            timestamp: Date.now(),
          }),
        });

        const data: RecordRoomGameResponse = await res.json();
        if (data.ok && data.status === 'completed' && typeof data.ratingAfter === 'number') {
          setRating(data.ratingAfter);
          setLastDelta(data.delta ?? null);
          setIsLastRated(data.rated);
          if (typeof data.games === 'number') setGames(data.games);
          if (typeof data.wins === 'number') setWins(data.wins);
          if (typeof data.isProvisional === 'boolean') setIsProvisional(data.isProvisional);

          try {
            localStorage.setItem(RATING_STORAGE_KEY, String(data.ratingAfter));
          } catch {}
        } else if (data.status === 'pending_opponent') {
          // Awaiting 2nd player
          setLastDelta(null);
          setIsLastRated(true);
        } else {
          setLastDelta(null);
          setIsLastRated(false);
        }
        return data;
      } catch (err) {
        console.warn('[Elo] Failed to record room game:', err);
        setLastDelta(null);
        setIsLastRated(false);
        return null;
      } finally {
        setIsUpdating(false);
      }
    },
    [playerId]
  );

  // Sync nickname change with server
  const syncNickname = useCallback(
    async (newName: string): Promise<{ ok: boolean; error?: string }> => {
      const pid = playerId || getOrCreatePlayerId();
      try {
        const res = await fetch('/api/elo/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playerId: pid, nickname: newName }),
        });
        const data = await res.json();
        if (data.ok) {
          return { ok: true };
        }
        return { ok: false, error: data.error };
      } catch {
        return { ok: true }; // Allow offline optimistic change
      }
    },
    [playerId]
  );

  const resetLastDelta = useCallback(() => {
    setLastDelta(null);
    setIsLastRated(null);
  }, []);

  return {
    playerId,
    rating,
    games,
    wins,
    isProvisional,
    lastDelta,
    isLastRated,
    isUpdating,
    recordAiGame,
    recordRoomGame,
    syncNickname,
    resetLastDelta,
  };
}
