'use client';

import React, { useState } from 'react';
import { useSuperTicTacToe } from '@/hooks/useSuperTicTacToe';
import { useTheme } from '@/hooks/useTheme';
import { useChessClock } from '@/hooks/useChessClock';
import { SuperBoard } from '@/components/SuperBoard';
import { GameStatus } from '@/components/GameStatus';
import { ChessClockBar } from '@/components/ChessClockBar';
import { RulesModal } from '@/components/RulesModal';

export default function Home() {
  const [isRulesOpen, setIsRulesOpen] = useState(false);

  const {
    gameState,
    handleCellClick,
    resetGame,
    undoMove,
    toggleGameMode,
    setDifficulty,
    handleTimeout,
  } = useSuperTicTacToe();

  const { theme, toggleTheme } = useTheme();

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
  };

  const handleToggleMode = () => {
    toggleGameMode();
    resetClocks();
  };

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 max-w-xl mx-auto w-full">
      {/* Status Bar & Minimalist Controls */}
      <GameStatus
        gameState={gameState}
        theme={theme}
        timeControl={timeControl}
        onReset={handleReset}
        onUndo={undoMove}
        onToggleMode={handleToggleMode}
        onSetDifficulty={setDifficulty}
        onSetTimeControl={setTimeControl}
        onToggleTheme={toggleTheme}
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
