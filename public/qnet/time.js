// SPDX-License-Identifier: MIT
//
// Time management: how long to think on this move, given the clock.
//
// A game of ultimate tic-tac-toe lasts about 50 to 70 plies, so the side to move expects roughly
// (TYPICAL_PLIES - ply) / 2 more moves of its own, never fewer than MIN_MOVES_LEFT. The budget is an
// equal share of the remaining time (after a safety reserve) plus most of the increment, capped so
// that one move never takes more than a quarter of what is left.

const TYPICAL_PLIES = 64;
const MIN_MOVES_LEFT = 8;
const MAX_SHARE = 0.25;
const RESERVE_FRACTION = 0.05;
const RESERVE_MAX_MS = 1000;
const MIN_BUDGET_MS = 20;

/**
 * @param {{timeLeftMs: number, incrementMs?: number, ply?: number, overheadMs?: number}} clock
 *   timeLeftMs: the mover's remaining clock. ply: moves already played in the game.
 *   overheadMs: fixed cost per move outside the search (messaging, UI delays), taken off the budget.
 * @returns {number} milliseconds to search
 */
export function allocateTime({ timeLeftMs, incrementMs = 0, ply = 0, overheadMs = 0 }) {
  if (!Number.isFinite(timeLeftMs) || timeLeftMs <= 0) return MIN_BUDGET_MS;
  const reserve = Math.min(timeLeftMs * RESERVE_FRACTION, RESERVE_MAX_MS);
  const usable = Math.max(0, timeLeftMs - reserve);
  const movesLeft = Math.max(MIN_MOVES_LEFT, Math.ceil((TYPICAL_PLIES - ply) / 2));
  const share = usable / movesLeft + incrementMs * 0.8;
  const budget = Math.min(share, usable * MAX_SHARE) - overheadMs;
  return Math.max(MIN_BUDGET_MS, Math.floor(budget));
}
