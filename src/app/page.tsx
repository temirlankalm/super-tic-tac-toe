'use client';

import React, { useState } from 'react';
import { useSuperTicTacToe } from '@/hooks/useSuperTicTacToe';
import { SuperBoard } from '@/components/SuperBoard';
import { GameStatus } from '@/components/GameStatus';
import { RulesModal } from '@/components/RulesModal';

export default function Home() {
  const {
    gameState,
    handleCellClick,
    resetGame,
    undoMove,
    toggleGameMode,
    setDifficulty,
  } = useSuperTicTacToe();

  const [isRulesOpen, setIsRulesOpen] = useState(false);

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 max-w-xl mx-auto w-full">
      {/* Status Bar & Minimalist Controls */}
      <GameStatus
        gameState={gameState}
        onReset={resetGame}
        onUndo={undoMove}
        onToggleMode={toggleGameMode}
        onSetDifficulty={setDifficulty}
        onOpenRules={() => setIsRulesOpen(true)}
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
