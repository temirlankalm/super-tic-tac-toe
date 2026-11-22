'use client';

import React from 'react';
import { RotateCcw, Undo2, HelpCircle, Bot, User } from 'lucide-react';
import { AiDifficulty, GameState } from '@/types/game';
import { HandDrawnLogo } from './hand-drawn/HandDrawnLogo';
import { HandDrawnWin } from './hand-drawn/HandDrawnWin';
import { HandDrawnO, HandDrawnX } from './hand-drawn/HandDrawnMarks';

interface GameStatusProps {
  gameState: GameState;
  onReset: () => void;
  onUndo: () => void;
  onToggleMode: () => void;
  onSetDifficulty: (difficulty: AiDifficulty) => void;
  onOpenRules: () => void;
}

export const GameStatus: React.FC<GameStatusProps> = ({
  gameState,
  onReset,
  onUndo,
  onToggleMode,
  onSetDifficulty,
  onOpenRules,
}) => {
  const {
    currentPlayer,
    winner,
    activeBoard,
    gameMode,
    difficulty,
    isAiThinking,
    history,
  } = gameState;

  // Sector labels (row, col)
  const sectorNames = [
    'top-left',
    'top-center',
    'top-right',
    'mid-left',
    'center',
    'mid-right',
    'bottom-left',
    'bottom-center',
    'bottom-right',
  ];

  const canUndo = history.length > 0 && !isAiThinking && winner === null;

  return (
    <div className="w-full max-w-[460px] sm:max-w-[480px] mx-auto mb-3 md:mb-5">
      {/* Top Bar: Title & Primary Controls */}
      <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
        <div className="flex items-center gap-3">
          {/* Hand-Drawn TTT Logo */}
          <div className="flex items-center gap-2">
            <HandDrawnLogo className="h-6 w-auto text-[var(--highlight-ink)]" />
            <span className="text-xs text-[var(--ink-mute)] font-light tracking-widest lowercase">
              · super
            </span>
          </div>
          <button
            type="button"
            onClick={onOpenRules}
            aria-label="How to play"
            className="p-1 text-[var(--ink-soft)] hover:text-[var(--highlight-ink)] transition-colors cursor-pointer"
          >
            <HelpCircle size={15} />
          </button>
        </div>

        {/* Minimal Actions */}
        <div className="flex items-center gap-2 text-xs">
          {/* Mode toggle */}
          <button
            type="button"
            onClick={onToggleMode}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-[var(--line)] hover:border-[var(--line-strong)] text-[var(--ink-soft)] hover:text-[var(--highlight-ink)] transition-all cursor-pointer font-sans lowercase"
            title="Toggle between single player AI and 2-player hotseat"
          >
            {gameMode === 'ai' ? (
              <>
                <Bot size={13} />
                <span>vs ai</span>
              </>
            ) : (
              <>
                <User size={13} />
                <span>2 players</span>
              </>
            )}
          </button>

          {/* Difficulty selector (when in vs ai mode) */}
          {gameMode === 'ai' && (
            <div className="flex items-center rounded-md border border-[var(--line)] p-0.5 text-[11px] font-sans lowercase">
              {(['easy', 'medium', 'hard'] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => onSetDifficulty(lvl)}
                  className={`px-1.5 py-0.5 rounded-[4px] transition-all cursor-pointer ${
                    difficulty === lvl
                      ? 'bg-[var(--line-strong)] text-[var(--highlight-ink)] font-medium'
                      : 'text-[var(--ink-mute)] hover:text-[var(--ink-soft)]'
                  }`}
                >
                  {lvl === 'medium' ? 'med' : lvl}
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            className={`p-1.5 rounded-md border border-[var(--line)] transition-all ${
              canUndo
                ? 'hover:border-[var(--line-strong)] text-[var(--ink-soft)] hover:text-[var(--highlight-ink)] cursor-pointer'
                : 'opacity-30 cursor-not-allowed'
            }`}
            title="Undo move"
            aria-label="Undo move"
          >
            <Undo2 size={13} />
          </button>

          <button
            type="button"
            onClick={onReset}
            className="p-1.5 rounded-md border border-[var(--line)] hover:border-[var(--line-strong)] text-[var(--ink-soft)] hover:text-[var(--highlight-ink)] transition-all cursor-pointer"
            title="Restart game"
            aria-label="Restart game"
          >
            <RotateCcw size={13} />
          </button>
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between pt-3 text-sm min-h-[32px]">
        {/* Game State Message */}
        <div className="flex items-center gap-2">
          {winner === null ? (
            <div className="flex items-center gap-2">
              <span className="text-[var(--ink-soft)] lowercase">turn:</span>
              <span className="inline-flex items-center gap-1.5 font-medium text-[var(--highlight-ink)]">
                {currentPlayer === 'X' ? (
                  <HandDrawnX variant={0} className="w-4 h-4 text-[var(--highlight-ink)]" />
                ) : (
                  <HandDrawnO variant={0} className="w-4 h-4 text-[var(--highlight-ink)]" />
                )}
                {gameMode === 'ai' && currentPlayer !== gameState.humanPlayer && (
                  <span className="text-xs text-[var(--ink-mute)] font-normal">
                    {isAiThinking ? '(thinking…)' : `(ai · ${difficulty})`}
                  </span>
                )}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 animate-fade-up">
              {winner === 'TIE' ? (
                <span className="font-medium text-[var(--highlight-ink)] lowercase">
                  it&apos;s a draw.
                </span>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="font-medium text-[var(--highlight-ink)]">
                    {winner === 'X' ? (
                      <HandDrawnX variant={0} className="w-4 h-4 inline-block mr-1 text-[var(--highlight-ink)]" />
                    ) : (
                      <HandDrawnO variant={0} className="w-4 h-4 inline-block mr-1 text-[var(--highlight-ink)]" />
                    )}
                  </span>
                  <HandDrawnWin className="h-5 w-auto" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sector Target Guidance with Mini-Grid Locator */}
        {winner === null && (
          <div className="flex items-center gap-2 text-xs text-[var(--ink-soft)] lowercase">
            {activeBoard === null ? (
              <span className="italic">free play (any sector)</span>
            ) : (
              <div className="flex items-center gap-1.5">
                <span>target: {sectorNames[activeBoard]}</span>
                {/* Visual 3x3 Mini Sector Locator */}
                <div className="grid grid-cols-3 gap-0.5 w-3.5 h-3.5 border border-[var(--line-strong)] p-0.5 rounded-[2px]">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-full h-full rounded-[0.5px] ${
                        i === activeBoard
                          ? 'bg-[var(--highlight-ink)]'
                          : 'bg-[var(--line)]'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
