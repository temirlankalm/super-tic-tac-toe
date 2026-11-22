import { GameState, Move, Player } from '@/types/game';
import {
  applyMove,
  getValidMoves,
  WINNING_COMBINATIONS,
} from './gameLogic';

export function getBestAiMove(state: GameState, aiPlayer: Player): Move | null {
  const validMoves = getValidMoves(state);
  if (validMoves.length === 0) return null;

  const opponent: Player = aiPlayer === 'X' ? 'O' : 'X';

  let bestMove: { boardIdx: number; cellIdx: number } = validMoves[0];
  let highestScore = -Infinity;

  for (const move of validMoves) {
    const { boardIdx, cellIdx } = move;
    let score = 0;

    // Simulate this move
    const nextState = applyMove(state, boardIdx, cellIdx);

    // 1. Did AI win the entire match?
    if (nextState.winner === aiPlayer) {
      return { boardIdx, cellIdx, player: aiPlayer }; // Instant instant win!
    }

    // 2. Did AI win this local board?
    const wasWonBefore = state.boardWinners[boardIdx] !== null;
    const isWonNow = nextState.boardWinners[boardIdx] === aiPlayer;
    if (!wasWonBefore && isWonNow) {
      score += 600;

      // Bonus if this board contributes to a 2-in-a-row on global board
      for (const combo of WINNING_COMBINATIONS) {
        if (combo.includes(boardIdx)) {
          const aiCount = combo.filter((idx) => nextState.boardWinners[idx] === aiPlayer).length;
          const oppCount = combo.filter((idx) => nextState.boardWinners[idx] === opponent).length;
          if (aiCount === 2 && oppCount === 0) {
            score += 250; // Threat of global win
          }
        }
      }
    }

    // 3. Did move block opponent from winning this local board?
    const localCells = state.cells[boardIdx];
    for (const combo of WINNING_COMBINATIONS) {
      if (combo.includes(cellIdx)) {
        const otherTwo = combo.filter((c) => c !== cellIdx);
        if (
          localCells[otherTwo[0]] === opponent &&
          localCells[otherTwo[1]] === opponent
        ) {
          score += 400; // blocked opponent from taking local board
        }
      }
    }

    // 4. Consequence: Where does this move send the opponent?
    // The target board for the opponent is `cellIdx`
    const targetBoardForOpponent = cellIdx;
    const targetBoardResolved = state.boardWinners[targetBoardForOpponent] !== null;

    if (targetBoardResolved) {
      // Sending opponent to an already resolved board triggers FREE PLAY!
      // Free play gives opponent complete freedom across the whole board.
      score -= 200;
    } else {
      // Opponent is forced into targetBoardForOpponent
      const targetCells = state.cells[targetBoardForOpponent];

      // Does the opponent have a 2-in-a-row on target board where they could immediately win?
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
        score -= 350; // Dangerous! Sending opponent right into an easy win
      } else {
        score += 80; // Good control, forced opponent into a non-threatening board
      }
    }

    // 5. Positional heuristics within local board
    if (cellIdx === 4) {
      score += 45; // Center is strategically dominant
    } else if ([0, 2, 6, 8].includes(cellIdx)) {
      score += 25; // Corners are next best
    } else {
      score += 10; // Edges
    }

    // 6. Global board position (center board is more valuable)
    if (boardIdx === 4) {
      score += 35;
    }

    // 7. Slight jitter to prevent totally predictable gameplay
    score += (Math.random() - 0.5) * 8;

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
