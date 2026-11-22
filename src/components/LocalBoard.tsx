'use client';

import React from 'react';
import { BoardWinner, CellState, Move } from '@/types/game';
import { Cell } from './Cell';
import { HandDrawnO, HandDrawnX } from './hand-drawn/HandDrawnMarks';
import { HandDrawnLocalGrid } from './hand-drawn/HandDrawnLocalGrid';

interface LocalBoardProps {
  boardIdx: number;
  cells: CellState[];
  winner: BoardWinner;
  winningLine: number[] | null;
  isActive: boolean;
  isGlobalWinningBoard: boolean;
  lastMove: Move | null;
  onCellClick: (boardIdx: number, cellIdx: number) => void;
  disabled: boolean;
}

export const LocalBoard: React.FC<LocalBoardProps> = ({
  boardIdx,
  cells,
  winner,
  winningLine,
  isActive,
  isGlobalWinningBoard,
  lastMove,
  onCellClick,
  disabled,
}) => {
  const isResolved = winner !== null;

  return (
    <div
      className={`relative w-full h-full p-2 sm:p-2.5 transition-colors duration-200 flex flex-col justify-center items-center ${
        isActive && !isResolved
          ? 'bg-[var(--active-board-bg)] ring-1 ring-[var(--line-strong)]/40'
          : 'bg-transparent'
      } ${
        isGlobalWinningBoard
          ? 'bg-[var(--active-board-bg)] ring-2 ring-[var(--highlight-ink)]'
          : ''
      }`}
    >
      {/* Container box where both grid lines and cells share the exact same bounds */}
      <div className="relative w-full h-full aspect-square">
        {/* Authentic Hand-Drawn 3x3 Grid Lines for this Sector */}
        <div
          className={`absolute inset-0 pointer-events-none text-[var(--ink)] transition-opacity duration-200 z-0 ${
            isActive && !isResolved ? 'opacity-90' : isResolved ? 'opacity-40' : 'opacity-65'
          }`}
        >
          <HandDrawnLocalGrid sectorIdx={boardIdx} className="w-full h-full" />
        </div>

        {/* 3x3 Internal Cell Grid */}
        <div className="relative z-10 grid grid-cols-3 grid-rows-3 w-full h-full gap-0">
          {cells.map((cellValue, cellIdx) => {
            const isPlayable =
              !disabled &&
              !isResolved &&
              isActive &&
              cellValue === null;

            const isLast =
              lastMove !== null &&
              lastMove.boardIdx === boardIdx &&
              lastMove.cellIdx === cellIdx;

            const isWinCell =
              winningLine !== null && winningLine.includes(cellIdx);

            return (
              <div
                key={cellIdx}
                className="w-full h-full min-w-0 min-h-0 flex items-stretch justify-stretch"
              >
                <Cell
                  value={cellValue}
                  isPlayable={isPlayable}
                  isLastMove={isLast}
                  isWinningCell={isWinCell}
                  onClick={() => onCellClick(boardIdx, cellIdx)}
                  boardIdx={boardIdx}
                  cellIdx={cellIdx}
                />
              </div>
            );
          })}
        </div>

        {/* Resolved Overlay (when a player won this mini-board or tied) */}
        {isResolved && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-[var(--bg)]/85 backdrop-blur-[0.5px] animate-fade-up select-none pointer-events-none p-2 sm:p-3">
            {winner === 'X' && (
              <HandDrawnX
                variant={boardIdx % 3}
                className="w-full h-full max-w-[85px] max-h-[85px] text-[var(--highlight-ink)]"
              />
            )}
            {winner === 'O' && (
              <HandDrawnO
                variant={boardIdx % 3}
                className="w-full h-full max-w-[85px] max-h-[85px] text-[var(--highlight-ink)]"
              />
            )}
            {winner === 'TIE' && (
              <span className="text-xs uppercase tracking-widest text-[var(--ink-soft)] font-mono">
                tie
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
