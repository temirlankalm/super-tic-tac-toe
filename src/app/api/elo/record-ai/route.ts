import { NextRequest, NextResponse } from 'next/server';
import { eloStore } from '@/lib/elo/store';
import { calculateEloUpdate, getAiOpponentRating } from '@/lib/elo/calculator';
import {
  checkAndRecordAiWinCap,
  checkApiRateLimit,
  verifyAiGameMoves,
} from '@/lib/elo/verifier';
import { MatchRecord, RecordAiGameRequest, RecordAiGameResponse } from '@/lib/elo/types';

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      'anonymous_ip';

    // 1. Rate-limit API submissions
    if (!checkApiRateLimit(`record-ai:${ip}`, 30, 60000)) {
      return NextResponse.json<RecordAiGameResponse>(
        { ok: false, error: 'rate_limited', rated: false },
        { status: 429 }
      );
    }

    const body: RecordAiGameRequest = await req.json();
    const { playerId, nickname, difficulty, result, moves, humanPlayer = 'X' } = body;

    if (!playerId || !difficulty || !result) {
      return NextResponse.json<RecordAiGameResponse>(
        { ok: false, error: 'missing_parameters', rated: false },
        { status: 400 }
      );
    }

    // 2. Anti-Cheat: Cap rated AI wins per hour per player
    if (result === 'win') {
      const winCap = checkAndRecordAiWinCap(playerId);
      if (!winCap.allowed) {
        return NextResponse.json<RecordAiGameResponse>(
          {
            ok: false,
            error: 'hourly_ai_win_limit_exceeded',
            rated: false,
          },
          { status: 429 }
        );
      }
    }

    // 3. Anti-Cheat: Server-side move verification
    const verification = verifyAiGameMoves(moves, result, humanPlayer);
    if (!verification.isValid) {
      console.warn(
        `[Anti-Cheat] AI game move verification failed for player ${playerId}: ${verification.reason}`
      );
      return NextResponse.json<RecordAiGameResponse>(
        {
          ok: false,
          error: `move_verification_failed: ${verification.reason}`,
          rated: false,
        },
        { status: 400 }
      );
    }

    // 4. Retrieve or create player profile
    const { player } = eloStore.getOrCreatePlayer(playerId, nickname || 'Player');
    const opponentRating = getAiOpponentRating(difficulty);

    // 5. Server calculates Elo result
    const update = calculateEloUpdate(
      player.rating,
      opponentRating,
      result,
      player.games
    );

    // 6. Persist player rating and match record
    const updatedPlayer = eloStore.updatePlayerStats(
      playerId,
      update.delta,
      update.newRating,
      result
    );

    const matchRecord: MatchRecord = {
      id: `m_ai_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      gameMode: 'ai',
      playerId,
      playerNickname: player.nickname,
      opponentId: `ai:${difficulty}`,
      opponentNickname: `AI (${difficulty})`,
      opponentRating,
      result,
      ratingBefore: player.rating,
      ratingAfter: update.newRating,
      delta: update.delta,
      movesCount: moves.length,
      reason: 'normal',
      verified: true,
    };
    eloStore.recordMatch(matchRecord);

    return NextResponse.json<RecordAiGameResponse>({
      ok: true,
      rated: true,
      ratingBefore: player.rating,
      ratingAfter: update.newRating,
      delta: update.delta,
      games: updatedPlayer.games,
      wins: updatedPlayer.wins,
      isProvisional: updatedPlayer.isProvisional,
    });
  } catch (err) {
    console.error('[Elo API] Record AI game error:', err);
    return NextResponse.json<RecordAiGameResponse>(
      { ok: false, error: 'internal_error', rated: false },
      { status: 500 }
    );
  }
}
