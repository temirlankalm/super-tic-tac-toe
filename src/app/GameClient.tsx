'use client';

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { BarChart3, Lock, X } from 'lucide-react';
import { analytics } from '@/lib/analytics/client';
import { MoveEvent, useSuperTicTacToe } from '@/hooks/useSuperTicTacToe';
import { useTheme } from '@/hooks/useTheme';
import { useChessClock } from '@/hooks/useChessClock';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { usePeerOnline } from '@/hooks/usePeerOnline';
import { SuperBoard } from '@/components/SuperBoard';
import { GameStatus } from '@/components/GameStatus';
import { ChessClockBar } from '@/components/ChessClockBar';
import { GameActionsBar } from '@/components/GameActionsBar';
import { RulesModal } from '@/components/RulesModal';
import { OnlineRoomModal } from '@/components/OnlineRoomModal';
import { OnlineRoomErrorCard } from '@/components/OnlineRoomErrorCard';
import { SettingsModal } from '@/components/SettingsModal';
import { DailyChallengeModal } from '@/components/DailyChallengeModal';
import { NicknameModal } from '@/components/NicknameModal';
import { useNickname } from '@/hooks/useNickname';
import { useElo } from '@/hooks/useElo';
import { MoveStep } from '@/lib/elo/types';
import { evaluateStaticState } from '@/lib/ai';
import {
  DailyStats,
  getDailyStats,
  recordDailyResult,
  getActiveDaily,
  saveActiveDaily,
  clearActiveDaily,
  getTodayDateString,
  getChallengeNumber,
} from '@/lib/daily';
import { AiDifficulty, GameMode, Player, SideChoice } from '@/types/game';
import { useTranslation } from '@/i18n/LanguageContext';

interface GameClientProps {
  initialRoomId?: string;
  initialIsAdmin?: boolean;
}

export function GameClient({ initialRoomId, initialIsAdmin = false }: GameClientProps) {
  const { t, language } = useTranslation();
  const [isAdminViewer, setIsAdminViewer] = useState(initialIsAdmin);
  const [adminUrl, setAdminUrl] = useState('https://admin.ttt.temr.dev');
  const [isAdminUnlockOpen, setIsAdminUnlockOpen] = useState(false);
  const [adminUnlockPass, setAdminUnlockPass] = useState('');
  const [adminUnlockErr, setAdminUnlockErr] = useState<string | null>(null);
  const [isAdminUnlockLoading, setIsAdminUnlockLoading] = useState(false);
  const footerTapRef = useRef<{ count: number; lastTime: number }>({ count: 0, lastTime: 0 });
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isOnlineModalOpen, setIsOnlineModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDailyModalOpen, setIsDailyModalOpen] = useState(false);
  const [dailyStats, setDailyStats] = useState<DailyStats>({
    currentStreak: 0,
    maxStreak: 0,
    lastPlayedDate: null,
    lastWonDate: null,
    history: [],
  });
  const [aiDrawNotice, setAiDrawNotice] = useState<string | null>(null);
  const [aiSidePreference, setAiSidePreferenceState] = useState<SideChoice>('X');
  const [pvpFirstPlayer, setPvpFirstPlayer] = useState<'p1' | 'p2'>('p1');
  const [creatorSidePreference, setCreatorSidePreference] = useState<SideChoice>('X');

  const {
    nickname,
    isLoaded: isNicknameLoaded,
    isFirstVisit,
    dismissFirstVisitHint,
    isModalOpen: isNicknameModalOpen,
    openModal: openNicknameModal,
    closeModal: closeNicknameModal,
    saveNickname,
    adoptNickname,
    skipPrompt: skipNicknamePrompt,
  } = useNickname();

  const elo = useElo(nickname, isNicknameLoaded, adoptNickname);

  useEffect(() => {
    setDailyStats(getDailyStats());
    analytics.pageview('/');
    if (
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ) {
      setAdminUrl('/admin');
    }
  }, []);

  // Secret keyboard shortcut (Alt+Shift+A) to unlock personal admin analytics button
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.shiftKey && e.code === 'KeyA') {
        e.preventDefault();
        if (isAdminViewer) {
          window.location.href = adminUrl;
        } else {
          setIsAdminUnlockOpen(true);
        }
      }
      if (e.key === 'Escape' && isAdminUnlockOpen) {
        setIsAdminUnlockOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isAdminViewer, adminUrl, isAdminUnlockOpen]);

  const handleFooterBrandClick = () => {
    const now = Date.now();
    if (now - footerTapRef.current.lastTime > 900) {
      footerTapRef.current = { count: 1, lastTime: now };
      return;
    }
    footerTapRef.current.count += 1;
    footerTapRef.current.lastTime = now;
    if (footerTapRef.current.count >= 3) {
      footerTapRef.current.count = 0;
      if (isAdminViewer) {
        window.location.href = adminUrl;
      } else {
        setIsAdminUnlockOpen(true);
      }
    }
  };

  const handleAdminUnlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUnlockPass.trim()) return;
    setIsAdminUnlockLoading(true);
    setAdminUnlockErr(null);
    try {
      const res = await fetch('/api/admin/badge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminUnlockPass.trim() }),
      });
      if (res.ok) {
        setIsAdminViewer(true);
        setAdminUnlockPass('');
        setIsAdminUnlockOpen(false);
      } else {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setAdminUnlockErr(
          data.error || (language === 'ru' ? 'неверный пароль' : 'invalid password')
        );
      }
    } catch {
      setAdminUnlockErr(language === 'ru' ? 'ошибка сети' : 'network error');
    } finally {
      setIsAdminUnlockLoading(false);
    }
  };

  const { theme, toggleTheme } = useTheme();

  const {
    isSoundEnabled,
    toggleSound,
    playScratch,
    playClock,
    playWinSector,
    playGameVictory,
    haptic,
  } = useSoundEffects();

  // State refs for clean peer callbacks without stale closures
  const gameStateRef = useRef<any>(null);
  const timeControlRef = useRef<any>(null);
  const timeXRef = useRef<number>(180);
  const timeORef = useRef<number>(180);
  const gameStartTimeRef = useRef<number>(Date.now());
  const recordedMatchIdRef = useRef<string | null>(null);
  const savedDifficultyRef = useRef<AiDifficulty | null>(null);
  const previousModeRef = useRef<GameMode>('ai');
  const [showHowtoHint, setShowHowtoHint] = useState(false);

  // Handle sound & haptic response for every move
  const handleMoveEvent = useCallback(
    ({ isSectorWon, isGameWon, isTie }: MoveEvent) => {
      // 1. Paper ASMR pencil scratch
      playScratch();

      // 2. Sector win / victory / haptic feedback
      if (isGameWon) {
        haptic('win');
        playGameVictory(false);
      } else if (isTie) {
        haptic('sector');
        playGameVictory(true);
      } else if (isSectorWon) {
        haptic('sector');
        playWinSector();
      } else {
        haptic('tap');
      }

      // 3. Analog clock click if timer is active
      if (!isGameWon && !isTie) {
        playClock();
      }
    },
    [playScratch, playWinSector, playGameVictory, playClock, haptic]
  );

  // Setup PeerJS online multiplayer hook
  const peerOnline = usePeerOnline({
    myNickname: nickname,
    myPlayerId: elo.playerId,
    isGameActive:
      Boolean(gameStateRef.current?.history?.length > 0) &&
      gameStateRef.current?.winner === null,
    onRemoteMove: (boardIdx, cellIdx, player, rTimeX, rTimeO) => {
      applyRemoteMove(boardIdx, cellIdx, player);
      if (rTimeX !== undefined && rTimeO !== undefined) {
        syncClocks(rTimeX, rTimeO);
      }
    },
    onInitSync: (msg) => {
      setTimeControl(msg.timeControl);
      syncClocks(msg.timeX, msg.timeO);
      syncState({
        cells: msg.cells,
        boardWinners: msg.boardWinners,
        boardWinningLines: msg.boardWinningLines,
        currentPlayer: msg.currentPlayer,
        activeBoard: msg.activeBoard,
      });
      if (msg.modifiers) {
        setModifiers(msg.modifiers);
      }
    },
    onTimeSync: (newTimeX, newTimeO) => {
      syncClocks(newTimeX, newTimeO);
    },
    getFullState: () => ({
      cells: gameStateRef.current.cells,
      boardWinners: gameStateRef.current.boardWinners,
      boardWinningLines: gameStateRef.current.boardWinningLines,
      activeBoard: gameStateRef.current.activeBoard,
      currentPlayer: gameStateRef.current.currentPlayer,
      history: gameStateRef.current.history,
      timeX: timeXRef.current,
      timeO: timeORef.current,
    }),
    onResyncState: (msg) => {
      syncState({
        cells: msg.cells,
        boardWinners: msg.boardWinners,
        boardWinningLines: msg.boardWinningLines,
        currentPlayer: msg.currentPlayer,
        activeBoard: msg.activeBoard,
        history: msg.history,
      });
      syncClocks(msg.timeX, msg.timeO);
      haptic('tap');
    },
    onRematchAccepted: (tc, nextSide) => {
      elo.resetLastDelta();
      recordedMatchIdRef.current = null;
      resetGame(nextSide);
      resetClocks(tc);
      haptic('win');
    },
    onRemoteResign: (remotePlayer) => {
      rawHandleResign(remotePlayer);
      playGameVictory(false);
      haptic('win');
    },
    onDrawAccepted: () => {
      rawHandleDraw();
      playGameVictory(true);
      haptic('sector');
    },
    onOpponentDisconnected: () => {
      playClock();
      haptic('tap');
    },
    onOpponentForfeit: () => {
      // 30s disconnect grace period expired: award technical victory to remaining player
      const myPlayer: Player = peerOnline.myPlayer || (peerOnline.role === 'host' ? 'X' : 'O');
      const timedOutOpponent: Player = myPlayer === 'X' ? 'O' : 'X';
      rawHandleTimeout(timedOutOpponent);
      haptic('tap');

      if (peerOnline.roomId) {
        const matchId = peerOnline.currentMatchId || `${peerOnline.roomId}_m1`;
        recordedMatchIdRef.current = matchId;
        const oppId = peerOnline.opponentPlayerId || `opp_${peerOnline.roomId}`;
        const oppNick = peerOnline.opponentNickname || (language === 'ru' ? 'Соперник' : 'Opponent');
        elo.recordRoomGame(
          matchId,
          peerOnline.roomId,
          oppId,
          oppNick,
          peerOnline.role || 'host',
          myPlayer,
          'win',
          'forfeit',
          gameStateRef.current?.history?.length || 0
        );
      }
    },
    onConnected: () => {
      if (peerOnline.role === 'host') {
        peerOnline.sendMessage({
          type: 'INIT',
          timeControl: timeControlRef.current,
          cells: gameStateRef.current.cells,
          boardWinners: gameStateRef.current.boardWinners,
          boardWinningLines: gameStateRef.current.boardWinningLines,
          currentPlayer: gameStateRef.current.currentPlayer,
          activeBoard: gameStateRef.current.activeBoard,
          timeX: timeXRef.current,
          timeO: timeORef.current,
          modifiers: gameStateRef.current.modifiers,
          hostPlayer: peerOnline.myPlayer || 'X',
          hostNickname: nickname,
          hostPlayerId: elo.playerId,
          matchNumber: 1,
        });
      }
    },
  });

  const {
    gameState,
    speedBlitzTime,
    handleCellClick,
    applyRemoteMove,
    syncState,
    resetGame,
    setHumanPlayer,
    undoMove,
    setGameMode,
    toggleGameMode,
    setDifficulty,
    toggleModifier,
    setModifiers,
    handleTimeout: rawHandleTimeout,
    handleResign: rawHandleResign,
    handleDraw: rawHandleDraw,
  } = useSuperTicTacToe({
    onMove: handleMoveEvent,
    onlineRole: peerOnline.role,
    onlinePlayer: peerOnline.myPlayer,
    isOnlineConnected: peerOnline.status === 'connected',
    // Remaining clock of `player` in ms, or null when there is no time control (qnet budgets by it).
    getClockMs: (player) =>
      timeControlRef.current === 'off' || timeControlRef.current === null
        ? null
        : (player === 'X' ? timeXRef.current : timeORef.current) * 1000,
    onLocalMove: (boardIdx, cellIdx, player) => {
      if (gameStateRef.current?.gameMode === 'online') {
        peerOnline.sendMessage({
          type: 'MOVE',
          boardIdx,
          cellIdx,
          player,
          timeX: timeXRef.current,
          timeO: timeORef.current,
        });
      }
    },
  });

  // Keep refs updated for peer callbacks
  gameStateRef.current = gameState;

  const handleTimeout = useCallback(
    (timedOutPlayer: Player) => {
      rawHandleTimeout(timedOutPlayer);
      playClock();
      haptic('tap');
    },
    [rawHandleTimeout, playClock, haptic]
  );

  const hasGameStarted = gameState.history.length > 0;
  const isClockPaused =
    !hasGameStarted ||
    isRulesOpen ||
    isSettingsOpen ||
    isDailyModalOpen ||
    (gameState.gameMode === 'online' && peerOnline.status !== 'connected');

  const {
    timeControl,
    setTimeControl,
    timeX,
    timeO,
    resetClocks,
    syncClocks,
  } = useChessClock({
    currentPlayer: gameState.currentPlayer,
    winner: gameState.winner,
    isPaused: isClockPaused,
    onTimeout: handleTimeout,
  });

  timeControlRef.current = timeControl;
  timeXRef.current = timeX;
  timeORef.current = timeO;

  // Load saved AI side choice preference from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('ttt_ai_side') as SideChoice | null;
      if (stored === 'X' || stored === 'O' || stored === 'random') {
        setAiSidePreferenceState(stored);
        if (stored === 'O') {
          setHumanPlayer('O');
        } else if (stored === 'random') {
          const randSide: Player = Math.random() < 0.5 ? 'X' : 'O';
          setHumanPlayer(randSide);
        }
      }
    } catch {}
  }, [setHumanPlayer]);

  const handleSelectAiSide = useCallback(
    (choice: SideChoice) => {
      setAiSidePreferenceState(choice);
      try {
        localStorage.setItem('ttt_ai_side', choice);
      } catch {}
      const targetSide: Player =
        choice === 'random' ? (Math.random() < 0.5 ? 'X' : 'O') : choice;
      setHumanPlayer(targetSide);
      resetClocks();
      elo.resetLastDelta();
      haptic('tap');
    },
    [setHumanPlayer, resetClocks, elo, haptic]
  );

  const handleTogglePvpFirstPlayer = useCallback(() => {
    setPvpFirstPlayer((prev) => (prev === 'p1' ? 'p2' : 'p1'));
    resetGame();
    resetClocks();
    haptic('tap');
  }, [resetGame, resetClocks, haptic]);

  const handleSelectCreatorSide = useCallback(
    (choice: SideChoice) => {
      setCreatorSidePreference(choice);
      const resolved: Player =
        choice === 'random' ? (Math.random() < 0.5 ? 'X' : 'O') : choice;
      peerOnline.setHostSide(resolved);
      haptic('tap');
    },
    [peerOnline, haptic]
  );

  // Track daily challenge progress, persistence, and completion
  const dailyCompletedRef = useRef<boolean>(false);
  useEffect(() => {
    if (gameState.gameMode === 'daily') {
      if (gameState.winner !== null && !dailyCompletedRef.current) {
        dailyCompletedRef.current = true;
        clearActiveDaily();
        const isWon =
          gameState.winner !== null &&
          gameState.winner !== 'TIE' &&
          gameState.winner === gameState.humanPlayer;
        const updated = recordDailyResult(
          isWon,
          gameState.history.length,
          gameState.boardWinners
        );
        setDailyStats(updated);
        analytics.dailyPlayed(isWon, gameState.history.length, getChallengeNumber(getTodayDateString()));
        // Prompt share modal shortly after victory animation
        setTimeout(() => {
          setIsDailyModalOpen(true);
        }, 1200);
      } else if (gameState.winner === null && gameState.history.length > 0) {
        saveActiveDaily({
          date: getTodayDateString(),
          cells: gameState.cells,
          boardWinners: gameState.boardWinners,
          boardWinningLines: gameState.boardWinningLines,
          currentPlayer: gameState.currentPlayer,
          activeBoard: gameState.activeBoard,
          historyLength: gameState.history.length,
        });
      }
    } else {
      dailyCompletedRef.current = false;
    }
  }, [
    gameState.gameMode,
    gameState.winner,
    gameState.history.length,
    gameState.boardWinners,
    gameState.cells,
    gameState.boardWinningLines,
    gameState.currentPlayer,
    gameState.activeBoard,
  ]);

  // Track game start (on first move) and game end
  const prevHistoryLenRef = useRef<number>(0);
  const prevWinnerRef = useRef<string | null>(null);

  useEffect(() => {
    // Game start: first move placed
    if (gameState.history.length === 1 && prevHistoryLenRef.current === 0) {
      gameStartTimeRef.current = Date.now();
      recordedMatchIdRef.current = null;
      elo.resetLastDelta();
      analytics.gameStart(
        gameState.gameMode,
        gameState.gameMode === 'ai' ? gameState.difficulty : undefined,
        peerOnline.roomId || undefined
      );

      try {
        const seen = localStorage.getItem('ttt_howto_hint');
        if (!seen) {
          setShowHowtoHint(true);
        }
      } catch {}
    }
    prevHistoryLenRef.current = gameState.history.length;

    // Game end: winner changed from null
    if (gameState.winner !== null && prevWinnerRef.current === null) {
      const myPlayer: Player =
        gameState.gameMode === 'ai' || gameState.gameMode === 'daily'
          ? (gameState.humanPlayer || 'X')
          : (peerOnline.myPlayer || (peerOnline.role === 'host' ? 'X' : 'O'));

      const result: 'win' | 'loss' | 'draw' =
        gameState.winner === 'TIE'
          ? 'draw'
          : gameState.winner === myPlayer
          ? 'win'
          : 'loss';

      analytics.gameEnd(result, gameState.gameMode, gameState.history.length);

      // Elo Rating Updates
      if (gameState.gameMode === 'ai') {
        // AI Games: only count normal finishes (not timed-out games)
        if (gameState.winReason !== 'timeout') {
          const moves: MoveStep[] = [];
          for (let i = 1; i < gameState.history.length; i++) {
            const m = gameState.history[i].lastMove;
            if (m) moves.push({ boardIdx: m.boardIdx, cellIdx: m.cellIdx, player: m.player });
          }
          if (gameState.lastMove) {
            moves.push({
              boardIdx: gameState.lastMove.boardIdx,
              cellIdx: gameState.lastMove.cellIdx,
              player: gameState.lastMove.player,
            });
          }
          const durationMs = Math.max(1000, Date.now() - gameStartTimeRef.current);
          elo.recordAiGame(
            gameState.difficulty,
            result,
            moves,
            durationMs,
            gameState.humanPlayer
          );
        }
      } else if (gameState.gameMode === 'online' && peerOnline.roomId) {
        const matchId = peerOnline.currentMatchId || `${peerOnline.roomId}_m1`;
        if (recordedMatchIdRef.current !== matchId) {
          recordedMatchIdRef.current = matchId;
          const reason =
            gameState.winReason === 'timeout'
              ? 'timeout'
              : gameState.winReason === 'resignation'
              ? 'resignation'
              : gameState.winReason === 'agreement'
              ? 'agreement'
              : 'normal';
          const oppId = peerOnline.opponentPlayerId || `opp_${peerOnline.roomId}`;
          const oppNick = peerOnline.opponentNickname || (language === 'ru' ? 'Соперник' : 'Opponent');

          elo.recordRoomGame(
            matchId,
            peerOnline.roomId,
            oppId,
            oppNick,
            peerOnline.role || 'host',
            myPlayer,
            result,
            reason,
            gameState.history.length
          );
        }
      }
    }
    prevWinnerRef.current = gameState.winner;
  }, [
    gameState.winner,
    gameState.history,
    gameState.lastMove,
    gameState.gameMode,
    gameState.difficulty,
    gameState.humanPlayer,
    gameState.winReason,
    peerOnline.roomId,
    peerOnline.currentMatchId,
    peerOnline.myPlayer,
    peerOnline.role,
    peerOnline.opponentPlayerId,
    peerOnline.opponentNickname,
    language,
    elo,
  ]);

  const dismissHowtoHint = useCallback(() => {
    setShowHowtoHint(false);
    try {
      localStorage.setItem('ttt_howto_hint', 'seen');
    } catch {}
  }, []);

  const liveAnnouncement = useMemo(() => {
    if (gameState.winner !== null) {
      if (gameState.winner === 'TIE') {
        return language === 'ru' ? 'Игра окончена. Ничья.' : 'Game over. Draw.';
      }
      return language === 'ru'
        ? `Игра окончена. Победитель: ${gameState.winner}`
        : `Game over. Winner: ${gameState.winner}`;
    }
    if (gameState.gameMode === 'online') {
      if (peerOnline.status === 'reconnecting') {
        return language === 'ru' ? 'Переподключение к комнате...' : 'Reconnecting to room...';
      }
      if (peerOnline.joinError) {
        return language === 'ru' ? 'Ошибка подключения к комнате' : 'Room connection error';
      }
    }
    if (gameState.isAiThinking) {
      return language === 'ru' ? 'ИИ думает...' : 'AI is thinking...';
    }
    return language === 'ru'
      ? `Ход: ${gameState.currentPlayer}`
      : `Turn: ${gameState.currentPlayer}`;
  }, [
    gameState.winner,
    gameState.gameMode,
    gameState.currentPlayer,
    gameState.isAiThinking,
    peerOnline.status,
    peerOnline.joinError,
    language,
  ]);

  const isAnyModalOpen =
    isRulesOpen ||
    isOnlineModalOpen ||
    isSettingsOpen ||
    isDailyModalOpen ||
    isNicknameModalOpen;

  // Start guest timeout only after any modal closes
  const wasAnyModalOpenRef = useRef(isAnyModalOpen);
  useEffect(() => {
    if (wasAnyModalOpenRef.current && !isAnyModalOpen) {
      if (peerOnline.status === 'connecting' && peerOnline.role === 'guest') {
        peerOnline.startGuestTimeout(20000);
      }
    }
    wasAnyModalOpenRef.current = isAnyModalOpen;
  }, [isAnyModalOpen, peerOnline]);

  // Remove ?room= from URL when join error occurs
  useEffect(() => {
    if (peerOnline.joinError) {
      if (typeof window !== 'undefined' && window.location.search.includes('room=')) {
        const url = new URL(window.location.href);
        url.searchParams.delete('room');
        window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
      }
    }
  }, [peerOnline.joinError]);

  // Detect ?room=xxxx query param or initialRoomId on mount to join room
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room') || initialRoomId;
    if (roomParam) {
      setGameMode('online');
      peerOnline.joinRoom(roomParam, 'guest', undefined, isAnyModalOpen);
      setIsOnlineModalOpen(false);
    }
  }, [initialRoomId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleReset = () => {
    elo.resetLastDelta();
    recordedMatchIdRef.current = null;
    if (gameState.gameMode === 'online') {
      if (gameState.history.length > 0 || gameState.winner !== null) {
        peerOnline.requestRematch();
      } else {
        resetGame();
        resetClocks();
      }
    } else if (gameState.gameMode === 'daily') {
      if (gameState.history.length > 0 && gameState.winner === null) {
        if (
          typeof window !== 'undefined' &&
          !window.confirm(t.alerts.confirmResignDaily)
        ) {
          return;
        }
        const updated = recordDailyResult(
          false,
          gameState.history.length,
          gameState.boardWinners
        );
        setDailyStats(updated);
        clearActiveDaily();
      }
      resetGame();
      resetClocks('off');
    } else if (gameState.gameMode === 'ai') {
      const nextSide: Player =
        aiSidePreference === 'random'
          ? (Math.random() < 0.5 ? 'X' : 'O')
          : aiSidePreference;
      resetGame(nextSide);
      resetClocks();
    } else {
      resetGame();
      resetClocks();
    }
    haptic('tap');
  };

  const handleSelectMode = (targetMode: GameMode) => {
    if (gameState.gameMode === targetMode) return;
    analytics.gameMode(targetMode);
    elo.resetLastDelta();
    recordedMatchIdRef.current = null;

    if (
      gameState.gameMode === 'daily' &&
      gameState.history.length > 0 &&
      gameState.winner === null
    ) {
      if (
        typeof window !== 'undefined' &&
        !window.confirm(t.alerts.confirmLeaveDaily)
      ) {
        return;
      }
      const updated = recordDailyResult(
        false,
        gameState.history.length,
        gameState.boardWinners
      );
      setDailyStats(updated);
      clearActiveDaily();
    }

    if (savedDifficultyRef.current && targetMode === 'ai') {
      setDifficulty(savedDifficultyRef.current);
      savedDifficultyRef.current = null;
    }

    if (targetMode === 'online' && gameState.gameMode !== 'online') {
      previousModeRef.current =
        gameState.gameMode === 'daily' ? 'ai' : gameState.gameMode;
    }

    setGameMode(targetMode);
    resetClocks();
    haptic('tap');

    if (targetMode === 'online') {
      if (peerOnline.status === 'idle') {
        const resolved: Player =
          creatorSidePreference === 'random'
            ? (Math.random() < 0.5 ? 'X' : 'O')
            : creatorSidePreference;
        peerOnline.createRoom(resolved);
      }
      setIsOnlineModalOpen(true);
    } else {
      peerOnline.leaveRoom();
    }
  };

  const handleToggleMode = () => {
    const nextMode =
      gameState.gameMode === 'ai'
        ? 'pvp'
        : gameState.gameMode === 'pvp'
        ? 'online'
        : 'ai';
    handleSelectMode(nextMode);
  };

  // Daily Challenge Start from Modal
  const handleStartDailyMatch = () => {
    savedDifficultyRef.current = gameState.difficulty;
    setGameMode('daily');
    setDifficulty('medium');
    dailyCompletedRef.current = false;
    const active = getActiveDaily();
    if (active) {
      syncState({
        cells: active.cells,
        boardWinners: active.boardWinners,
        boardWinningLines: active.boardWinningLines,
        currentPlayer: active.currentPlayer,
        activeBoard: active.activeBoard,
      });
    } else {
      resetGame();
    }
    resetClocks('off');
    setIsDailyModalOpen(false);
    haptic('tap');
  };

  const handleOpenOnlineModal = () => {
    if (peerOnline.status === 'idle') {
      const resolved: Player =
        creatorSidePreference === 'random'
          ? (Math.random() < 0.5 ? 'X' : 'O')
          : creatorSidePreference;
      peerOnline.createRoom(resolved);
    }
    setIsOnlineModalOpen(true);
  };

  const handleLeaveRoom = () => {
    peerOnline.leaveRoom();
    const restoreMode = previousModeRef.current === 'online' ? 'ai' : previousModeRef.current;
    setGameMode(restoreMode);
    resetClocks();
    setIsOnlineModalOpen(false);
    if (typeof window !== 'undefined' && window.history.replaceState) {
      const url = new URL(window.location.href);
      url.searchParams.delete('room');
      window.history.replaceState({}, '', url.pathname);
    }
  };

  const handleJoinByCode = (targetRoomId: string) => {
    setGameMode('online');
    peerOnline.joinRoom(targetRoomId);
    if (typeof window !== 'undefined' && window.history.replaceState) {
      const url = new URL(window.location.href);
      url.searchParams.set('room', targetRoomId);
      window.history.replaceState({}, '', url.toString());
    }
  };

  const handleCreateRoom = (assignedPlayer?: Player) => {
    const resolved: Player =
      assignedPlayer ||
      (creatorSidePreference === 'random'
        ? (Math.random() < 0.5 ? 'X' : 'O')
        : creatorSidePreference);
    peerOnline.createRoom(resolved);
  };

  const handleRequestRematch = () => {
    peerOnline.requestRematch();
    haptic('tap');
  };

  const handleAcceptRematch = () => {
    elo.resetLastDelta();
    recordedMatchIdRef.current = null;
    peerOnline.acceptRematch(timeControl);
    resetGame();
    resetClocks(timeControl);
    haptic('win');
  };

  const handleResign = () => {
    if (gameState.gameMode === 'online') {
      const myPlayer: Player = peerOnline.myPlayer || (peerOnline.role === 'host' ? 'X' : 'O');
      peerOnline.resignOnline();
      rawHandleResign(myPlayer);
    } else if (gameState.gameMode === 'ai' || gameState.gameMode === 'daily') {
      rawHandleResign(gameState.humanPlayer || 'X');
    } else {
      rawHandleResign(gameState.currentPlayer);
    }
    haptic('tap');
  };

  const handleOfferDraw = () => {
    if (gameState.gameMode === 'online') {
      peerOnline.offerDrawOnline();
      haptic('tap');
    } else if (gameState.gameMode === 'ai' || gameState.gameMode === 'daily') {
      if (gameState.history.length < 10) {
        return;
      }
      const aiPlayer: Player = (gameState.humanPlayer || 'X') === 'X' ? 'O' : 'X';
      const score = evaluateStaticState(gameState, aiPlayer);
      if (Math.abs(score) > 150) {
        setAiDrawNotice(t.alerts.aiDeclineDraw);
        setTimeout(() => setAiDrawNotice(null), 3000);
        haptic('tap');
      } else {
        rawHandleDraw();
        playGameVictory(true);
        haptic('sector');
      }
    } else {
      rawHandleDraw();
      playGameVictory(true);
      haptic('sector');
    }
  };

  const handleAcceptDraw = () => {
    peerOnline.acceptDrawOnline();
    rawHandleDraw();
    playGameVictory(true);
    haptic('sector');
  };

  const handleDeclineDraw = () => {
    peerOnline.declineDrawOnline();
    haptic('tap');
  };

  const handleUndo = () => {
    undoMove();
    haptic('tap');
  };

  const handleChallengeFriend = async () => {
    let targetRoom = peerOnline.roomId;
    if (!targetRoom) {
      targetRoom = await peerOnline.createRoom();
      analytics.roomCreated(targetRoom);
    }
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://ttt.temr.dev';
    const roomUrl = `${origin}/?room=${targetRoom}`;

    analytics.buttonClick('challenge_a_friend', { roomId: targetRoom });

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: t.alerts.shareChallengeTitle,
          text: t.alerts.shareChallengeText,
          url: roomUrl,
        });
        analytics.roomLinkShared('share', targetRoom);
        return;
      } catch {
        // User cancelled or share failed, fallback to modal
      }
    }

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(roomUrl);
        analytics.roomLinkShared('copy', targetRoom);
      }
    } catch {}

    setIsOnlineModalOpen(true);
  };

  const activeModifiersCount = Object.values(gameState.modifiers || {}).filter(Boolean).length;

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 max-w-xl mx-auto w-full pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      {/* Top Status & Game Setup Bar */}
      <GameStatus
        gameState={gameState}
        theme={theme}
        timeControl={timeControl}
        isSoundEnabled={isSoundEnabled}
        onlineRole={peerOnline.role}
        onlinePlayer={peerOnline.myPlayer}
        connectionStatus={peerOnline.status}
        joinError={peerOnline.joinError}
        roomId={peerOnline.roomId}
        drawOfferedByOpponent={peerOnline.drawOfferedByOpponent}
        myDrawOffered={peerOnline.myDrawOffered}
        drawDeclinedNotice={peerOnline.drawDeclinedNotice}
        rematchSwappedNotice={peerOnline.rematchSwappedNotice}
        dailyStreak={dailyStats.currentStreak}
        activeModifiersCount={activeModifiersCount}
        disconnectGraceSeconds={peerOnline.disconnectGraceSeconds}
        nickname={nickname}
        opponentNickname={peerOnline.opponentNickname}
        rating={elo.rating}
        isProvisional={elo.isProvisional}
        aiSidePreference={aiSidePreference}
        humanPlayer={gameState.humanPlayer}
        onSelectAiSide={handleSelectAiSide}
        pvpFirstPlayer={pvpFirstPlayer}
        onTogglePvpFirstPlayer={handleTogglePvpFirstPlayer}
        onSelectMode={handleSelectMode}
        onToggleMode={handleToggleMode}
        onSetDifficulty={(d) => { analytics.difficulty(d); setDifficulty(d); }}
        onSetTimeControl={(t) => { analytics.timeControl(t); setTimeControl(t); }}
        onToggleTheme={toggleTheme}
        onToggleSound={toggleSound}
        onOpenRules={() => { analytics.click("open_rules", "modal"); setIsRulesOpen(true); }}
        onOpenOnlineModal={handleOpenOnlineModal}
        onAcceptDraw={handleAcceptDraw}
        onDeclineDraw={handleDeclineDraw}
        onOpenDailyModal={() => { analytics.click("open_daily_modal", "modal"); setIsDailyModalOpen(true); }}
        onOpenSettingsModal={() => { analytics.click("open_settings_modal", "modal"); setIsSettingsOpen(true); }}
        onOpenNicknameModal={openNicknameModal}
        onLeaveRoom={handleLeaveRoom}
      />

      {/* First visit nickname hint (Req 12) */}
      {isFirstVisit && (
        <div className="w-full max-w-[460px] sm:max-w-[480px] mx-auto mb-2 px-3 py-1.5 rounded-lg border border-[var(--line-strong)] bg-[var(--line)]/20 text-xs flex items-center justify-between animate-fade-up">
          <span className="text-[var(--ink-soft)] lowercase">
            {t.common.yourName}:{' '}
            <strong className="text-[var(--highlight-ink)] font-medium font-sans normal-case">
              {nickname}
            </strong>{' '}
            <button
              type="button"
              onClick={openNicknameModal}
              className="ml-1 text-[var(--highlight-ink)] hairline-link cursor-pointer underline"
            >
              ({t.common.change})
            </button>
          </span>
          <button
            type="button"
            onClick={dismissFirstVisitHint}
            className="p-1 text-[var(--ink-mute)] hover:text-[var(--highlight-ink)] cursor-pointer"
            aria-label={t.common.close}
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* One-time how-to-play hint on first game start (Req 11) */}
      {showHowtoHint && (
        <div className="w-full max-w-[460px] sm:max-w-[480px] mx-auto mb-2 px-3 py-1.5 rounded-lg border border-[var(--line-strong)] bg-[var(--line)]/20 text-xs flex items-center justify-between animate-fade-up">
          <span className="text-[var(--ink-soft)] lowercase">
            {t.common.howtoHint} (
            <button
              type="button"
              onClick={() => {
                dismissHowtoHint();
                setIsRulesOpen(true);
              }}
              className="text-[var(--highlight-ink)] hairline-link cursor-pointer underline"
            >
              {t.common.howtoLearn}
            </button>
            )
          </span>
          <button
            type="button"
            onClick={dismissHowtoHint}
            className="p-1 text-[var(--ink-mute)] hover:text-[var(--highlight-ink)] cursor-pointer"
            aria-label={t.common.close}
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* WAI-ARIA live region for screen readers (Req 16) */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {liveAnnouncement}
      </div>

      {/* Chess Clock Bar (visible when timer is active) */}
      <ChessClockBar
        timeControl={timeControl}
        timeX={timeX}
        timeO={timeO}
        currentPlayer={gameState.currentPlayer}
        winner={gameState.winner}
        gameMode={gameState.gameMode}
        onlineRole={peerOnline.role}
        onlinePlayer={peerOnline.myPlayer}
        humanPlayer={gameState.humanPlayer}
        pvpFirstPlayer={pvpFirstPlayer}
        difficulty={gameState.difficulty}
        myNickname={nickname}
        opponentNickname={peerOnline.opponentNickname}
      />

      {/* Online Room Error Card */}
      {gameState.gameMode === 'online' && peerOnline.joinError && (
        <OnlineRoomErrorCard
          error={peerOnline.joinError}
          onTryAgain={() => {
            if (peerOnline.roomId) {
              peerOnline.joinRoom(peerOnline.roomId, 'guest');
            }
          }}
          onCreateRoom={() => {
            handleCreateRoom();
            setIsOnlineModalOpen(true);
          }}
          onPlayVsAi={() => handleSelectMode('ai')}
        />
      )}

      {/* The 9x9 Super Board */}
      <SuperBoard
        gameState={gameState}
        onlineRole={peerOnline.role}
        onlinePlayer={peerOnline.myPlayer}
        connectionStatus={peerOnline.status}
        onCellClick={(b, c) => {
          analytics.cellClick(b, c);
          handleCellClick(b, c);
        }}
      />

      {/* Ergonomic In-Game Actions & Game Over Bar */}
      <GameActionsBar
        gameMode={gameState.gameMode}
        winner={gameState.winner}
        winReason={gameState.winReason}
        wonByLine={gameState.globalWinningLine !== null}
        onlineRole={peerOnline.role}
        onlinePlayer={peerOnline.myPlayer}
        connectionStatus={peerOnline.status}
        historyLength={gameState.history.length}
        isAiThinking={gameState.isAiThinking}
        canUndo={
          gameState.history.length > (gameState.gameMode === 'ai' && gameState.humanPlayer === 'O' ? 1 : 0) &&
          !gameState.isAiThinking &&
          gameState.winner === null &&
          gameState.gameMode !== 'online' &&
          gameState.gameMode !== 'daily'
        }
        speedBlitzTime={gameState.modifiers.speedBlitz ? speedBlitzTime : null}
        myDrawOffered={peerOnline.myDrawOffered}
        rematchRequestedByOpponent={peerOnline.rematchRequestedByOpponent}
        myRematchSent={peerOnline.myRematchSent}
        aiDrawNotice={aiDrawNotice}
        myNickname={nickname}
        opponentNickname={peerOnline.opponentNickname}
        difficulty={gameState.difficulty}
        humanPlayer={gameState.humanPlayer}
        lastDelta={elo.lastDelta}
        newRating={elo.rating}
        isRatedGame={gameState.gameMode === 'ai' || gameState.gameMode === 'online'}
        isProvisional={elo.isProvisional}
        onUndo={handleUndo}
        onReset={handleReset}
        onResign={handleResign}
        onOfferDraw={handleOfferDraw}
        onRequestRematch={handleRequestRematch}
        onAcceptRematch={handleAcceptRematch}
        onChallengeFriend={handleChallengeFriend}
        onLeaveRoom={handleLeaveRoom}
      />

      {/* Subtle Minimalist Footer */}
      <footer className="w-full max-w-[460px] sm:max-w-[480px] mx-auto mt-5 md:mt-6 text-center text-xs text-[var(--ink-mute)] font-light tracking-wide lowercase">
        <div className="flex flex-wrap items-center justify-center">
          <span
            onClick={handleFooterBrandClick}
            className="select-none cursor-default"
          >
            Tic³ · super tic-tac-toe
          </span>
          <span className="mx-2 opacity-40">·</span>
          <Link
            href="/leaderboard"
            className="hover:text-[var(--highlight-ink)] hairline-link cursor-pointer"
          >
            {t.common.leaderboard}
          </Link>
          <span className="mx-2 opacity-40">·</span>
          <button
            type="button"
            onClick={() => {
              analytics.buttonClick('open_rules');
              setIsRulesOpen(true);
            }}
            className="hover:text-[var(--highlight-ink)] hairline-link cursor-pointer"
          >
            {t.common.rules}
          </button>
          <span className="mx-2 opacity-40">·</span>
          <a
            href="https://temr.dev/"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => analytics.outboundClick('https://temr.dev/')}
            className="hover:text-[var(--highlight-ink)] hairline-link cursor-pointer"
          >
            temr.dev
          </a>
        </div>
        {isAdminViewer && (
          <div className="mt-2.5 flex justify-center">
            <a
              href={adminUrl}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] hover:border-[var(--line-strong)] text-[11px] font-medium text-[var(--ink)] hover:text-[var(--highlight-ink)] transition-all"
              style={{ borderBottomStyle: 'solid' }}
            >
              <BarChart3 size={12} />
              <span>{language === 'ru' ? 'аналитика · админ' : 'analytics · admin'}</span>
            </a>
          </div>
        )}
        <div className="mt-2 text-[10px] text-[var(--ink-mute)] opacity-70">
          {t.common.privacyNotice}
        </div>
      </footer>

      {/* Hidden Admin Unlock Dialog (triggered only by owner shortcut Alt+Shift+A or triple-tap) */}
      {isAdminUnlockOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--scrim)] backdrop-blur-xs"
          onClick={() => setIsAdminUnlockOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-unlock-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xs rounded-2xl p-5 border border-[var(--line)] bg-[var(--bg)] shadow-xl"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5 text-[var(--highlight-ink)]">
                <Lock size={13} />
                <h2 id="admin-unlock-title" className="font-serif text-base font-medium lowercase">
                  {language === 'ru' ? 'режим владельца' : 'owner access'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsAdminUnlockOpen(false)}
                aria-label="close"
                className="p-1 text-[var(--ink-soft)] hover:text-[var(--highlight-ink)] cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
            <form onSubmit={handleAdminUnlockSubmit} className="space-y-2.5">
              <input
                type="password"
                value={adminUnlockPass}
                onChange={(e) => {
                  setAdminUnlockPass(e.target.value);
                  setAdminUnlockErr(null);
                }}
                placeholder={language === 'ru' ? 'пароль администратора' : 'admin password'}
                autoFocus
                className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--line)] bg-transparent text-[var(--highlight-ink)] focus:outline-none focus:border-[var(--highlight-ink)]"
              />
              {adminUnlockErr && (
                <p className="text-[11px] text-rose-500 lowercase">{adminUnlockErr}</p>
              )}
              <button
                type="submit"
                disabled={isAdminUnlockLoading}
                className="w-full py-2 rounded-lg bg-[var(--highlight-ink)] text-[var(--bg)] text-xs font-medium lowercase hover:opacity-90 disabled:opacity-50 cursor-pointer"
              >
                {isAdminUnlockLoading
                  ? '...'
                  : language === 'ru'
                  ? 'показать аналитику'
                  : 'show analytics'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Rules Modal */}
      <RulesModal
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
      />

      {/* Online Room Modal */}
      <OnlineRoomModal
        isOpen={isOnlineModalOpen}
        roomId={peerOnline.roomId}
        role={peerOnline.role}
        myPlayer={peerOnline.myPlayer}
        opponentPlayer={peerOnline.opponentPlayer}
        creatorSidePreference={creatorSidePreference}
        status={peerOnline.status}
        peerJoinError={peerOnline.joinError}
        theme={theme}
        myNickname={nickname}
        opponentNickname={peerOnline.opponentNickname}
        onClose={() => {
          if (peerOnline.status !== 'connected') {
            handleLeaveRoom();
          } else {
            setIsOnlineModalOpen(false);
          }
        }}
        onLeaveRoom={handleLeaveRoom}
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinByCode}
        onSelectCreatorSide={handleSelectCreatorSide}
      />

      {/* Arcade Modifiers Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        modifiers={gameState.modifiers}
        onToggleModifier={toggleModifier}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Daily Challenge Modal */}
      <DailyChallengeModal
        isOpen={isDailyModalOpen}
        dailyStats={dailyStats}
        currentBoardWinners={gameState.boardWinners}
        movesCount={gameState.history.length}
        winner={gameState.winner}
        nickname={nickname}
        onClose={() => setIsDailyModalOpen(false)}
        onStartDailyMatch={handleStartDailyMatch}
      />

      {/* Nickname Selection & Edit Modal */}
      <NicknameModal
        isOpen={isNicknameModalOpen}
        isFirstVisit={isFirstVisit}
        currentNickname={nickname}
        onSave={async (name) => {
          const syncRes = await elo.syncNickname(name);
          if (!syncRes.ok) {
            return {
              ok: false,
              errorKey: syncRes.error === 'nickname_taken' ? 'nicknameTaken' : 'invalidChars',
            };
          }
          const res = saveNickname(name);
          if (res.ok) {
            peerOnline.sendNickname(name);
          }
          return res;
        }}
        onSkip={skipNicknamePrompt}
        onClose={closeNicknameModal}
      />
    </main>
  );
}
