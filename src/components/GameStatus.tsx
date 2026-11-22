'use client';

import React, { useState, useRef, useEffect } from 'react';
import { RotateCcw, Undo2, HelpCircle, Bot, User, Sun, Moon, Clock } from 'lucide-react';
import { AiDifficulty, GameState, TimeControl } from '@/types/game';
import { HandDrawnLogo } from './hand-drawn/HandDrawnLogo';
import { HandDrawnWin } from './hand-drawn/HandDrawnWin';
import { HandDrawnO, HandDrawnX } from './hand-drawn/HandDrawnMarks';

interface GameStatusProps {
  gameState: GameState;
  theme: 'light' | 'dark';
  timeControl: TimeControl;
  onReset: () => void;
  onUndo: () => void;
  onToggleMode: () => void;
  onSetDifficulty: (difficulty: AiDifficulty) => void;
  onSetTimeControl: (tc: TimeControl) => void;
  onToggleTheme: () => void;
  onOpenRules: () => void;
}

const timeLabels: Record<TimeControl, string> = {
  off: 'off',
  60: '1m',
  120: '2m',
  180: '3m',
  300: '5m',
};

export const GameStatus: React.FC<GameStatusProps> = ({
  gameState,
  theme,
  timeControl,
  onReset,
  onUndo,
  onToggleMode,
  onSetDifficulty,
  onSetTimeControl,
  onToggleTheme,
  onOpenRules,
}) => {
  const {
    currentPlayer,
    winner,
    winReason,
    activeBoard,
    gameMode,
    difficulty,
    isAiThinking,
    history,
  } = gameState;

  const [isTimeMenuOpen, setIsTimeMenuOpen] = useState(false);
  const timeMenuRef = useRef<HTMLDivElement>(null);

  // Close time menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (timeMenuRef.current && !timeMenuRef.current.contains(e.target as Node)) {
        setIsTimeMenuOpen(false);
      }
    };
    if (isTimeMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isTimeMenuOpen]);

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
      <div className="flex items-center justify-between pb-3 border-b border-[var(--line)] gap-2 flex-wrap">
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

        {/* Actions Bar */}
        <div className="flex items-center gap-1.5 sm:gap-2 text-xs flex-wrap justify-end">
          {/* Mode toggle */}
          <button
            type="button"
            onClick={onToggleMode}
            className="flex items-center gap-1.5 px-2 py-1 rounded-md border border-[var(--line)] hover:border-[var(--line-strong)] text-[var(--ink-soft)] hover:text-[var(--highlight-ink)] transition-all cursor-pointer font-sans lowercase"
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
                <span>2p</span>
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

          {/* Chess Clock Timer Selector */}
          <div className="relative" ref={timeMenuRef}>
            <button
              type="button"
              onClick={() => setIsTimeMenuOpen((prev) => !prev)}
              className={`flex items-center gap-1 px-2 py-1 rounded-md border transition-all cursor-pointer font-sans lowercase ${
                timeControl !== 'off'
                  ? 'border-[var(--line-strong)] text-[var(--highlight-ink)] bg-[var(--active-board-bg)] font-medium'
                  : 'border-[var(--line)] hover:border-[var(--line-strong)] text-[var(--ink-soft)] hover:text-[var(--highlight-ink)]'
              }`}
              title="chess clock timer (off, 1m, 2m, 3m, 5m)"
              aria-label="Select chess clock timer"
            >
              <Clock size={13} />
              <span>{timeLabels[timeControl]}</span>
            </button>

            {isTimeMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 z-40 py-1 px-1 min-w-[135px] rounded-lg bg-[var(--bg)] border border-[var(--line-strong)] shadow-lg animate-fade-up text-xs font-sans">
                <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-[var(--ink-mute)] font-medium border-b border-[var(--line)] mb-1">
                  chess clock
                </div>
                {(
                  [
                    { value: 'off', label: 'off (unlimited)' },
                    { value: 60, label: '1m (bullet)' },
                    { value: 120, label: '2m (blitz)' },
                    { value: 180, label: '3m (blitz)' },
                    { value: 300, label: '5m (rapid)' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onSetTimeControl(opt.value);
                      setIsTimeMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2 py-1 rounded text-left transition-colors cursor-pointer ${
                      timeControl === opt.value
                        ? 'bg-[var(--line)] text-[var(--highlight-ink)] font-medium'
                        : 'text-[var(--ink-soft)] hover:text-[var(--highlight-ink)] hover:bg-[var(--line)]/50'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {timeControl === opt.value && <span className="text-[10px]">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

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

          {/* Theme toggle (Light / Dark) */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="p-1.5 rounded-md border border-[var(--line)] hover:border-[var(--line-strong)] text-[var(--ink-soft)] hover:text-[var(--highlight-ink)] transition-all cursor-pointer"
            title={theme === 'dark' ? 'switch to light theme' : 'switch to dark theme'}
            aria-label={theme === 'dark' ? 'switch to light theme' : 'switch to dark theme'}
          >
            {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
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
              ) : winReason === 'timeout' ? (
                <div className="flex items-center gap-2">
                  <span className="font-medium text-[var(--highlight-ink)]">
                    {winner === 'X' ? (
                      <HandDrawnX variant={0} className="w-4 h-4 inline-block mr-1 text-[var(--highlight-ink)]" />
                    ) : (
                      <HandDrawnO variant={0} className="w-4 h-4 inline-block mr-1 text-[var(--highlight-ink)]" />
                    )}
                  </span>
                  <span className="font-medium text-[var(--highlight-ink)] lowercase">
                    wins on time
                  </span>
                  <span className="text-xs text-[var(--ink-mute)] font-normal lowercase">
                    ({winner === 'X' ? 'O' : 'X'} flagged)
                  </span>
                </div>
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
