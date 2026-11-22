'use client';

import React from 'react';
import { GameState } from '@/types/game';
import { isBoardFull } from '@/lib/gameLogic';
import { LocalBoard } from './LocalBoard';
import { HandDrawnBoard } from './hand-drawn/HandDrawnBoard';

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
    <div className="relative w-full max-w-[520px] aspect-square mx-auto select-none flex flex-col p-1 sm:p-2">
      {/* Hand-drawn board lines from Canva */}
      <div className="absolute inset-1 sm:inset-2 pointer-events-none text-[var(--ink)] opacity-70 z-0">
        <HandDrawnBoard className="w-full h-full" />
      </div>

      {/* 3x3 Grid of Interactive Local Boards */}
      <div className="relative z-10 grid grid-cols-3 grid-rows-3 w-full h-full gap-1.5 sm:gap-2 p-1 sm:p-2 rounded-2xl">
        {boardWinners.map((boardWinner, boardIdx) => {
          // If activeBoard is null (free play), any unresolved, non-full board is active!
          const isActive =
            winner === null &&
            (activeBoard === null
              ? boardWinner === null && !isBoardFull(cells[boardIdx])
              : activeBoard === boardIdx);

          const isGlobalWin =
            globalWinningLine !== null && globalWinningLine.includes(boardIdx);

          return (
            <div
              key={boardIdx}
              className={`relative w-full h-full min-w-0 min-h-0 rounded-xl transition-all duration-200 flex items-stretch justify-stretch ${
                isActive ? 'bg-[var(--active-board-bg)]' : ''
              }`}
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
