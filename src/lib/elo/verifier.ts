import { createInitialState, isMoveValid, applyMove } from '../gameLogic';
import { GameOutcome, MoveStep } from './types';

export const MAX_AI_RATED_WINS_PER_HOUR = 15;
export const MAX_FRIEND_RATED_GAMES_PER_DAY = 5;

/**
 * Verifies a game move list server-side against full Super Tic-Tac-Toe rules.
 */
export function verifyAiGameMoves(
  moves: MoveStep[],
  claimedResult: GameOutcome,
  humanPlayer: 'X' | 'O' = 'X'
): { isValid: boolean; reason?: string } {
  if (!Array.isArray(moves) || moves.length < 5) {
    return { isValid: false, reason: 'Game too short or empty move list' };
  }

  // Replay game on a clean server-side state
  let state = createInitialState('ai', humanPlayer, 'hard');

  for (let i = 0; i < moves.length; i++) {
    const move = moves[i];

    if (!move || typeof move.boardIdx !== 'number' || typeof move.cellIdx !== 'number') {
      return { isValid: false, reason: `Malformed move at index ${i}` };
    }

    if (state.winner !== null) {
      return { isValid: false, reason: `Move played after game was already won at index ${i}` };
    }

    if (move.player !== state.currentPlayer) {
      return {
        isValid: false,
        reason: `Turn mismatch at move ${i}: expected ${state.currentPlayer}, got ${move.player}`,
      };
    }

    if (!isMoveValid(state, move.boardIdx, move.cellIdx)) {
      return {
        isValid: false,
        reason: `Illegal move at index ${i}: sector ${move.boardIdx}, cell ${move.cellIdx}`,
      };
    }

    state = applyMove(state, move.boardIdx, move.cellIdx);
  }

  // Verify that the final winner matches the claimed result
  if (claimedResult === 'win') {
    if (state.winner !== humanPlayer) {
      return {
        isValid: false,
        reason: `Claimed win, but final server state winner is ${state.winner}`,
      };
    }
  } else if (claimedResult === 'loss') {
    const expectedWinner = humanPlayer === 'X' ? 'O' : 'X';
    if (state.winner !== expectedWinner) {
      return {
        isValid: false,
        reason: `Claimed loss, but final server state winner is ${state.winner}`,
      };
    }
  } else if (claimedResult === 'draw') {
    if (state.winner !== 'TIE') {
      return {
        isValid: false,
        reason: `Claimed draw, but final server state winner is ${state.winner}`,
      };
    }
  }

  return { isValid: true };
}

// In-memory sliding window rate-limiter for API endpoints
interface RateRecord {
  timestamps: number[];
}

const ipRateMap = new Map<string, RateRecord>();
const playerAiWinsMap = new Map<string, number[]>();

export function checkApiRateLimit(ipOrKey: string, maxRequests = 30, windowMs = 60000): boolean {
  const now = Date.now();
  const record = ipRateMap.get(ipOrKey) || { timestamps: [] };
  // Prune timestamps older than window
  record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

  if (record.timestamps.length >= maxRequests) {
    return false; // Rate limit exceeded
  }

  record.timestamps.push(now);
  ipRateMap.set(ipOrKey, record);
  return true;
}

export function checkAndRecordAiWinCap(playerId: string): { allowed: boolean; count: number } {
  const now = Date.now();
  const oneHourAgo = now - 3600 * 1000;
  let timestamps = playerAiWinsMap.get(playerId) || [];
  timestamps = timestamps.filter((t) => t > oneHourAgo);

  if (timestamps.length >= MAX_AI_RATED_WINS_PER_HOUR) {
    playerAiWinsMap.set(playerId, timestamps);
    return { allowed: false, count: timestamps.length };
  }

  timestamps.push(now);
  playerAiWinsMap.set(playerId, timestamps);
  return { allowed: true, count: timestamps.length };
}
