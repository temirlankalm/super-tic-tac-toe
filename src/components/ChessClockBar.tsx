'use client';

import React from 'react';
import { Player, BoardWinner, TimeControl, GameMode, OnlineRole } from '@/types/game';
import { HandDrawnX, HandDrawnO } from './hand-drawn/HandDrawnMarks';
import { useTranslation } from '@/i18n/LanguageContext';

interface ChessClockBarProps {
  timeControl: TimeControl;
  timeX: number;
  timeO: number;
  currentPlayer: Player;
  winner: BoardWinner;
  gameMode: GameMode;
  onlineRole?: OnlineRole;
  onlinePlayer?: Player | null;
  humanPlayer?: Player;
  pvpFirstPlayer?: 'p1' | 'p2';
  difficulty?: string;
  myNickname?: string;
  opponentNickname?: string | null;
}

function formatClock(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds));
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export const ChessClockBar: React.FC<ChessClockBarProps> = ({
  timeControl,
  timeX,
  timeO,
  currentPlayer,
  winner,
  gameMode,
  onlineRole,
  onlinePlayer,
  humanPlayer = 'X',
  pvpFirstPlayer = 'p1',
  difficulty,
  myNickname,
  opponentNickname,
}) => {
  const { t, language } = useTranslation();

  if (timeControl === 'off') {
    return (
      <div
        className="w-full max-w-[460px] sm:max-w-[480px] mx-auto px-1 sm:px-2 py-1 my-1 h-10 pointer-events-none opacity-0 select-none"
        aria-hidden="true"
      />
    );
  }

  const isXActive = winner === null && currentPlayer === 'X';
  const isOActive = winner === null && currentPlayer === 'O';

  const isXLow = timeX <= 15 && timeX > 0;
  const isOLow = timeO <= 15 && timeO > 0;

  const isXFlagged = timeX <= 0;
  const isOFlagged = timeO <= 0;

  const isXSelf = onlinePlayer ? onlinePlayer === 'X' : onlineRole === 'host';
  const isOSelf = onlinePlayer ? onlinePlayer === 'O' : onlineRole === 'guest';

  const opponentWord = opponentNickname || (language === 'ru' ? 'соперник' : 'opponent');
  const youWord = myNickname || (language === 'ru' ? 'вы' : 'you');
  const aiWord = language === 'ru' ? 'ии' : 'ai';
  const diffLabel =
    difficulty && difficulty in t.difficulties
      ? t.difficulties[difficulty as keyof typeof t.difficulties]
      : difficulty || '';

  const playerXLabel =
    gameMode === 'ai'
      ? humanPlayer === 'O'
        ? `${aiWord} (${diffLabel})`
        : `${youWord} (x)`
      : gameMode === 'online'
      ? isXSelf
        ? `${youWord} (x)`
        : `${opponentWord} (x)`
      : pvpFirstPlayer === 'p2'
      ? `${language === 'ru' ? 'игрок 2' : 'player 2'} (x)`
      : t.clock.player1X;

  const playerOLabel =
    gameMode === 'ai'
      ? humanPlayer === 'O'
        ? `${youWord} (o)`
        : `${aiWord} (${diffLabel})`
      : gameMode === 'online'
      ? isOSelf
        ? `${youWord} (o)`
        : `${opponentWord} (o)`
      : pvpFirstPlayer === 'p2'
      ? `${language === 'ru' ? 'игрок 1' : 'player 1'} (o)`
      : t.clock.player2O;

  return (
    <div className="w-full max-w-[460px] sm:max-w-[480px] mx-auto mb-3 animate-fade-up">
      <div className="grid grid-cols-2 gap-2.5">
        {/* Player X Clock Box */}
        <div
          className={`flex items-center justify-between px-3 py-2 rounded-lg border transition-all duration-200 ${
            isXActive
              ? 'border-[var(--line-strong)] bg-[var(--active-board-bg)] shadow-xs ring-1 ring-[var(--line-strong)]/30'
              : 'border-[var(--line)] bg-transparent opacity-65'
          } ${isXLow ? 'border-amber-500/60 text-amber-600 dark:text-amber-400' : ''}`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <HandDrawnX
              variant={0}
              className={`w-3.5 h-3.5 shrink-0 transition-opacity ${
                isXActive ? 'opacity-100 text-[var(--highlight-ink)]' : 'opacity-60 text-[var(--ink)]'
              }`}
            />
            <span className="text-xs truncate lowercase text-[var(--ink-soft)]">
              {playerXLabel}
            </span>
          </div>

          <div className="flex items-center gap-1.5 pl-2 font-mono text-sm tracking-wider font-medium">
            <span
              className={`${
                isXFlagged
                  ? 'text-red-500 font-bold line-through'
                  : isXLow
                  ? 'text-amber-600 dark:text-amber-400 font-bold animate-pulse'
                  : 'text-[var(--highlight-ink)]'
              }`}
            >
              {formatClock(timeX)}
            </span>
            {isXFlagged && (
              <span className="text-[10px] text-red-500 lowercase font-sans">
                {t.clock.timesUp}
              </span>
            )}
          </div>
        </div>

        {/* Player O Clock Box */}
        <div
          className={`flex items-center justify-between px-3 py-2 rounded-lg border transition-all duration-200 ${
            isOActive
              ? 'border-[var(--line-strong)] bg-[var(--active-board-bg)] shadow-xs ring-1 ring-[var(--line-strong)]/30'
              : 'border-[var(--line)] bg-transparent opacity-65'
          } ${isOLow ? 'border-amber-500/60 text-amber-600 dark:text-amber-400' : ''}`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <HandDrawnO
              variant={0}
              className={`w-3.5 h-3.5 shrink-0 transition-opacity ${
                isOActive ? 'opacity-100 text-[var(--highlight-ink)]' : 'opacity-60 text-[var(--ink)]'
              }`}
            />
            <span className="text-xs truncate lowercase text-[var(--ink-soft)]">
              {playerOLabel}
            </span>
          </div>

          <div className="flex items-center gap-1.5 pl-2 font-mono text-sm tracking-wider font-medium">
            <span
              className={`${
                isOFlagged
                  ? 'text-red-500 font-bold line-through'
                  : isOLow
                  ? 'text-amber-600 dark:text-amber-400 font-bold animate-pulse'
                  : 'text-[var(--highlight-ink)]'
              }`}
            >
              {formatClock(timeO)}
            </span>
            {isOFlagged && (
              <span className="text-[10px] text-red-500 lowercase font-sans">
                {t.clock.timesUp}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
