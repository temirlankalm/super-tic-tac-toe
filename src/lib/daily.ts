import { BoardWinner } from '@/types/game';

export interface DailyResult {
  date: string;
  challengeNumber: number;
  won: boolean;
  movesCount: number;
  boardWinners: BoardWinner[];
}

export interface DailyStats {
  currentStreak: number;
  maxStreak: number;
  lastPlayedDate: string | null;
  lastWonDate: string | null;
  history: DailyResult[];
}

const STORAGE_KEY = 'sttt_daily_stats';
const EPOCH_DATE = new Date('2026-01-01T00:00:00Z');

/**
 * Returns today's date formatted as YYYY-MM-DD in the user's local timezone.
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns yesterday's date formatted as YYYY-MM-DD.
 */
export function getYesterdayDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculates deterministic day challenge index (e.g. #42) from epoch.
 */
export function getChallengeNumber(dateStr: string = getTodayDateString()): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  const targetDate = new Date(Date.UTC(y, m - 1, d));
  const diffTime = targetDate.getTime() - EPOCH_DATE.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays);
}

/**
 * Read Daily Stats from localStorage.
 */
export function getDailyStats(): DailyStats {
  if (typeof window === 'undefined') {
    return {
      currentStreak: 0,
      maxStreak: 0,
      lastPlayedDate: null,
      lastWonDate: null,
      history: [],
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        currentStreak: 0,
        maxStreak: 0,
        lastPlayedDate: null,
        lastWonDate: null,
        history: [],
      };
    }
    return JSON.parse(raw);
  } catch {
    return {
      currentStreak: 0,
      maxStreak: 0,
      lastPlayedDate: null,
      lastWonDate: null,
      history: [],
    };
  }
}

/**
 * Check if the user has already played today's challenge.
 */
export function hasPlayedToday(): boolean {
  const stats = getDailyStats();
  const today = getTodayDateString();
  return stats.lastPlayedDate === today;
}

/**
 * Get today's recorded result if completed.
 */
export function getTodayResult(): DailyResult | null {
  const stats = getDailyStats();
  const today = getTodayDateString();
  if (stats.lastPlayedDate !== today) return null;
  return stats.history.find((h) => h.date === today) || null;
}

/**
 * Save result of today's challenge game.
 */
export function recordDailyResult(
  won: boolean,
  movesCount: number,
  boardWinners: BoardWinner[]
): DailyStats {
  const stats = getDailyStats();
  const today = getTodayDateString();
  const yesterday = getYesterdayDateString();
  const challengeNum = getChallengeNumber(today);

  let newStreak = stats.currentStreak;
  if (won) {
    if (stats.lastWonDate === yesterday) {
      newStreak += 1;
    } else if (stats.lastWonDate === today) {
      // already recorded today
    } else {
      newStreak = 1;
    }
  } else {
    newStreak = 0;
  }

  const newMaxStreak = Math.max(stats.maxStreak, newStreak);

  const newEntry: DailyResult = {
    date: today,
    challengeNumber: challengeNum,
    won,
    movesCount,
    boardWinners: [...boardWinners],
  };

  const filteredHistory = stats.history.filter((h) => h.date !== today);
  const updatedHistory = [newEntry, ...filteredHistory].slice(0, 30);

  const updatedStats: DailyStats = {
    currentStreak: newStreak,
    maxStreak: newMaxStreak,
    lastPlayedDate: today,
    lastWonDate: won ? today : stats.lastWonDate,
    history: updatedHistory,
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedStats));
  } catch {}

  return updatedStats;
}

/**
 * Generate Wordle-style emoji sharing card for Twitter / Telegram / WhatsApp.
 */
export function generateShareText(
  challengeNum: number,
  won: boolean,
  movesCount: number,
  streak: number,
  boardWinners: BoardWinner[]
): string {
  // Convert 9 board winners into 3x3 emoji grid
  // 🟩 = Player (X) won this sector
  // ⬜ = Opponent (O) won this sector
  // ⬛ = Unclaimed / Tied sector
  const rows: string[] = [];
  for (let r = 0; r < 3; r++) {
    const rowEmojis: string[] = [];
    for (let c = 0; c < 3; c++) {
      const idx = r * 3 + c;
      const winner = boardWinners[idx];
      if (winner === 'X') {
        rowEmojis.push('🟩');
      } else if (winner === 'O') {
        rowEmojis.push('⬜');
      } else {
        rowEmojis.push('⬛');
      }
    }
    rows.push(rowEmojis.join(' '));
  }

  const resultLine = won
    ? `победа за ${movesCount} ходов · стрик: ${streak} 🔥`
    : `партия сыграна (${movesCount} ходов) · стрик: ${streak}`;

  return `ttt · super #${challengeNum}
${resultLine}
${rows.join('\n')}
https://ttt.temr.dev`;
}
