'use client';

import React from 'react';
import { BoardWinner, CellState, Move } from '@/types/game';
import { Cell } from './Cell';
import { HandDrawnO, HandDrawnX } from './hand-drawn/HandDrawnMarks';
import { HandDrawnLocalGrid } from './hand-drawn/HandDrawnLocalGrid';
import { PencilLineStrike, PencilSectorCircle } from './hand-drawn/HandDrawnOverlays';

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
  focusedCell?: { boardIdx: number; cellIdx: number } | null;
  onFocusCell?: (boardIdx: number, cellIdx: number) => void;
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
  focusedCell,
  onFocusCell,
}) => {
  const isResolved = winner !== null;

  return (
    <div
      className={`relative w-full h-full p-1 sm:p-2 transition-colors duration-200 flex flex-col justify-center items-center ${
        isGlobalWinningBoard
          ? 'bg-[var(--accent-wash-strong)] rounded-[7px_4px_8px_5px]'
          : isActive && !isResolved
            ? 'bg-[var(--active-board-bg)] rounded-[7px_4px_8px_5px] shadow-[inset_0_0_0_1.5px_var(--active-board-border)]'
            : 'bg-transparent'
      }`}
    >
      {/* Container box where both grid lines and cells share the exact same bounds */}
      <div className="relative w-full h-full aspect-square">
        {/* Authentic Hand-Drawn 3x3 Grid Lines for this Sector */}
        <div
          className={`absolute inset-0 pointer-events-none text-[var(--highlight-ink)] transition-opacity duration-200 z-0 ${
            isActive && !isResolved ? 'opacity-95' : isResolved ? 'opacity-35' : 'opacity-72'
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
                  tabIndex={
                    focusedCell
                      ? focusedCell.boardIdx === boardIdx && focusedCell.cellIdx === cellIdx
                        ? 0
                        : -1
                      : boardIdx === 4 && cellIdx === 4
                      ? 0
                      : -1
                  }
                  isFocused={
                    Boolean(
                      focusedCell &&
                        focusedCell.boardIdx === boardIdx &&
                        focusedCell.cellIdx === cellIdx
                    )
                  }
                  onFocus={() => onFocusCell?.(boardIdx, cellIdx)}
                  onClick={() => onCellClick(boardIdx, cellIdx)}
                  boardIdx={boardIdx}
                  cellIdx={cellIdx}
                />
              </div>
            );
          })}
        </div>

        {/* Local sector winning line pencil strike-through */}
        {winningLine && winningLine.length === 3 && (
          <PencilLineStrike
            line={winningLine}
            size={100}
            className="absolute inset-0 w-full h-full z-15"
          />
        )}

        {/* Resolved Overlay (when a player won this mini-board or tied) */}
        {isResolved && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-[var(--surface)]/78 backdrop-blur-[0.5px] animate-fade-up select-none pointer-events-none p-2 sm:p-2.5 rounded-[4px]">
            {(winner === 'X' || winner === 'O') && (
              <PencilSectorCircle
                variant={boardIdx}
                isGlobalWinningBoard={isGlobalWinningBoard}
                className="absolute inset-1 w-[calc(100%-0.5rem)] h-[calc(100%-0.5rem)]"
              />
            )}
            {winner === 'X' && (
              <HandDrawnX
                variant={boardIdx % 3}
                className="relative z-10 w-[72%] h-[72%] max-w-[78px] max-h-[78px] text-[var(--highlight-ink)]"
              />
            )}
            {winner === 'O' && (
              <HandDrawnO
                variant={boardIdx % 3}
                className="relative z-10 w-[72%] h-[72%] max-w-[78px] max-h-[78px] text-[var(--highlight-ink)]"
              />
            )}
            {winner === 'TIE' && (
              <span className="font-hand text-base sm:text-lg tracking-wide text-[var(--ink-soft)] border border-dashed border-[var(--line-strong)] px-2 py-0.5 rounded-[6px_4px_7px_5px] bg-[var(--bg)]/80">
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
