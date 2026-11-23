'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { AiDifficulty, GameMode, GameModifiers, GameState, Move, OnlineRole, Player } from '@/types/game';
import { applyMove, createInitialState, getValidMoves, isMoveValid } from '@/lib/gameLogic';
import { getBestAiMove } from '@/lib/ai';
import { getQnetMove, warmUpQnet } from '@/lib/qnet';

// Thinking time per move for the qnet level (the engine searches until this budget is used).
const QNET_THINK_MS = 1000;

export interface MoveEvent {
  player: Player;
  isSectorWon: boolean;
  isGameWon: boolean;
  isTie: boolean;
}

export interface UseSuperTicTacToeOptions {
  onMove?: (event: MoveEvent) => void;
  onLocalMove?: (boardIdx: number, cellIdx: number, player: Player) => void;
  onlineRole?: OnlineRole;
  isOnlineConnected?: boolean;
}

export function useSuperTicTacToe(options?: UseSuperTicTacToeOptions) {
  const [gameState, setGameState] = useState<GameState>(() =>
    createInitialState('ai', 'X', 'hard')
  );

  const [speedBlitzTime, setSpeedBlitzTime] = useState<number>(5.0);
  const handleCellClickRef = useRef<(boardIdx: number, cellIdx: number) => void>(() => {});
  const aiThinkingRef = useRef(false);

  const toggleModifier = useCallback((modKey: keyof GameModifiers) => {
    setGameState((prev) => ({
      ...prev,
      modifiers: {
        ...prev.modifiers,
        [modKey]: !prev.modifiers[modKey],
      },
    }));
  }, []);

  const setModifiers = useCallback((newModifiers: GameModifiers) => {
    setGameState((prev) => ({
      ...prev,
      modifiers: { ...newModifiers },
    }));
  }, []);
  const gameStateRef = useRef(gameState);
  useEffect(() => {
    gameStateRef.current = gameState;
  });
  const aiRequestRef = useRef(0);
  const optionsRef = useRef(options);
  optionsRef.current = options;

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

  // Handle cell click by local human player
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

        // In Online mode, check role and connectivity
        if (prev.gameMode === 'online') {
          if (!optionsRef.current?.isOnlineConnected) {
            return prev;
          }
          const expectedPlayer = optionsRef.current?.onlineRole === 'host' ? 'X' : 'O';
          if (prev.currentPlayer !== expectedPlayer) {
            return prev;
          }
        }

        if (!isMoveValid(prev, boardIdx, cellIdx)) {
          return prev;
        }

        const prevBoardWon = prev.boardWinners[boardIdx] !== null;
        const next = applyMove(prev, boardIdx, cellIdx);
        const isSectorWon = !prevBoardWon && next.boardWinners[boardIdx] !== null;
        const isGameWon = prev.winner === null && (next.winner === 'X' || next.winner === 'O');
        const isTie = prev.winner === null && next.winner === 'TIE';

        if (next.winner === 'X' || next.winner === 'O') {
          triggerVictory(next.winner);
        }

        optionsRef.current?.onMove?.({
          player: prev.currentPlayer,
          isSectorWon,
          isGameWon,
          isTie,
        });

        // Notify peer about local move in online mode
        optionsRef.current?.onLocalMove?.(boardIdx, cellIdx, prev.currentPlayer);

        return next;
      });
    },
    [triggerVictory]
  );

  // Apply a remote move received over WebRTC
  const applyRemoteMove = useCallback(
    (boardIdx: number, cellIdx: number) => {
      setGameState((prev) => {
        if (!isMoveValid(prev, boardIdx, cellIdx)) {
          return prev;
        }

        const prevBoardWon = prev.boardWinners[boardIdx] !== null;
        const next = applyMove(prev, boardIdx, cellIdx);
        const isSectorWon = !prevBoardWon && next.boardWinners[boardIdx] !== null;
        const isGameWon = prev.winner === null && (next.winner === 'X' || next.winner === 'O');
        const isTie = prev.winner === null && next.winner === 'TIE';

        if (next.winner === 'X' || next.winner === 'O') {
          triggerVictory(next.winner);
        }

        optionsRef.current?.onMove?.({
          player: prev.currentPlayer,
          isSectorWon,
          isGameWon,
          isTie,
        });

        return next;
      });
    },
    [triggerVictory]
  );

  handleCellClickRef.current = handleCellClick;

  // Speed Blitz 5-second countdown loop
  useEffect(() => {
    if (!gameState.modifiers?.speedBlitz || gameState.winner !== null) {
      setSpeedBlitzTime(5.0);
      return;
    }

    setSpeedBlitzTime(5.0);
    const interval = setInterval(() => {
      setSpeedBlitzTime((curr) => {
        const next = Math.max(0, curr - 0.1);
        if (next <= 0) {
          clearInterval(interval);
          const snapshot = gameStateRef.current;
          if (snapshot.winner === null && !snapshot.isAiThinking) {
            const valids = getValidMoves(snapshot);
            if (valids.length > 0) {
              const randomMove = valids[Math.floor(Math.random() * valids.length)];
              handleCellClickRef.current(randomMove.boardIdx, randomMove.cellIdx);
            }
          }
          return 5.0;
        }
        return parseFloat(next.toFixed(1));
      });
    }, 100);

    return () => clearInterval(interval);
  }, [gameState.currentPlayer, gameState.modifiers?.speedBlitz, gameState.winner]);

  // Sync state received from host on init
  const syncState = useCallback((partial: Partial<GameState>) => {
    setGameState((prev) => ({ ...prev, ...partial }));
  }, []);

  // Effect for AI turn
  useEffect(() => {
    const isAiTurn =
      gameState.gameMode === 'ai' &&
      gameState.winner === null &&
      gameState.currentPlayer !== gameState.humanPlayer;

    if (!isAiTurn || aiThinkingRef.current) return;

    aiThinkingRef.current = true;
    setGameState((prev) => ({ ...prev, isAiThinking: true }));

    // Plays the AI's move on the latest state. `preferred` is the engine's answer for qnet;
    // without one (or if it is unusable) the built-in AI chooses, so a qnet game never stalls.
    const commitAiMove = (preferred: Move | null, expectedCells: GameState['cells'] | null) => {
      setGameState((prev) => {
        const stillAiTurn =
          prev.gameMode === 'ai' &&
          prev.winner === null &&
          prev.currentPlayer !== prev.humanPlayer &&
          (expectedCells === null || prev.cells === expectedCells);

        if (!stillAiTurn) {
          aiThinkingRef.current = false;
          return { ...prev, isAiThinking: false };
        }

        const aiPlayer: Player = prev.humanPlayer === 'X' ? 'O' : 'X';
        const bestMove =
          preferred ?? getBestAiMove(prev, aiPlayer, prev.difficulty === 'qnet' ? 'hard' : prev.difficulty);

        aiThinkingRef.current = false;

        if (!bestMove) {
          return { ...prev, isAiThinking: false };
        }

        const prevBoardWon = prev.boardWinners[bestMove.boardIdx] !== null;
        const next = applyMove(prev, bestMove.boardIdx, bestMove.cellIdx);
        const isSectorWon = !prevBoardWon && next.boardWinners[bestMove.boardIdx] !== null;
        const isGameWon = prev.winner === null && (next.winner === 'X' || next.winner === 'O');
        const isTie = prev.winner === null && next.winner === 'TIE';

        if (next.winner === 'X' || next.winner === 'O') {
          triggerVictory(next.winner);
        }

        optionsRef.current?.onMove?.({
          player: aiPlayer,
          isSectorWon,
          isGameWon,
          isTie,
        });

        return { ...next, isAiThinking: false };
      });
    };

    const timer = setTimeout(() => {
      const snapshot = gameStateRef.current;
      if (snapshot.difficulty === 'qnet') {
        const requestId = ++aiRequestRef.current;
        getQnetMove(snapshot, QNET_THINK_MS).then((move) => {
          if (requestId !== aiRequestRef.current) return; // reset or mode change superseded it
          commitAiMove(move, snapshot.cells);
        });
        return;
      }
      commitAiMove(null, null);
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
    aiRequestRef.current++;
    setGameState((prev) => createInitialState(prev.gameMode, prev.humanPlayer, prev.difficulty, prev.modifiers));
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

  const setGameMode = useCallback((mode: GameMode) => {
    aiThinkingRef.current = false;
    aiRequestRef.current++;
    setGameState((prev) => createInitialState(mode, prev.humanPlayer, prev.difficulty, prev.modifiers));
  }, []);

  const toggleGameMode = useCallback(() => {
    aiThinkingRef.current = false;
    aiRequestRef.current++;
    setGameState((prev) => {
      const modes: GameMode[] = ['ai', 'pvp', 'online'];
      const currentIndex = modes.indexOf(prev.gameMode);
      const nextMode = modes[(currentIndex + 1) % modes.length];
      return createInitialState(nextMode, prev.humanPlayer, prev.difficulty, prev.modifiers);
    });
  }, []);

  const setDifficulty = useCallback((difficulty: AiDifficulty) => {
    if (difficulty === 'qnet') warmUpQnet();
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

  const handleResign = useCallback((resigningPlayer: Player) => {
    const winnerPlayer: Player = resigningPlayer === 'X' ? 'O' : 'X';
    setGameState((prev) => {
      if (prev.winner !== null) return prev;
      return {
        ...prev,
        winner: winnerPlayer,
        winReason: 'resignation',
      };
    });
    triggerVictory(winnerPlayer);
  }, [triggerVictory]);

  const handleDraw = useCallback(() => {
    setGameState((prev) => {
      if (prev.winner !== null) return prev;
      return {
        ...prev,
        winner: 'TIE',
        winReason: 'agreement',
      };
    });
  }, []);

  return {
    gameState,
    speedBlitzTime,
    handleCellClick,
    applyRemoteMove,
    syncState,
    resetGame,
    undoMove,
    setGameMode,
    toggleGameMode,
    setDifficulty,
    toggleModifier,
    setModifiers,
    handleTimeout,
    handleResign,
    handleDraw,
  };
}
