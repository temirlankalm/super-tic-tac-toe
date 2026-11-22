'use client';

import React from 'react';
import { BoardWinner, CellState, Move } from '@/types/game';
import { Cell } from './Cell';
import { HandDrawnO, HandDrawnX } from './hand-drawn/HandDrawnMarks';

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
      className={`relative w-full h-full p-1 sm:p-1.5 rounded-xl transition-all duration-300 flex flex-col ${
        isActive && !isResolved
          ? 'bg-[var(--active-board-bg)] active-board-indicator'
          : 'bg-transparent'
      } ${
        isGlobalWinningBoard
          ? 'ring-1.5 ring-[var(--highlight-ink)] bg-[var(--active-board-bg)]'
          : ''
      }`}
    >
      {/* 3x3 Internal Cell Grid */}
      <div className="grid grid-cols-3 grid-rows-3 w-full h-full flex-1 gap-0">
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
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-[var(--bg)]/90 backdrop-blur-[1px] animate-fade-up select-none pointer-events-none p-3 sm:p-5">
          {winner === 'X' && (
            <HandDrawnX
              variant={boardIdx % 3}
              className="w-full h-full max-w-[90px] max-h-[90px] text-[var(--highlight-ink)]"
            />
          )}
          {winner === 'O' && (
            <HandDrawnO
              variant={boardIdx % 3}
              className="w-full h-full max-w-[90px] max-h-[90px] text-[var(--highlight-ink)]"
            />
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
