'use client';

import React from 'react';
import { BoardWinner, CellState, Move } from '@/types/game';
import { Cell } from './Cell';

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
      className={`relative aspect-square p-1.5 md:p-2 rounded-lg transition-all duration-300 ${
        isActive && !isResolved
          ? 'bg-[var(--active-board-bg)] active-board-indicator'
          : 'bg-transparent'
      } ${
        isGlobalWinningBoard
          ? 'ring-2 ring-[var(--highlight-ink)] bg-[var(--active-board-bg)]'
          : ''
      }`}
    >
      {/* 3x3 Internal Cell Grid */}
      <div className="grid grid-cols-3 grid-rows-3 h-full w-full gap-0">
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

          // Grid borders inside the local 3x3
          const borderClasses = [
            cellIdx % 3 !== 2 ? 'border-r border-[var(--line)]' : '',
            cellIdx < 6 ? 'border-b border-[var(--line)]' : '',
          ].join(' ');

          return (
            <div key={cellIdx} className={`h-full w-full ${borderClasses}`}>
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
        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-[var(--bg)]/85 backdrop-blur-[1px] animate-fade-up select-none pointer-events-none">
          {winner === 'X' && (
            <span className="text-5xl md:text-6xl font-light text-[var(--highlight-ink)] leading-none">
              ✕
            </span>
          )}
          {winner === 'O' && (
            <span className="text-5xl md:text-6xl font-light text-[var(--highlight-ink)] leading-none">
              ○
            </span>
          )}
          {winner === 'TIE' && (
            <span className="text-3xl font-light text-[var(--ink-mute)] tracking-widest">
              —
            </span>
          )}
        </div>
      )}
    </div>
  );
};
