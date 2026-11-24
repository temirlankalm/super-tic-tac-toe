export interface PlayerProfile {
  id: string; // Anonymous browser-generated ID (e.g., p_xxx)
  nickname: string;
  normalizedNickname: string; // Lowercased and trimmed for unique constraint
  rating: number; // Defaults to 1000, floored at 100
  games: number; // Total rated games played
  wins: number;
  losses: number;
  draws: number;
  isProvisional: boolean; // true if games < 5
  peakRating: number;
  createdAt: number;
  updatedAt: number;
  lastActiveAt: number;
}

export type GameOutcome = 'win' | 'loss' | 'draw';

export interface MatchRecord {
  id: string;
  timestamp: number;
  gameMode: 'ai' | 'online';
  playerId: string;
  playerNickname: string;
  opponentId: string; // 'ai:easy' | 'ai:medium' | 'ai:hard' | 'ai:qnet' or player ID
  opponentNickname: string;
  opponentRating: number;
  result: GameOutcome;
  ratingBefore: number;
  ratingAfter: number;
  delta: number;
  movesCount: number;
  reason?: 'normal' | 'timeout' | 'resignation' | 'forfeit' | 'agreement';
  verified?: boolean;
}

export interface LeaderboardEntry {
  rank: number | null; // null if provisional
  id: string;
  nickname: string;
  rating: number;
  games: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number; // 0..100%
  isProvisional: boolean;
  isCurrentPlayer?: boolean;
}

export interface LeaderboardResponse {
  topEntries: LeaderboardEntry[];
  provisionalEntries: LeaderboardEntry[];
  totalPlayers: number;
  totalRatedGames: number;
  currentPlayer: LeaderboardEntry | null;
  updatedAt: number;
}

export interface MoveStep {
  boardIdx: number;
  cellIdx: number;
  player: 'X' | 'O';
}

export interface RecordAiGameRequest {
  playerId: string;
  nickname: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'qnet';
  result: GameOutcome;
  moves: MoveStep[];
  durationMs: number;
  humanPlayer?: 'X' | 'O';
}

export interface RecordAiGameResponse {
  ok: boolean;
  error?: string;
  rated: boolean;
  ratingBefore?: number;
  ratingAfter?: number;
  delta?: number;
  games?: number;
  wins?: number;
  isProvisional?: boolean;
}

export interface RoomMatchReport {
  matchId: string;
  roomId: string;
  playerId: string;
  nickname: string;
  opponentId: string;
  opponentNickname: string;
  role: 'host' | 'guest';
  myPlayer: 'X' | 'O';
  result: GameOutcome;
  reason?: 'normal' | 'timeout' | 'resignation' | 'forfeit' | 'agreement';
  movesCount: number;
  timestamp: number;
}

export interface RecordRoomGameResponse {
  ok: boolean;
  status: 'pending_opponent' | 'completed' | 'unrated_limit' | 'mismatch';
  error?: string;
  rated: boolean;
  ratingBefore?: number;
  ratingAfter?: number;
  delta?: number;
  games?: number;
  wins?: number;
  isProvisional?: boolean;
}
