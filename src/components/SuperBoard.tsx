'use client';

import React from 'react';
import { GameState } from '@/types/game';
import { isBoardFull } from '@/lib/gameLogic';
import { LocalBoard } from './LocalBoard';

interface SuperBoardProps {
  gameState: GameState;
  onCellClick: (boardIdx: number, cellIdx: number) => void;
}

export const SuperBoard: React.FC<SuperBoardProps> = ({
  gameState,
  onCellClick,
}) => {
  const {
    cells,
    boardWinners,
    boardWinningLines,
    activeBoard,
    globalWinningLine,
    lastMove,
    winner,
    isAiThinking,
  } = gameState;

  return (
    <div className="relative w-full max-w-[500px] aspect-square mx-auto select-none flex flex-col p-2">
      {/* 3x3 Grid of 9 Sectors */}
      <div className="grid grid-cols-3 grid-rows-3 w-full h-full gap-2 sm:gap-3">
        {boardWinners.map((boardWinner, boardIdx) => {
          const isActive =
            winner === null &&
            (activeBoard === null
              ? boardWinner === null && !isBoardFull(cells[boardIdx])
              : activeBoard === boardIdx);

          const isGlobalWin =
            globalWinningLine !== null && globalWinningLine.includes(boardIdx);

          // Divider borders between the 3x3 global sectors
          const borderClasses = [
            boardIdx % 3 !== 2 ? 'border-r border-[var(--line-strong)]' : '',
            boardIdx < 6 ? 'border-b border-[var(--line-strong)]' : '',
          ].join(' ');

          return (
            <div
              key={boardIdx}
              className={`relative w-full h-full min-w-0 min-h-0 flex items-stretch justify-stretch p-1 ${borderClasses}`}
            >
              <LocalBoard
                boardIdx={boardIdx}
                cells={cells[boardIdx]}
                winner={boardWinner}
                winningLine={boardWinningLines[boardIdx]}
                isActive={isActive}
                isGlobalWinningBoard={isGlobalWin}
                lastMove={lastMove}
                onCellClick={onCellClick}
                disabled={winner !== null || isAiThinking}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
