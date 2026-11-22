import { AiDifficulty, GameState, Move, Player } from '@/types/game';
import {
  applyMove,
  getValidMoves,
  isBoardFull,
  WINNING_COMBINATIONS,
} from './gameLogic';

// Weight multiplier for each of the 9 local boards on the global board
// Center board (4) is critical (4 winning lines). Corners (0, 2, 6, 8) have 3. Edges have 2.
const BOARD_WEIGHTS = [1.1, 0.85, 1.1, 0.85, 1.6, 0.85, 1.1, 0.85, 1.1];

/**
 * Static evaluation function of a game state for the AI player.
 * Positive = favorable for AI, Negative = favorable for opponent.
 */
function evaluateStaticState(state: GameState, aiPlayer: Player): number {
  const opponent: Player = aiPlayer === 'X' ? 'O' : 'X';

  // Terminal conditions
  if (state.winner === aiPlayer) return 100000;
  if (state.winner === opponent) return -100000;
  if (state.winner === 'TIE') return 0;

  let score = 0;

  // 1. Global Board Winning Lines Evaluation
  for (const combo of WINNING_COMBINATIONS) {
    let aiW = 0;
    let oppW = 0;
    let openW = 0;

    for (const b of combo) {
      if (state.boardWinners[b] === aiPlayer) aiW++;
      else if (state.boardWinners[b] === opponent) oppW++;
      else if (state.boardWinners[b] === null) openW++;
    }

    if (aiW === 2 && openW === 1) score += 3200; // AI has 2-in-a-row on global board
    else if (oppW === 2 && openW === 1) score -= 4200; // Opponent has 2-in-a-row on global board
    else if (aiW === 1 && openW === 2) score += 160;
    else if (oppW === 1 && openW === 2) score -= 200;
  }

  // 2. Won boards and local board progress
  for (let b = 0; b < 9; b++) {
    const winner = state.boardWinners[b];
    const weight = BOARD_WEIGHTS[b];

    if (winner === aiPlayer) {
      score += 650 * weight;
    } else if (winner === opponent) {
      score -= 750 * weight;
    } else {
      // Unfinished board evaluation
      const cells = state.cells[b];
      let aiThreats = 0;
      let oppThreats = 0;

      for (const combo of WINNING_COMBINATIONS) {
        let aiC = 0;
        let oppC = 0;
        let emptyC = 0;
        for (const c of combo) {
          if (cells[c] === aiPlayer) aiC++;
          else if (cells[c] === opponent) oppC++;
          else emptyC++;
        }

        if (aiC === 2 && emptyC === 1) aiThreats++;
        else if (oppC === 2 && emptyC === 1) oppThreats++;
      }

      score += (aiThreats * 85 - oppThreats * 115) * weight;

      // Local fork bonus (two simultaneous threats in one board is an unstoppable win)
      if (aiThreats >= 2) score += 250 * weight;
      if (oppThreats >= 2) score -= 320 * weight;

      // Key cell control inside local board
      if (cells[4] === aiPlayer) score += 15 * weight;
      else if (cells[4] === opponent) score -= 15 * weight;
    }
  }

  // 3. Action-Reaction Steering (Sending penalty/bonus)
  if (state.currentPlayer === opponent) {
    if (state.activeBoard === null) {
      // Gave opponent free play!
      score -= 950;
    } else {
      const targetB = state.activeBoard;
      const targetCells = state.cells[targetB];
      let oppCanWinTarget = false;

      for (const combo of WINNING_COMBINATIONS) {
        let oppC = 0;
        let emptyC = 0;
        for (const c of combo) {
          if (targetCells[c] === opponent) oppC++;
          else if (targetCells[c] === null) emptyC++;
        }
        if (oppC === 2 && emptyC === 1) {
          oppCanWinTarget = true;
          break;
        }
      }

      if (oppCanWinTarget) {
        score -= 900; // Dangerous! Handed opponent an immediate local win
      } else {
        score += 80;
      }
    }
  } else {
    // AI has free play
    if (state.activeBoard === null) {
      score += 450;
    }
  }

  return score;
}

/**
 * Minimax with Alpha-Beta Pruning
 */
function alphaBeta(
  state: GameState,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  aiPlayer: Player
): number {
  if (depth === 0 || state.winner !== null) {
    return evaluateStaticState(state, aiPlayer);
  }

  const validMoves = getValidMoves(state);
  if (validMoves.length === 0) {
    return evaluateStaticState(state, aiPlayer);
  }

  // Fast move ordering: prioritize moves that do not give free play and control centers/corners
  const scoredMoves = validMoves.map((m) => {
    let prio = 0;
    const target = m.cellIdx;
    if (state.boardWinners[target] === null && !isBoardFull(state.cells[target])) {
      prio += 50; // avoids free play
    }
    if (m.cellIdx === 4) prio += 20; // center cell
    else if ([0, 2, 6, 8].includes(m.cellIdx)) prio += 10; // corner cell
    return { move: m, prio };
  });
  scoredMoves.sort((a, b) => b.prio - a.prio);

  // If wide free-play turn, limit branching factor to top candidates to guarantee sub-20ms response
  const candidateMoves =
    scoredMoves.length > 20 ? scoredMoves.slice(0, 16).map((s) => s.move) : validMoves;

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of candidateMoves) {
      const nextState = applyMove(state, move.boardIdx, move.cellIdx);
      const ev = alphaBeta(nextState, depth - 1, alpha, beta, false, aiPlayer);
      maxEval = Math.max(maxEval, ev);
      alpha = Math.max(alpha, ev);
      if (beta <= alpha) break; // Beta cutoff
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of candidateMoves) {
      const nextState = applyMove(state, move.boardIdx, move.cellIdx);
      const ev = alphaBeta(nextState, depth - 1, alpha, beta, true, aiPlayer);
      minEval = Math.min(minEval, ev);
      beta = Math.min(beta, ev);
      if (beta <= alpha) break; // Alpha cutoff
    }
    return minEval;
  }
}

/**
 * Select the best move for the AI player given the current board state and difficulty level.
 */
export function getBestAiMove(
  state: GameState,
  aiPlayer: Player,
  difficulty: AiDifficulty = 'hard'
): Move | null {
  const validMoves = getValidMoves(state);
  if (validMoves.length === 0) return null;

  const opponent: Player = aiPlayer === 'X' ? 'O' : 'X';

  // 1. EASY MODE: 60% random moves, 40% shallow greedy
  if (difficulty === 'easy') {
    if (Math.random() < 0.6) {
      const randomIdx = Math.floor(Math.random() * validMoves.length);
      return {
        boardIdx: validMoves[randomIdx].boardIdx,
        cellIdx: validMoves[randomIdx].cellIdx,
        player: aiPlayer,
      };
    }
  }

  // 2. IMMEDIATE GLOBAL MATCH WIN: Take it 100% of the time
  for (const move of validMoves) {
    const nextState = applyMove(state, move.boardIdx, move.cellIdx);
    if (nextState.winner === aiPlayer) {
      return {
        boardIdx: move.boardIdx,
        cellIdx: move.cellIdx,
        player: aiPlayer,
      };
    }
  }

  // 3. IMMEDIATE GLOBAL MATCH-SAVING BLOCK:
  // If opponent has 2 won boards in a global line and the 3rd board is open and currently active,
  // and opponent has a 2-in-a-row inside it, AI MUST block this cell to avoid losing the match!
  for (const gCombo of WINNING_COMBINATIONS) {
    const oppWon = gCombo.filter((b) => state.boardWinners[b] === opponent);
    const openBoards = gCombo.filter((b) => state.boardWinners[b] === null);
    if (oppWon.length === 2 && openBoards.length === 1) {
      const criticalBoard = openBoards[0];
      const movesInCriticalBoard = validMoves.filter((m) => m.boardIdx === criticalBoard);
      for (const m of movesInCriticalBoard) {
        const cells = state.cells[criticalBoard];
        for (const lCombo of WINNING_COMBINATIONS) {
          if (lCombo.includes(m.cellIdx)) {
            const otherTwo = lCombo.filter((c) => c !== m.cellIdx);
            if (cells[otherTwo[0]] === opponent && cells[otherTwo[1]] === opponent) {
              return {
                boardIdx: m.boardIdx,
                cellIdx: m.cellIdx,
                player: aiPlayer,
              };
            }
          }
        }
      }
    }
  }

  // 4. IMMEDIATE LOCAL BOARD WIN (when safe):
  // Claiming an open local board is high value unless it hands opponent free play or global win
  for (const move of validMoves) {
    const nextState = applyMove(state, move.boardIdx, move.cellIdx);
    if (
      nextState.boardWinners[move.boardIdx] === aiPlayer &&
      state.boardWinners[move.boardIdx] === null
    ) {
      const givesFreePlay = nextState.activeBoard === null;
      if (!givesFreePlay) {
        return {
          boardIdx: move.boardIdx,
          cellIdx: move.cellIdx,
          player: aiPlayer,
        };
      }
    }
  }

  // 5. LOCAL BLOCK DETECTION:
  // Detect moves that block opponent from completing 2-in-a-row in local boards
  const localBlocks: { boardIdx: number; cellIdx: number }[] = [];
  for (const move of validMoves) {
    const cells = state.cells[move.boardIdx];
    for (const lCombo of WINNING_COMBINATIONS) {
      if (lCombo.includes(move.cellIdx)) {
        const otherTwo = lCombo.filter((c) => c !== move.cellIdx);
        if (cells[otherTwo[0]] === opponent && cells[otherTwo[1]] === opponent) {
          localBlocks.push(move);
        }
      }
    }
  }

  // 6. DEEP ALPHA-BETA MINIMAX SEARCH:
  // Hard = 4-ply lookahead (evaluates AI move -> Opponent reply -> AI counter -> Opponent response)
  // Medium = 2-ply lookahead
  const depth = difficulty === 'medium' ? 2 : 4;
  let bestMove = validMoves[0];
  let highestScore = -Infinity;
  const alpha = -Infinity;
  const beta = Infinity;

  for (const move of validMoves) {
    const nextState = applyMove(state, move.boardIdx, move.cellIdx);
    let moveScore = alphaBeta(nextState, depth - 1, alpha, beta, false, aiPlayer);

    // If this move blocks an opponent's local win, add strong tactical bonus
    if (localBlocks.some((b) => b.boardIdx === move.boardIdx && b.cellIdx === move.cellIdx)) {
      moveScore += 350;
    }

    // Heavy penalty for giving free play (unless it won the game)
    if (nextState.activeBoard === null && nextState.winner === null) {
      moveScore -= 1200;
    }

    // Very subtle jitter (1-2 pts) to vary play style between games without blundering
    moveScore += (Math.random() - 0.5) * 2;

    if (moveScore > highestScore) {
      highestScore = moveScore;
      bestMove = move;
    }
  }

  return {
    boardIdx: bestMove.boardIdx,
    cellIdx: bestMove.cellIdx,
    player: aiPlayer,
  };
}
