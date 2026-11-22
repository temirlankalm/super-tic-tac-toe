'use client';

import React from 'react';
import { CellState } from '@/types/game';

interface CellProps {
  value: CellState;
  isPlayable: boolean;
  isLastMove: boolean;
  isWinningCell: boolean;
  onClick: () => void;
  boardIdx: number;
  cellIdx: number;
}

export const Cell: React.FC<CellProps> = ({
  value,
  isPlayable,
  isLastMove,
  isWinningCell,
  onClick,
  boardIdx,
  cellIdx,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!isPlayable}
      aria-label={`Sector ${boardIdx + 1}, cell ${cellIdx + 1}: ${value || 'empty'}`}
      className={`relative flex items-center justify-center aspect-square rounded-sm text-lg md:text-xl font-medium transition-all duration-150 select-none ${
        isPlayable
          ? 'cursor-pointer hover:bg-[var(--cell-hover)] active:scale-95'
          : 'cursor-default'
      } ${isLastMove ? 'bg-[var(--cell-last-move)]' : ''} ${
        isWinningCell ? 'text-[var(--highlight-ink)] font-semibold' : ''
      }`}
    >
      {value === 'X' && (
        <span className="animate-fade-up lowercase text-[var(--ink)] leading-none">
          ✕
        </span>
      )}
      {value === 'O' && (
        <span className="animate-fade-up lowercase text-[var(--ink)] leading-none text-xl md:text-2xl">
          ○
        </span>
      )}

      {/* Tiny subtle dot indicator for last move */}
      {isLastMove && (
        <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[var(--ink-soft)] opacity-80" />
      )}
    </button>
  );
};
