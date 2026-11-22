'use client';

import React from 'react';
import { CellState } from '@/types/game';
import { HandDrawnO, HandDrawnX } from './hand-drawn/HandDrawnMarks';

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
  // Deterministic variation (0, 1, or 2)
  const variant = (boardIdx * 7 + cellIdx * 3) % 3;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!isPlayable}
      aria-label={`Sector ${boardIdx + 1}, cell ${cellIdx + 1}: ${value || 'empty'}`}
      className={`w-full h-full min-w-0 min-h-0 relative flex items-center justify-center p-0.5 sm:p-1 transition-colors duration-150 select-none ${
        isPlayable
          ? 'cursor-pointer hover:bg-[var(--cell-hover)] active:scale-95'
          : 'cursor-default'
      }`}
    >
      {value === 'X' && (
        <div className="w-full h-full flex items-center justify-center animate-fade-up">
          <HandDrawnX
            variant={variant}
            className={`w-[78%] h-[78%] ${
              isWinningCell ? 'text-[var(--highlight-ink)]' : 'text-[var(--ink)]'
            }`}
          />
        </div>
      )}
      {value === 'O' && (
        <div className="w-full h-full flex items-center justify-center animate-fade-up">
          <HandDrawnO
            variant={variant}
            className={`w-[78%] h-[78%] ${
              isWinningCell ? 'text-[var(--highlight-ink)]' : 'text-[var(--ink)]'
            }`}
          />
        </div>
      )}

      {/* Enhanced subtle indicator for last move */}
      {isLastMove && (
        <>
          <span className="absolute inset-0.5 rounded-sm bg-[var(--cell-last-move)] pointer-events-none opacity-80" />
          <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-[var(--highlight-ink)] shadow-xs pointer-events-none" />
        </>
      )}
    </button>
  );
};
