'use client';

import React, { useRef, useEffect } from 'react';
import { CellState } from '@/types/game';
import { HandDrawnO, HandDrawnX } from './hand-drawn/HandDrawnMarks';
import { useTranslation } from '@/i18n/LanguageContext';

interface CellProps {
  value: CellState;
  isPlayable: boolean;
  isLastMove: boolean;
  isWinningCell: boolean;
  onClick: () => void;
  boardIdx: number;
  cellIdx: number;
  opacity?: number;
  isExpiringSoon?: boolean;
  tabIndex?: number;
  isFocused?: boolean;
  onFocus?: () => void;
}

export const Cell: React.FC<CellProps> = ({
  value,
  isPlayable,
  isLastMove,
  isWinningCell,
  onClick,
  boardIdx,
  cellIdx,
  opacity,
  isExpiringSoon,
  tabIndex = -1,
  isFocused = false,
  onFocus,
}) => {
  const { t } = useTranslation();
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isFocused) {
      buttonRef.current?.focus();
    }
  }, [isFocused]);

  // Deterministic variation (0, 1, or 2)
  const variant = (boardIdx * 7 + cellIdx * 3) % 3;

  return (
    <button
      ref={buttonRef}
      type="button"
      role="gridcell"
      tabIndex={tabIndex}
      onFocus={onFocus}
      onClick={onClick}
      disabled={!isPlayable}
      aria-label={t.cell.ariaLabel
        .replace('{sector}', String(boardIdx + 1))
        .replace('{cell}', String(cellIdx + 1))
        .replace('{value}', value || t.cell.empty)}
      className={`w-full h-full min-w-0 min-h-0 relative flex items-center justify-center p-0.5 sm:p-1 transition-colors duration-150 select-none focus:outline-none focus:ring-2 focus:ring-[var(--highlight-ink)] ${
        isPlayable
          ? 'cursor-pointer hover:bg-[var(--cell-hover)] active:scale-95'
          : 'cursor-default'
      }`}
    >
      {value === 'X' && (
        <div
          className="w-full h-full flex items-center justify-center animate-fade-up transition-opacity duration-300 relative"
          style={opacity !== undefined ? { opacity } : undefined}
        >
          <HandDrawnX
            variant={variant}
            className={`w-[78%] h-[78%] ${
              isWinningCell ? 'text-[var(--highlight-ink)]' : 'text-[var(--ink)]'
            }`}
          />
          {isExpiringSoon && (
            <span
              className="absolute top-0.5 right-0.5 w-1 h-1 rounded-full bg-rose-400/80 animate-pulse pointer-events-none"
              title={t.cell.fadingSoon}
            />
          )}
        </div>
      )}
      {value === 'O' && (
        <div
          className="w-full h-full flex items-center justify-center animate-fade-up transition-opacity duration-300 relative"
          style={opacity !== undefined ? { opacity } : undefined}
        >
          <HandDrawnO
            variant={variant}
            className={`w-[78%] h-[78%] ${
              isWinningCell ? 'text-[var(--highlight-ink)]' : 'text-[var(--ink)]'
            }`}
          />
          {isExpiringSoon && (
            <span
              className="absolute top-0.5 right-0.5 w-1 h-1 rounded-full bg-rose-400/80 animate-pulse pointer-events-none"
              title={t.cell.fadingSoon}
            />
          )}
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
