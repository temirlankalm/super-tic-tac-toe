'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
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
import { SettingsModal } from '@/components/SettingsModal';
import { DailyChallengeModal } from '@/components/DailyChallengeModal';
import { evaluateStaticState } from '@/lib/ai';
import { DailyStats, getDailyStats, recordDailyResult } from '@/lib/daily';
import { Player } from '@/types/game';

export default function Home() {
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

  useEffect(() => {
    setDailyStats(getDailyStats());
  }, []);

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
    isGameActive:
      Boolean(gameStateRef.current?.history?.length > 0) &&
      gameStateRef.current?.winner === null,
    onRemoteMove: (boardIdx, cellIdx, _player, rTimeX, rTimeO) => {
      applyRemoteMove(boardIdx, cellIdx);
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
    onRematchAccepted: (tc) => {
      resetGame();
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
    onOpponentForfeit: () => {
      // 30s disconnect grace period expired: award technical victory to remaining player
      const myPlayer: Player = peerOnline.role === 'host' ? 'X' : 'O';
      const timedOutOpponent: Player = myPlayer === 'X' ? 'O' : 'X';
      rawHandleTimeout(timedOutOpponent);
      playGameVictory(false);
      haptic('win');
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
    isOnlineConnected: peerOnline.status === 'connected',
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
      playGameVictory(false);
      haptic('win');
    },
    [rawHandleTimeout, playClock, playGameVictory, haptic]
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

  // Track daily challenge completion and update stats
  const dailyCompletedRef = useRef<boolean>(false);
  useEffect(() => {
    if (gameState.gameMode === 'daily') {
      if (gameState.winner !== null && !dailyCompletedRef.current) {
        dailyCompletedRef.current = true;
        const isWon = gameState.winner === 'X';
        const updated = recordDailyResult(
          isWon,
          gameState.history.length,
          gameState.boardWinners
        );
        setDailyStats(updated);
        // Prompt share modal shortly after victory animation
        setTimeout(() => {
          setIsDailyModalOpen(true);
        }, 1200);
      }
    } else {
      dailyCompletedRef.current = false;
    }
  }, [gameState.gameMode, gameState.winner, gameState.history.length, gameState.boardWinners]);

  // Detect ?room=xxxx query param on mount to join room
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setGameMode('online');
      peerOnline.joinRoom(roomParam);
      setIsOnlineModalOpen(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleReset = () => {
    if (gameState.gameMode === 'online') {
      if (gameState.history.length > 0 || gameState.winner !== null) {
        peerOnline.requestRematch();
      } else {
        resetGame();
        resetClocks();
      }
    } else {
      resetGame();
      resetClocks();
    }
    haptic('tap');
  };

  const handleToggleMode = () => {
    const nextMode =
      gameState.gameMode === 'ai'
        ? 'pvp'
        : gameState.gameMode === 'pvp'
        ? 'online'
        : 'ai';

    setGameMode(nextMode);
    resetClocks();
    haptic('tap');

    if (nextMode === 'online') {
      if (peerOnline.status === 'idle') {
        peerOnline.createRoom();
        setIsOnlineModalOpen(true);
      }
    } else {
      peerOnline.leaveRoom();
    }
  };

  // Quick Match Handlers
  const handleStartQuickMatch = () => {
    setGameMode('online');
    setTimeControl(180); // Default 3m blitz for quick play
    resetClocks(180);
    peerOnline.startQuickMatch();
    haptic('tap');
  };

  const handleCancelQuickMatch = () => {
    peerOnline.cancelQuickMatch();
    haptic('tap');
  };

  const handleQuickMatchPlayAi = () => {
    peerOnline.cancelQuickMatch();
    setGameMode('ai');
    resetClocks(timeControl);
    haptic('tap');
  };

  // Daily Challenge Start from Modal
  const handleStartDailyMatch = () => {
    setGameMode('daily');
    setDifficulty('medium');
    dailyCompletedRef.current = false;
    resetGame();
    resetClocks('off');
    setIsDailyModalOpen(false);
    haptic('tap');
  };

  const handleOpenOnlineModal = () => {
    if (peerOnline.status === 'idle') {
      peerOnline.createRoom();
    }
    setIsOnlineModalOpen(true);
  };

  const handleLeaveRoom = () => {
    peerOnline.leaveRoom();
    setGameMode('ai');
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

  const handleCreateRoom = () => {
    peerOnline.createRoom();
  };

  const handleRequestRematch = () => {
    peerOnline.requestRematch();
    haptic('tap');
  };

  const handleAcceptRematch = () => {
    peerOnline.acceptRematch(timeControl);
    resetGame();
    resetClocks(timeControl);
    haptic('win');
  };

  const handleResign = () => {
    if (gameState.gameMode === 'online') {
      const myPlayer: Player = peerOnline.role === 'host' ? 'X' : 'O';
      peerOnline.resignOnline();
      rawHandleResign(myPlayer);
    } else if (gameState.gameMode === 'ai' || gameState.gameMode === 'daily') {
      rawHandleResign('X');
    } else {
      rawHandleResign(gameState.currentPlayer);
    }
    playGameVictory(false);
    haptic('win');
  };

  const handleOfferDraw = () => {
    if (gameState.gameMode === 'online') {
      peerOnline.offerDrawOnline();
      haptic('tap');
    } else if (gameState.gameMode === 'ai' || gameState.gameMode === 'daily') {
      const score = evaluateStaticState(gameState, 'O');
      if (score > 250) {
        setAiDrawNotice('ии считает свою позицию выгоднее и отклонил ничью');
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

  const activeModifiersCount = Object.values(gameState.modifiers || {}).filter(Boolean).length;

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 max-w-xl mx-auto w-full">
      {/* Top Status & Game Setup Bar */}
      <GameStatus
        gameState={gameState}
        theme={theme}
        timeControl={timeControl}
        isSoundEnabled={isSoundEnabled}
        onlineRole={peerOnline.role}
        connectionStatus={peerOnline.status}
        roomId={peerOnline.roomId}
        drawOfferedByOpponent={peerOnline.drawOfferedByOpponent}
        myDrawOffered={peerOnline.myDrawOffered}
        drawDeclinedNotice={peerOnline.drawDeclinedNotice}
        dailyStreak={dailyStats.currentStreak}
        activeModifiersCount={activeModifiersCount}
        disconnectGraceSeconds={peerOnline.disconnectGraceSeconds}
        isQuickSearching={peerOnline.isSearching}
        quickSearchElapsed={peerOnline.searchElapsed}
        quickSearchTimeoutReached={peerOnline.searchTimeoutReached}
        onToggleMode={handleToggleMode}
        onSetDifficulty={setDifficulty}
        onSetTimeControl={setTimeControl}
        onToggleTheme={toggleTheme}
        onToggleSound={toggleSound}
        onOpenRules={() => setIsRulesOpen(true)}
        onOpenOnlineModal={handleOpenOnlineModal}
        onAcceptDraw={handleAcceptDraw}
        onDeclineDraw={handleDeclineDraw}
        onOpenDailyModal={() => setIsDailyModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsOpen(true)}
        onStartQuickMatch={handleStartQuickMatch}
        onCancelQuickMatch={handleCancelQuickMatch}
        onQuickMatchPlayAi={handleQuickMatchPlayAi}
      />

      {/* Chess Clock Bar (visible when timer is active) */}
      <ChessClockBar
        timeControl={timeControl}
        timeX={timeX}
        timeO={timeO}
        currentPlayer={gameState.currentPlayer}
        winner={gameState.winner}
        gameMode={gameState.gameMode}
        onlineRole={peerOnline.role}
        difficulty={gameState.difficulty}
      />

      {/* The 9x9 Super Board */}
      <SuperBoard
        gameState={gameState}
        onlineRole={peerOnline.role}
        connectionStatus={peerOnline.status}
        onCellClick={handleCellClick}
      />

      {/* Ergonomic In-Game Actions & Game Over Bar */}
      <GameActionsBar
        gameMode={gameState.gameMode}
        winner={gameState.winner}
        winReason={gameState.winReason}
        onlineRole={peerOnline.role}
        historyLength={gameState.history.length}
        isAiThinking={gameState.isAiThinking}
        canUndo={
          gameState.history.length > 0 &&
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
        onUndo={handleUndo}
        onReset={handleReset}
        onResign={handleResign}
        onOfferDraw={handleOfferDraw}
        onRequestRematch={handleRequestRematch}
        onAcceptRematch={handleAcceptRematch}
      />

      {/* Subtle Minimalist Footer */}
      <footer className="mt-5 md:mt-6 text-center text-xs text-[var(--ink-mute)] font-light tracking-wide lowercase">
        <span>super tic-tac-toe</span>
        <span className="mx-2 opacity-40">·</span>
        <button
          type="button"
          onClick={() => setIsRulesOpen(true)}
          className="hover:text-[var(--highlight-ink)] hairline-link cursor-pointer"
        >
          правила игры
        </button>
      </footer>

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
        status={peerOnline.status}
        theme={theme}
        onClose={() => setIsOnlineModalOpen(false)}
        onLeaveRoom={handleLeaveRoom}
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinByCode}
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
        onClose={() => setIsDailyModalOpen(false)}
        onStartDailyMatch={handleStartDailyMatch}
      />
    </main>
  );
}
