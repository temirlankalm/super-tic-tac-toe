import fs from 'fs';
import path from 'path';
import {
  LeaderboardEntry,
  LeaderboardResponse,
  MatchRecord,
  PlayerProfile,
  RoomMatchReport,
} from './types';
import { INITIAL_ELO, PROVISIONAL_GAMES_THRESHOLD } from './calculator';
import { validateNickname } from '../nickname';
import { MAX_FRIEND_RATED_GAMES_PER_DAY } from './verifier';

interface SerializedEloStore {
  players: Record<string, PlayerProfile>;
  nicknameIndex: Record<string, string>; // normalizedNickname -> playerId
  matches: MatchRecord[];
  updatedAt: number;
}

const ELO_STORE_PATH =
  process.env.ELO_DATA_PATH || path.join('/tmp', 'sttt_elo_store_v1.json');
const MAX_STORED_MATCHES = 3000;

class EloStore {
  private players = new Map<string, PlayerProfile>();
  private nicknameIndex = new Map<string, string>(); // lowercased -> playerId
  private matches: MatchRecord[] = [];
  private pendingRoomReports = new Map<string, RoomMatchReport[]>(); // matchId -> reports
  private friendPairGames = new Map<string, number[]>(); // pairKey -> timestamps
  private isLoaded = false;

  constructor() {
    this.loadFromDisk();
  }

  private loadFromDisk() {
    if (this.isLoaded) return;
    try {
      if (fs.existsSync(/*turbopackIgnore: true*/ ELO_STORE_PATH)) {
        const raw = fs.readFileSync(/*turbopackIgnore: true*/ ELO_STORE_PATH, 'utf-8');
        const parsed: SerializedEloStore = JSON.parse(raw);
        if (parsed.players && typeof parsed.players === 'object') {
          for (const [id, profile] of Object.entries(parsed.players)) {
            this.players.set(id, profile);
            this.nicknameIndex.set(profile.normalizedNickname, id);
          }
        }
        if (Array.isArray(parsed.matches)) {
          this.matches = parsed.matches.slice(-MAX_STORED_MATCHES);
        }
      }
    } catch (err) {
      console.warn('[EloStore] Disk load warning (using empty store):', err);
    }
    this.isLoaded = true;
  }

  private persistToDisk() {
    try {
      const dir = path.dirname(ELO_STORE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const data: SerializedEloStore = {
        players: Object.fromEntries(this.players.entries()),
        nicknameIndex: Object.fromEntries(this.nicknameIndex.entries()),
        matches: this.matches.slice(-MAX_STORED_MATCHES),
        updatedAt: Date.now(),
      };
      fs.writeFileSync(ELO_STORE_PATH, JSON.stringify(data), 'utf-8');
    } catch (err) {
      // In serverless /tmp write failures are non-fatal
    }
  }

  private syncRemoteKv(key: string, value: unknown) {
    const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
    if (kvUrl && kvToken) {
      fetch(`${kvUrl}/set/${encodeURIComponent(key)}/${encodeURIComponent(JSON.stringify(value))}`, {
        headers: { Authorization: `Bearer ${kvToken}` },
      }).catch(() => {});
    }
  }

  /**
   * Retrieves player profile by ID.
   */
  public getPlayer(playerId: string): PlayerProfile | null {
    this.loadFromDisk();
    return this.players.get(playerId) || null;
  }

  /**
   * Checks whether a nickname is available (unique case-insensitively).
   */
  public isNicknameAvailable(nickname: string, excludePlayerId?: string): boolean {
    this.loadFromDisk();
    const normalized = nickname.trim().toLowerCase();
    const existingId = this.nicknameIndex.get(normalized);
    if (!existingId) return true;
    return existingId === excludePlayerId;
  }

  /**
   * Retrieves or creates a player profile.
   */
  public getOrCreatePlayer(
    playerId: string,
    rawNickname: string
  ): { player: PlayerProfile; error?: string } {
    this.loadFromDisk();
    const existing = this.players.get(playerId);
    if (existing) {
      existing.lastActiveAt = Date.now();
      return { player: existing };
    }

    // Validate nickname
    const val = validateNickname(rawNickname);
    const validNick = val.valid ? val.sanitized : `Player_${playerId.slice(-4)}`;
    const normalized = validNick.toLowerCase();

    // Check uniqueness; if taken by another player, append a random 2-digit suffix
    let finalNick = validNick;
    let finalNorm = normalized;
    if (this.nicknameIndex.has(finalNorm)) {
      const suffix = Math.floor(Math.random() * 90) + 10;
      finalNick = `${validNick.slice(0, 13)} ${suffix}`;
      finalNorm = finalNick.toLowerCase();
    }

    const now = Date.now();
    const newPlayer: PlayerProfile = {
      id: playerId,
      nickname: finalNick,
      normalizedNickname: finalNorm,
      rating: INITIAL_ELO,
      games: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      isProvisional: true,
      peakRating: INITIAL_ELO,
      createdAt: now,
      updatedAt: now,
      lastActiveAt: now,
    };

    this.players.set(playerId, newPlayer);
    this.nicknameIndex.set(finalNorm, playerId);
    this.persistToDisk();
    this.syncRemoteKv(`sttt_elo_player:${playerId}`, newPlayer);

    return { player: newPlayer };
  }

  /**
   * Updates a player's nickname, ensuring uniqueness and validation.
   */
  public updateNickname(
    playerId: string,
    newNickname: string
  ): { ok: boolean; error?: string; player?: PlayerProfile } {
    this.loadFromDisk();
    const player = this.players.get(playerId);
    if (!player) {
      return { ok: false, error: 'Player not found' };
    }

    const val = validateNickname(newNickname);
    if (!val.valid) {
      return { ok: false, error: val.errorKey || 'Invalid nickname' };
    }

    const normalized = val.sanitized.toLowerCase();
    const ownerId = this.nicknameIndex.get(normalized);
    if (ownerId && ownerId !== playerId) {
      return { ok: false, error: 'nickname_taken' };
    }

    // Remove old nickname index
    this.nicknameIndex.delete(player.normalizedNickname);

    // Update player
    player.nickname = val.sanitized;
    player.normalizedNickname = normalized;
    player.updatedAt = Date.now();
    player.lastActiveAt = Date.now();

    this.nicknameIndex.set(normalized, playerId);
    this.persistToDisk();
    this.syncRemoteKv(`sttt_elo_player:${playerId}`, player);

    return { ok: true, player };
  }

  /**
   * Applies an Elo rating update and stats changes to a player.
   */
  public updatePlayerStats(
    playerId: string,
    delta: number,
    newRating: number,
    outcome: 'win' | 'loss' | 'draw'
  ): PlayerProfile {
    this.loadFromDisk();
    let player = this.players.get(playerId);
    if (!player) {
      player = this.getOrCreatePlayer(playerId, `Player_${playerId.slice(-4)}`).player;
    }

    player.rating = newRating;
    player.games += 1;
    if (outcome === 'win') player.wins += 1;
    else if (outcome === 'loss') player.losses += 1;
    else if (outcome === 'draw') player.draws += 1;

    player.isProvisional = player.games < PROVISIONAL_GAMES_THRESHOLD;
    player.peakRating = Math.max(player.peakRating, newRating);
    player.updatedAt = Date.now();
    player.lastActiveAt = Date.now();

    this.persistToDisk();
    this.syncRemoteKv(`sttt_elo_player:${playerId}`, player);
    return player;
  }

  /**
   * Records a completed match into history.
   */
  public recordMatch(match: MatchRecord): void {
    this.loadFromDisk();
    this.matches.push(match);
    if (this.matches.length > MAX_STORED_MATCHES + 100) {
      this.matches = this.matches.slice(-MAX_STORED_MATCHES);
    }
    this.persistToDisk();
  }

  /**
   * Anti-Cheat: Checks friend games count in last 24h between two players.
   * Max 5 rated games per day between the same 2 players.
   */
  public getDailyFriendGamesCount(id1: string, id2: string): number {
    const pairKey = [id1, id2].sort().join(':');
    const now = Date.now();
    const oneDayAgo = now - 24 * 3600 * 1000;
    const timestamps = (this.friendPairGames.get(pairKey) || []).filter((t) => t > oneDayAgo);
    this.friendPairGames.set(pairKey, timestamps);
    return timestamps.length;
  }

  public recordFriendGamePair(id1: string, id2: string): void {
    const pairKey = [id1, id2].sort().join(':');
    const now = Date.now();
    const timestamps = (this.friendPairGames.get(pairKey) || []).filter(
      (t) => now - t < 24 * 3600 * 1000
    );
    timestamps.push(now);
    this.friendPairGames.set(pairKey, timestamps);
  }

  /**
   * Pending room match reports for bilateral verification.
   */
  public savePendingRoomReport(report: RoomMatchReport): RoomMatchReport[] {
    const list = this.pendingRoomReports.get(report.matchId) || [];
    // Replace report if same player re-sent
    const filtered = list.filter((r) => r.playerId !== report.playerId);
    filtered.push(report);
    this.pendingRoomReports.set(report.matchId, filtered);
    return filtered;
  }

  public getPendingRoomReports(matchId: string): RoomMatchReport[] {
    return this.pendingRoomReports.get(matchId) || [];
  }

  public clearPendingRoomReports(matchId: string): void {
    this.pendingRoomReports.delete(matchId);
  }

  /**
   * Generates the global Leaderboard (top 100 with provisional players kept off top).
   */
  public getLeaderboard(limit = 100, currentPlayerId?: string): LeaderboardResponse {
    this.loadFromDisk();
    const all = Array.from(this.players.values());

    // Separate established players (games >= 5) from provisional (games < 5)
    const established = all
      .filter((p) => p.games >= PROVISIONAL_GAMES_THRESHOLD)
      .sort((a, b) => {
        if (b.rating !== a.rating) return b.rating - a.rating;
        if (b.wins !== a.wins) return b.wins - a.wins;
        return a.games - b.games;
      });

    const provisional = all
      .filter((p) => p.games < PROVISIONAL_GAMES_THRESHOLD)
      .sort((a, b) => b.rating - a.rating);

    // Build topEntries
    const topEntries: LeaderboardEntry[] = established.slice(0, limit).map((p, idx) => ({
      rank: idx + 1,
      id: p.id,
      nickname: p.nickname,
      rating: p.rating,
      games: p.games,
      wins: p.wins,
      losses: p.losses,
      draws: p.draws,
      winRate: p.games > 0 ? Math.round((p.wins / p.games) * 100) : 0,
      isProvisional: false,
      isCurrentPlayer: currentPlayerId ? p.id === currentPlayerId : false,
    }));

    // Build provisional entries (top 20 provisional)
    const provisionalEntries: LeaderboardEntry[] = provisional.slice(0, 20).map((p) => ({
      rank: null,
      id: p.id,
      nickname: p.nickname,
      rating: p.rating,
      games: p.games,
      wins: p.wins,
      losses: p.losses,
      draws: p.draws,
      winRate: p.games > 0 ? Math.round((p.wins / p.games) * 100) : 0,
      isProvisional: true,
      isCurrentPlayer: currentPlayerId ? p.id === currentPlayerId : false,
    }));

    // Find current player entry if provided
    let currentPlayerEntry: LeaderboardEntry | null = null;
    if (currentPlayerId) {
      const cur = this.players.get(currentPlayerId);
      if (cur) {
        let rank: number | null = null;
        if (cur.games >= PROVISIONAL_GAMES_THRESHOLD) {
          const rankIdx = established.findIndex((p) => p.id === currentPlayerId);
          rank = rankIdx >= 0 ? rankIdx + 1 : null;
        }
        currentPlayerEntry = {
          rank,
          id: cur.id,
          nickname: cur.nickname,
          rating: cur.rating,
          games: cur.games,
          wins: cur.wins,
          losses: cur.losses,
          draws: cur.draws,
          winRate: cur.games > 0 ? Math.round((cur.wins / cur.games) * 100) : 0,
          isProvisional: cur.isProvisional,
          isCurrentPlayer: true,
        };
      }
    }

    return {
      topEntries,
      provisionalEntries,
      totalPlayers: all.length,
      totalRatedGames: this.matches.length,
      currentPlayer: currentPlayerEntry,
      updatedAt: Date.now(),
    };
  }

  /**
   * Resets all Elo data (for test/admin purposes).
   */
  public clearAll(): void {
    this.players.clear();
    this.nicknameIndex.clear();
    this.matches = [];
    this.pendingRoomReports.clear();
    this.friendPairGames.clear();
    this.persistToDisk();
  }
}

declare global {
  var __sttt_elo_store: EloStore | undefined;
}

if (!globalThis.__sttt_elo_store) {
  globalThis.__sttt_elo_store = new EloStore();
}

export const eloStore = globalThis.__sttt_elo_store;
