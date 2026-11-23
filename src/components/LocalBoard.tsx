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
  isFogged?: boolean;
  fadingInk?: boolean;
  playerMoveHistory?: {
    X: { boardIdx: number; cellIdx: number }[];
    O: { boardIdx: number; cellIdx: number }[];
  };
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
  isFogged,
  fadingInk,
  playerMoveHistory,
  lastMove,
  onCellClick,
  disabled,
}) => {
  const isResolved = winner !== null;

  return (
    <div
      className={`relative w-full h-full p-1 sm:p-2.5 transition-colors duration-200 flex flex-col justify-center items-center ${
        isActive && !isResolved
          ? 'bg-[var(--active-board-bg)] ring-2 ring-[var(--active-board-border)] shadow-xs'
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

            let cellOpacity: number | undefined = undefined;
            let isExpiringSoon = false;

            if (fadingInk && cellValue && playerMoveHistory) {
              const history = playerMoveHistory[cellValue];
              if (history) {
                const moveIndex = history.findIndex(
                  (m) => m.boardIdx === boardIdx && m.cellIdx === cellIdx
                );
                if (moveIndex !== -1) {
                  const age = history.length - 1 - moveIndex;
                  if (age === 0) cellOpacity = 1.0;
                  else if (age === 1) cellOpacity = 0.75;
                  else if (age === 2) cellOpacity = 0.50;
                  else if (age >= 3) {
                    cellOpacity = 0.28;
                    isExpiringSoon = true;
                  }
                }
              }
            }

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
                  opacity={cellOpacity}
                  isExpiringSoon={isExpiringSoon}
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

        {/* Fog of War Overlay */}
        {isFogged && !isResolved && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-[var(--bg)]/50 backdrop-blur-[1.5px] transition-all duration-300 pointer-events-none select-none rounded-[2px]">
            <div className="flex flex-col items-center gap-1 opacity-25">
              <div className="w-1.5 h-1.5 rounded-full border border-[var(--ink-mute)]" />
              <span className="text-[8.5px] uppercase tracking-widest text-[var(--ink-mute)] font-mono">
                fog
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
