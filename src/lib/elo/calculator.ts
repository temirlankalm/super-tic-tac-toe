import { GameOutcome } from './types';

export const INITIAL_ELO = 1000;
export const MIN_ELO_FLOOR = 100;
export const PROVISIONAL_GAMES_THRESHOLD = 5;
export const K_PROVISIONAL_GAMES_THRESHOLD = 20;

export const AI_RATINGS: Record<string, number> = {
  easy: 800,
  medium: 1100,
  hard: 1400,
  qnet: 1400,
};

/**
 * Returns K-factor: 40 for the player's first 20 rated games, 32 thereafter.
 */
export function getKFactor(gamesPlayed: number): number {
  return gamesPlayed < K_PROVISIONAL_GAMES_THRESHOLD ? 40 : 32;
}

/**
 * Returns the fixed rating for an AI difficulty.
 */
export function getAiOpponentRating(difficulty: string): number {
  return AI_RATINGS[difficulty] ?? 1100;
}

/**
 * Calculates expected score: E_A = 1 / (1 + 10^((R_B - R_A) / 400))
 */
export function calculateExpectedScore(playerRating: number, opponentRating: number): number {
  return 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
}

/**
 * Converts a GameOutcome to numeric score: win = 1, draw = 0.5, loss = 0.
 */
export function outcomeToScore(outcome: GameOutcome): number {
  if (outcome === 'win') return 1.0;
  if (outcome === 'draw') return 0.5;
  return 0.0;
}

/**
 * Computes standard Elo rating change and new rating with floor at 100.
 */
export function calculateEloUpdate(
  currentRating: number,
  opponentRating: number,
  outcome: GameOutcome,
  gamesPlayed: number
): { delta: number; newRating: number; expected: number } {
  const K = getKFactor(gamesPlayed);
  const expected = calculateExpectedScore(currentRating, opponentRating);
  const score = outcomeToScore(outcome);

  let rawDelta = Math.round(K * (score - expected));

  // Ensure intuitive minimum deltas
  if (outcome === 'win' && rawDelta < 1) {
    rawDelta = 1;
  } else if (outcome === 'loss' && rawDelta > -1 && currentRating > MIN_ELO_FLOOR) {
    rawDelta = -1;
  }

  const newRating = Math.max(MIN_ELO_FLOOR, currentRating + rawDelta);
  const effectiveDelta = newRating - currentRating;

  return {
    delta: effectiveDelta,
    newRating,
    expected,
  };
}
