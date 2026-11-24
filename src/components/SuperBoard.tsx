'use client';

import React, { useState, useCallback } from 'react';
import { ConnectionStatus, GameState, OnlineRole, Player } from '@/types/game';
import { isBoardFull } from '@/lib/gameLogic';
import { LocalBoard } from './LocalBoard';
import { PencilLineStrike } from './hand-drawn/HandDrawnOverlays';

interface SuperBoardProps {
  gameState: GameState;
  onlineRole?: OnlineRole;
  onlinePlayer?: Player | null;
  connectionStatus?: ConnectionStatus;
  onCellClick: (boardIdx: number, cellIdx: number) => void;
}

export const SuperBoard: React.FC<SuperBoardProps> = ({
  gameState,
  onlineRole,
  onlinePlayer,
  connectionStatus,
  onCellClick,
}) => {
  const [focusedCell, setFocusedCell] = useState<{ boardIdx: number; cellIdx: number } | null>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const current = focusedCell || { boardIdx: 4, cellIdx: 4 };
      let row = Math.floor(current.boardIdx / 3) * 3 + Math.floor(current.cellIdx / 3);
      let col = (current.boardIdx % 3) * 3 + (current.cellIdx % 3);

      switch (e.key) {
        case 'ArrowUp':
          row = Math.max(0, row - 1);
          break;
        case 'ArrowDown':
          row = Math.min(8, row + 1);
          break;
        case 'ArrowLeft':
          col = Math.max(0, col - 1);
          break;
        case 'ArrowRight':
          col = Math.min(8, col + 1);
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          onCellClick(current.boardIdx, current.cellIdx);
          return;
        default:
          return;
      }

      e.preventDefault();
      const nextBoardIdx = Math.floor(row / 3) * 3 + Math.floor(col / 3);
      const nextCellIdx = (row % 3) * 3 + (col % 3);
      setFocusedCell({ boardIdx: nextBoardIdx, cellIdx: nextCellIdx });
    },
    [focusedCell, onCellClick]
  );
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
        (onlinePlayer
          ? currentPlayer === onlinePlayer
          : (onlineRole === 'host' && currentPlayer === 'X') ||
            (onlineRole === 'guest' && currentPlayer === 'O'))
      : true;

  const isBoardDisabled =
    winner !== null ||
    isAiThinking ||
    (gameMode === 'online' && !isMyTurnOnline);

  return (
    <div
      role="grid"
      aria-label="Super Tic-Tac-Toe 9x9 Board"
      onKeyDown={handleKeyDown}
      className="pencil-sheet relative w-full max-w-[min(430px,calc(100vw-1.5rem),calc(100dvh-250px))] sm:max-w-[min(540px,calc(100vw-2rem),calc(100dvh-225px))] aspect-square mx-auto select-none p-2 sm:p-3.5"
    >
      {/* 3x3 Grid of 9 Sectors with gap-0 and continuous main divider lines */}
      <div className="relative grid grid-cols-3 grid-rows-3 w-full h-full gap-0">
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
                fadingInk={Boolean(gameState.modifiers?.fadingInk)}
                playerMoveHistory={gameState.playerMoveHistory}
                lastMove={lastMove}
                onCellClick={onCellClick}
                disabled={isBoardDisabled || isFogged}
                focusedCell={focusedCell}
                onFocusCell={(b, c) => setFocusedCell({ boardIdx: b, cellIdx: c })}
              />
            </div>
          );
        })}

        {/* Global 3-sector win strike-through */}
        {globalWinningLine && globalWinningLine.length === 3 && (
          <PencilLineStrike
            line={globalWinningLine}
            size={300}
            heavy
            className="absolute inset-0 w-full h-full z-30"
          />
        )}
      </div>
    </div>
  );
};
