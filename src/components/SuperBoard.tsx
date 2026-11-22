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
    <div className="w-full max-w-[540px] aspect-square mx-auto select-none flex flex-col">
      {/* 3x3 Grid of Local Boards */}
      <div className="grid grid-cols-3 grid-rows-3 w-full h-full gap-1.5 sm:gap-2 md:gap-3 p-1.5 sm:p-2 md:p-3 rounded-2xl border border-[var(--line)] bg-[var(--bg-subtle)]/50 shadow-xs">
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
              className="relative w-full h-full min-w-0 min-h-0 border border-[var(--line-strong)] rounded-xl overflow-hidden transition-all duration-200 flex items-stretch justify-stretch"
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
