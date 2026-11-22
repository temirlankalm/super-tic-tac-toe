import { AiDifficulty, GameState, Move, Player } from '@/types/game';
import {
  applyMove,
  getValidMoves,
  WINNING_COMBINATIONS,
} from './gameLogic';

export function getBestAiMove(
  state: GameState,
  aiPlayer: Player,
  difficulty: AiDifficulty = 'hard'
): Move | null {
  const validMoves = getValidMoves(state);
  if (validMoves.length === 0) return null;

  const opponent: Player = aiPlayer === 'X' ? 'O' : 'X';

  // 1. EASY: 65% random choice, 35% simple local win/block
  if (difficulty === 'easy') {
    const isRandom = Math.random() < 0.65;
    if (isRandom) {
      const randomIdx = Math.floor(Math.random() * validMoves.length);
      return {
        boardIdx: validMoves[randomIdx].boardIdx,
        cellIdx: validMoves[randomIdx].cellIdx,
        player: aiPlayer,
      };
    }
  }

  let bestMove: { boardIdx: number; cellIdx: number } = validMoves[0];
  let highestScore = -Infinity;

  for (const move of validMoves) {
    const { boardIdx, cellIdx } = move;
    let score = 0;

    // Simulate this move
    const nextState = applyMove(state, boardIdx, cellIdx);

    // 1. Immediate match win (all levels except easy pure random)
    if (nextState.winner === aiPlayer) {
      return { boardIdx, cellIdx, player: aiPlayer };
    }

    // 2. Win this local board?
    const wasWonBefore = state.boardWinners[boardIdx] !== null;
    const isWonNow = nextState.boardWinners[boardIdx] === aiPlayer;
    if (!wasWonBefore && isWonNow) {
      score += 600;

      // In hard mode, check if this board creates a 2-in-a-row threat on global board
      if (difficulty === 'hard') {
        for (const combo of WINNING_COMBINATIONS) {
          if (combo.includes(boardIdx)) {
            const aiCount = combo.filter((idx) => nextState.boardWinners[idx] === aiPlayer).length;
            const oppCount = combo.filter((idx) => nextState.boardWinners[idx] === opponent).length;
            if (aiCount === 2 && oppCount === 0) {
              score += 250;
            }
          }
        }
      }
    }

    // 3. Block opponent from winning this local board?
    const localCells = state.cells[boardIdx];
    for (const combo of WINNING_COMBINATIONS) {
      if (combo.includes(cellIdx)) {
        const otherTwo = combo.filter((c) => c !== cellIdx);
        if (
          localCells[otherTwo[0]] === opponent &&
          localCells[otherTwo[1]] === opponent
        ) {
          score += 400; // blocked local win
        }
      }
    }

    // 4. Strategic consequences (ONLY in HARD mode)
    if (difficulty === 'hard') {
      const targetBoardForOpponent = cellIdx;
      const targetBoardResolved = state.boardWinners[targetBoardForOpponent] !== null;

      if (targetBoardResolved) {
        // Sending opponent to already resolved board gives them FREE PLAY!
        score -= 200;
      } else {
        const targetCells = state.cells[targetBoardForOpponent];
        let opponentCanWinTarget = false;
        for (const combo of WINNING_COMBINATIONS) {
          const oppCount = combo.filter((c) => targetCells[c] === opponent).length;
          const emptyCount = combo.filter((c) => targetCells[c] === null).length;
          if (oppCount === 2 && emptyCount === 1) {
            opponentCanWinTarget = true;
            break;
          }
        }

        if (opponentCanWinTarget) {
          score -= 350; // Dangerous! Sending opponent to an easy win
        } else {
          score += 80;
        }
      }
    }

    // 5. Positional heuristics
    if (cellIdx === 4) {
      score += 40; // Center
    } else if ([0, 2, 6, 8].includes(cellIdx)) {
      score += 20; // Corners
    } else {
      score += 10; // Edges
    }

    // Slight jitter to prevent deterministic repetition
    score += (Math.random() - 0.5) * (difficulty === 'easy' ? 40 : 8);

    if (score > highestScore) {
      highestScore = score;
      bestMove = { boardIdx, cellIdx };
    }
  }

  return {
    boardIdx: bestMove.boardIdx,
    cellIdx: bestMove.cellIdx,
    player: aiPlayer,
  };
}
