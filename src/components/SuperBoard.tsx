'use client';

import React from 'react';
import { ConnectionStatus, GameState, OnlineRole } from '@/types/game';
import { isBoardFull } from '@/lib/gameLogic';
import { LocalBoard } from './LocalBoard';

interface SuperBoardProps {
  gameState: GameState;
  onlineRole?: OnlineRole;
  connectionStatus?: ConnectionStatus;
  onCellClick: (boardIdx: number, cellIdx: number) => void;
}

export const SuperBoard: React.FC<SuperBoardProps> = ({
  gameState,
  onlineRole,
  connectionStatus,
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
    gameMode,
    currentPlayer,
  } = gameState;

  const isMyTurnOnline =
    gameMode === 'online'
      ? connectionStatus === 'connected' &&
        ((onlineRole === 'host' && currentPlayer === 'X') ||
          (onlineRole === 'guest' && currentPlayer === 'O'))
      : true;

  const isBoardDisabled =
    winner !== null ||
    isAiThinking ||
    (gameMode === 'online' && !isMyTurnOnline);

  return (
    <div className="relative w-full max-w-[460px] sm:max-w-[480px] aspect-square mx-auto select-none p-1 sm:p-2">
      {/* 3x3 Grid of 9 Sectors with gap-0 and continuous main divider lines */}
      <div className="grid grid-cols-3 grid-rows-3 w-full h-full gap-0">
        {boardWinners.map((boardWinner, boardIdx) => {
          const isActive =
            winner === null &&
            (gameMode !== 'online' || connectionStatus === 'connected') &&
            (activeBoard === null
              ? boardWinner === null && !isBoardFull(cells[boardIdx])
              : activeBoard === boardIdx);

          const isGlobalWin =
            globalWinningLine !== null && globalWinningLine.includes(boardIdx);

          const isFogged =
            Boolean(gameState.modifiers?.fogOfWar) &&
            winner === null &&
            !isActive &&
            boardWinner === null &&
            !cells[boardIdx].some((c) => c !== null);

          // Authentic main divider borders (thicker, continuous ink lines)
          const isRightCol = boardIdx % 3 === 2;
          const isBottomRow = boardIdx >= 6;

          return (
            <div
              key={boardIdx}
              className={`relative w-full h-full min-w-0 min-h-0 flex items-stretch justify-stretch ${
                !isRightCol ? 'border-r-2 sm:border-r-[2.5px] border-[var(--super-line)]' : ''
              } ${
                !isBottomRow ? 'border-b-2 sm:border-b-[2.5px] border-[var(--super-line)]' : ''
              }`}
            >
              <LocalBoard
                boardIdx={boardIdx}
                cells={cells[boardIdx]}
                winner={boardWinner}
                winningLine={boardWinningLines[boardIdx]}
                isActive={isActive}
                isGlobalWinningBoard={isGlobalWin}
                isFogged={isFogged}
                lastMove={lastMove}
                onCellClick={onCellClick}
                disabled={isBoardDisabled || isFogged}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
