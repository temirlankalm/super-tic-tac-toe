'use client';

import React, { useState, useCallback } from 'react';
import { MoveEvent, useSuperTicTacToe } from '@/hooks/useSuperTicTacToe';
import { useTheme } from '@/hooks/useTheme';
import { useChessClock } from '@/hooks/useChessClock';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { SuperBoard } from '@/components/SuperBoard';
import { GameStatus } from '@/components/GameStatus';
import { ChessClockBar } from '@/components/ChessClockBar';
import { RulesModal } from '@/components/RulesModal';
import { Player } from '@/types/game';

export default function Home() {
  const [isRulesOpen, setIsRulesOpen] = useState(false);

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

  const {
    gameState,
    handleCellClick,
    resetGame,
    undoMove,
    toggleGameMode,
    setDifficulty,
    handleTimeout: rawHandleTimeout,
  } = useSuperTicTacToe({ onMove: handleMoveEvent });

  const handleTimeout = useCallback(
    (timedOutPlayer: Player) => {
      rawHandleTimeout(timedOutPlayer);
      playClock();
      playGameVictory(false);
      haptic('win');
    },
    [rawHandleTimeout, playClock, playGameVictory, haptic]
  );

  const {
    timeControl,
    setTimeControl,
    timeX,
    timeO,
    resetClocks,
  } = useChessClock({
    currentPlayer: gameState.currentPlayer,
    winner: gameState.winner,
    isPaused: isRulesOpen,
    onTimeout: handleTimeout,
  });

  const handleReset = () => {
    resetGame();
    resetClocks();
    haptic('tap');
  };

  const handleToggleMode = () => {
    toggleGameMode();
    resetClocks();
    haptic('tap');
  };

  const handleUndo = () => {
    undoMove();
    haptic('tap');
  };

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 max-w-xl mx-auto w-full">
      {/* Status Bar & Minimalist Controls */}
      <GameStatus
        gameState={gameState}
        theme={theme}
        timeControl={timeControl}
        isSoundEnabled={isSoundEnabled}
        onReset={handleReset}
        onUndo={handleUndo}
        onToggleMode={handleToggleMode}
        onSetDifficulty={setDifficulty}
        onSetTimeControl={setTimeControl}
        onToggleTheme={toggleTheme}
        onToggleSound={toggleSound}
        onOpenRules={() => setIsRulesOpen(true)}
      />

      {/* Chess Clock Bar (visible when timer is active) */}
      <ChessClockBar
        timeControl={timeControl}
        timeX={timeX}
        timeO={timeO}
        currentPlayer={gameState.currentPlayer}
        winner={gameState.winner}
        gameMode={gameState.gameMode}
        difficulty={gameState.difficulty}
      />

      {/* The 9x9 Super Board */}
      <SuperBoard
        gameState={gameState}
        onCellClick={handleCellClick}
      />

      {/* Subtle Minimalist Footer */}
      <footer className="mt-6 md:mt-8 text-center text-xs text-[var(--ink-mute)] font-light tracking-wide lowercase">
        <span>ultimate tic-tac-toe</span>
        <span className="mx-2 opacity-40">·</span>
        <button
          type="button"
          onClick={() => setIsRulesOpen(true)}
          className="hover:text-[var(--highlight-ink)] hairline-link cursor-pointer"
        >
          rules
        </button>
      </footer>

      {/* Rules Modal */}
      <RulesModal
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
      />
    </main>
  );
}
