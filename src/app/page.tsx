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
import { evaluateStaticState } from '@/lib/ai';
import { Player } from '@/types/game';

export default function Home() {
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isOnlineModalOpen, setIsOnlineModalOpen] = useState(false);
  const [aiDrawNotice, setAiDrawNotice] = useState<string | null>(null);

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
        });
      }
    },
  });

  const {
    gameState,
    handleCellClick,
    applyRemoteMove,
    syncState,
    resetGame,
    undoMove,
    setGameMode,
    toggleGameMode,
    setDifficulty,
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
    } else if (gameState.gameMode === 'ai') {
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
    } else if (gameState.gameMode === 'ai') {
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
        onToggleMode={handleToggleMode}
        onSetDifficulty={setDifficulty}
        onSetTimeControl={setTimeControl}
        onToggleTheme={toggleTheme}
        onToggleSound={toggleSound}
        onOpenRules={() => setIsRulesOpen(true)}
        onOpenOnlineModal={handleOpenOnlineModal}
        onAcceptDraw={handleAcceptDraw}
        onDeclineDraw={handleDeclineDraw}
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
        canUndo={gameState.history.length > 0 && !gameState.isAiThinking && gameState.winner === null && gameState.gameMode !== 'online'}
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
    </main>
  );
}
