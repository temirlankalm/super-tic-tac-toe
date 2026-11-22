'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { AiDifficulty, GameState, Player } from '@/types/game';
import { applyMove, createInitialState, isMoveValid } from '@/lib/gameLogic';
import { getBestAiMove } from '@/lib/ai';

export function useSuperTicTacToe() {
  const [gameState, setGameState] = useState<GameState>(() =>
    createInitialState('ai', 'X', 'hard')
  );

  const aiThinkingRef = useRef(false);

  // Trigger win confetti
  const triggerVictory = useCallback((winner: Player) => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: winner === 'X' ? ['#4e545a', '#7c828a', '#2e3338'] : ['#64748b', '#94a3b8', '#334155'],
      disableForReducedMotion: true,
    });
  }, []);

  // Handle cell click by human player
  const handleCellClick = useCallback(
    (boardIdx: number, cellIdx: number) => {
      setGameState((prev) => {
        // Can't move if game is over or AI is thinking
        if (prev.winner !== null || prev.isAiThinking) {
          return prev;
        }

        // In AI mode, only allow moves on human turn
        if (prev.gameMode === 'ai' && prev.currentPlayer !== prev.humanPlayer) {
          return prev;
        }

        if (!isMoveValid(prev, boardIdx, cellIdx)) {
          return prev;
        }

        const next = applyMove(prev, boardIdx, cellIdx);
        if (next.winner === 'X' || next.winner === 'O') {
          triggerVictory(next.winner);
        }
        return next;
      });
    },
    [triggerVictory]
  );

  // Effect for AI turn
  useEffect(() => {
    const isAiTurn =
      gameState.gameMode === 'ai' &&
      gameState.winner === null &&
      gameState.currentPlayer !== gameState.humanPlayer;

    if (!isAiTurn || aiThinkingRef.current) return;

    aiThinkingRef.current = true;
    setGameState((prev) => ({ ...prev, isAiThinking: true }));

    const timer = setTimeout(() => {
      setGameState((prev) => {
        const stillAiTurn =
          prev.gameMode === 'ai' &&
          prev.winner === null &&
          prev.currentPlayer !== prev.humanPlayer;

        if (!stillAiTurn) {
          aiThinkingRef.current = false;
          return { ...prev, isAiThinking: false };
        }

        const aiPlayer: Player = prev.humanPlayer === 'X' ? 'O' : 'X';
        const bestMove = getBestAiMove(prev, aiPlayer, prev.difficulty);

        aiThinkingRef.current = false;

        if (!bestMove) {
          return { ...prev, isAiThinking: false };
        }

        const next = applyMove(prev, bestMove.boardIdx, bestMove.cellIdx);
        if (next.winner === 'X' || next.winner === 'O') {
          triggerVictory(next.winner);
        }
        return { ...next, isAiThinking: false };
      });
    }, 420);

    return () => clearTimeout(timer);
  }, [
    gameState.currentPlayer,
    gameState.gameMode,
    gameState.humanPlayer,
    gameState.winner,
    triggerVictory,
  ]);

  const resetGame = useCallback(() => {
    aiThinkingRef.current = false;
    setGameState((prev) => createInitialState(prev.gameMode, prev.humanPlayer, prev.difficulty));
  }, []);

  const undoMove = useCallback(() => {
    setGameState((prev) => {
      if (prev.isAiThinking || prev.history.length === 0) return prev;

      // In AI mode, undo 2 steps (AI move + human move) if possible
      const stepsToUndo =
        prev.gameMode === 'ai' && prev.history.length >= 2 ? 2 : 1;

      const targetHistoryIndex = prev.history.length - stepsToUndo;
      const targetState = prev.history[targetHistoryIndex];

      const newHistory = prev.history.slice(0, targetHistoryIndex);

      return {
        ...prev,
        cells: targetState.cells,
        boardWinners: targetState.boardWinners,
        boardWinningLines: targetState.boardWinningLines,
        currentPlayer: targetState.currentPlayer,
        activeBoard: targetState.activeBoard,
        lastMove: targetState.lastMove,
        winner: null,
        globalWinningLine: null,
        history: newHistory,
        isAiThinking: false,
      };
    });
  }, []);

  const toggleGameMode = useCallback(() => {
    aiThinkingRef.current = false;
    setGameState((prev) => {
      const nextMode = prev.gameMode === 'ai' ? 'pvp' : 'ai';
      return createInitialState(nextMode, prev.humanPlayer, prev.difficulty);
    });
  }, []);

  const setDifficulty = useCallback((difficulty: AiDifficulty) => {
    setGameState((prev) => ({ ...prev, difficulty }));
  }, []);

  const handleTimeout = useCallback((timedOutPlayer: Player) => {
    const winnerPlayer: Player = timedOutPlayer === 'X' ? 'O' : 'X';
    setGameState((prev) => {
      if (prev.winner !== null) return prev;
      return {
        ...prev,
        winner: winnerPlayer,
        winReason: 'timeout',
      };
    });
    triggerVictory(winnerPlayer);
  }, [triggerVictory]);

  return {
    gameState,
    handleCellClick,
    resetGame,
    undoMove,
    toggleGameMode,
    setDifficulty,
    handleTimeout,
  };
}
