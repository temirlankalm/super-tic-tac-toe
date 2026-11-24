'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AiDifficulty, GameMode, GameModifiers, GameState, Move, OnlineRole, Player } from '@/types/game';
import { applyMove, createInitialState, getValidMoves, isMoveValid } from '@/lib/gameLogic';
import { getBestAiMove } from '@/lib/ai';
import { getQnetMove, ponderQnet, warmUpQnet } from '@/lib/qnet';

// Thinking time per move for the qnet level when there is no clock.
const QNET_THINK_MS = 1000;
// With a clock, qnet budgets from its remaining time but never thinks longer than this per move.
const QNET_MAX_THINK_MS = 4000;
// Delay before asking qnet: its search already takes a while, so no extra pause is needed. The
// other levels keep the old 420 ms "thinking" pause. Either delay runs on the AI's clock.
const QNET_DELAY_MS = 60;
const AI_DELAY_MS = 420;

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
  onlinePlayer?: Player | null;
  isOnlineConnected?: boolean;
  /** Remaining clock of `player` in ms, or null without a time control. */
  getClockMs?: (player: Player) => number | null;
  initialHumanPlayer?: Player;
}

export function useSuperTicTacToe(options?: UseSuperTicTacToeOptions) {
  const [gameState, setGameState] = useState<GameState>(() =>
    createInitialState('ai', options?.initialHumanPlayer || 'X', 'medium')
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

  // Trigger win confetti dynamically
  const triggerVictory = useCallback((winner: Player) => {
    import('canvas-confetti')
      .then(({ default: confetti }) => {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors:
            winner === 'X'
              ? ['#4e545a', '#7c828a', '#2e3338']
              : ['#64748b', '#94a3b8', '#334155'],
          disableForReducedMotion: true,
        });
      })
      .catch(() => {});
  }, []);

  // Handle cell click by local human player
  const handleCellClick = useCallback(
    (boardIdx: number, cellIdx: number) => {
      setGameState((prev) => {
        // Can't move if game is over or AI is thinking
        if (prev.winner !== null || prev.isAiThinking) {
          return prev;
        }

        // In AI or Daily mode, only allow moves on human turn
        if ((prev.gameMode === 'ai' || prev.gameMode === 'daily') && prev.currentPlayer !== prev.humanPlayer) {
          return prev;
        }

        // In Online mode, check role and connectivity
        if (prev.gameMode === 'online') {
          if (!optionsRef.current?.isOnlineConnected) {
            return prev;
          }
          const expectedPlayer =
            optionsRef.current?.onlinePlayer ||
            (optionsRef.current?.onlineRole === 'host' ? 'X' : 'O');
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
    (boardIdx: number, cellIdx: number, player?: Player) => {
      setGameState((prev) => {
        // Guard against out-of-turn or mismatched remote packet
        if (player && prev.currentPlayer !== player) {
          console.warn(
            `[WebRTC] Rejected out-of-turn move from ${player}, expected ${prev.currentPlayer}`
          );
          return prev;
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

        return next;
      });
    },
    [triggerVictory]
  );

  handleCellClickRef.current = handleCellClick;

  // Speed Blitz 5-second countdown loop: only activates once the game has started (history.length > 0)
  useEffect(() => {
    if (
      !gameState.modifiers?.speedBlitz ||
      gameState.winner !== null ||
      gameState.history.length === 0
    ) {
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
  }, [
    gameState.currentPlayer,
    gameState.modifiers?.speedBlitz,
    gameState.winner,
    gameState.history.length,
  ]);

  // Sync state received from host on init
  const syncState = useCallback((partial: Partial<GameState>) => {
    setGameState((prev) => ({ ...prev, ...partial }));
  }, []);

  // Effect for AI turn
  useEffect(() => {
    const isAiTurn =
      (gameState.gameMode === 'ai' || gameState.gameMode === 'daily') &&
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
          (prev.gameMode === 'ai' || prev.gameMode === 'daily') &&
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
        const clockMs = optionsRef.current?.getClockMs?.(snapshot.currentPlayer) ?? null;
        const budget =
          clockMs === null
            ? QNET_THINK_MS
            : { timeLeftMs: clockMs, ply: snapshot.history.length, overheadMs: 150, maxMs: QNET_MAX_THINK_MS };
        getQnetMove(snapshot, budget).then((move) => {
          if (requestId !== aiRequestRef.current) return; // reset or mode change superseded it
          commitAiMove(move, snapshot.cells);
        });
        return;
      }
      commitAiMove(null, null);
    }, gameStateRef.current.difficulty === 'qnet' ? QNET_DELAY_MS : AI_DELAY_MS);

    return () => clearTimeout(timer);
  }, [
    gameState.currentPlayer,
    gameState.gameMode,
    gameState.humanPlayer,
    gameState.winner,
    triggerVictory,
  ]);

  // While the human thinks, let qnet think about the same position in the background (pondering):
  // its transposition table survives between moves, so the next real search starts deeper. The
  // worker stops pondering as soon as the move request arrives. `ponderKey` changes on every move
  // that hands the turn to the human in a qnet game, and is null otherwise.
  const ponderKey =
    (gameState.gameMode === 'ai' || gameState.gameMode === 'daily') &&
    gameState.difficulty === 'qnet' &&
    gameState.winner === null &&
    gameState.currentPlayer === gameState.humanPlayer &&
    gameState.history.length > 0
      ? gameState.cells
      : null;
  useEffect(() => {
    if (ponderKey !== null) ponderQnet(gameStateRef.current);
  }, [ponderKey]);

  const resetGame = useCallback((nextHumanPlayer?: Player) => {
    aiThinkingRef.current = false;
    aiRequestRef.current++;
    setGameState((prev) =>
      createInitialState(
        prev.gameMode,
        nextHumanPlayer ?? prev.humanPlayer,
        prev.difficulty,
        prev.modifiers
      )
    );
  }, []);

  const setHumanPlayer = useCallback((humanPlayer: Player) => {
    aiThinkingRef.current = false;
    aiRequestRef.current++;
    setGameState((prev) =>
      createInitialState(prev.gameMode, humanPlayer, prev.difficulty, prev.modifiers)
    );
  }, []);

  const undoMove = useCallback(() => {
    aiThinkingRef.current = false;
    aiRequestRef.current++;

    setGameState((prev) => {
      if (prev.history.length === 0) return prev;

      const isVsAi = prev.gameMode === 'ai' || prev.gameMode === 'daily';
      let stepsToUndo = 1;

      if (isVsAi) {
        // If it's the human's turn against AI and at least 2 moves have been played,
        // revert both the AI reply and the human's move in one click.
        if (prev.currentPlayer === prev.humanPlayer && prev.history.length >= 2) {
          stepsToUndo = 2;
        } else {
          // If the AI was thinking (or hadn't replied yet), revert the human's 1 move.
          stepsToUndo = 1;
        }
      }

      const targetHistoryIndex = prev.history.length - stepsToUndo;
      if (targetHistoryIndex < 0) return prev;

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
        playerMoveHistory: targetState.playerMoveHistory
          ? {
              X: targetState.playerMoveHistory.X.map((m) => ({ ...m })),
              O: targetState.playerMoveHistory.O.map((m) => ({ ...m })),
            }
          : { X: [], O: [] },
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
  }, []);

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
  }, []);

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
    setHumanPlayer,
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
