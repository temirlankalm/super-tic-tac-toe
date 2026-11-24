import { NextRequest, NextResponse } from 'next/server';
import { eloStore } from '@/lib/elo/store';
import { calculateEloUpdate } from '@/lib/elo/calculator';
import { checkApiRateLimit, MAX_FRIEND_RATED_GAMES_PER_DAY } from '@/lib/elo/verifier';
import { MatchRecord, RecordRoomGameResponse, RoomMatchReport } from '@/lib/elo/types';

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      'anonymous_ip';

    // 1. Rate-limit API
    if (!checkApiRateLimit(`record-room:${ip}`, 30, 60000)) {
      return NextResponse.json<RecordRoomGameResponse>(
        { ok: false, status: 'unrated_limit', rated: false, error: 'rate_limited' },
        { status: 429 }
      );
    }

    const report: RoomMatchReport = await req.json();
    const {
      matchId,
      roomId,
      playerId,
      nickname,
      opponentId,
      opponentNickname,
      result,
      reason = 'normal',
      movesCount = 0,
    } = report;

    if (!matchId || !playerId || !opponentId || !result) {
      return NextResponse.json<RecordRoomGameResponse>(
        { ok: false, status: 'unrated_limit', rated: false, error: 'missing_parameters' },
        { status: 400 }
      );
    }

    // 2. Anti-Cheat: Limit rated games between the same two players to 5 per day
    const friendGamesToday = eloStore.getDailyFriendGamesCount(playerId, opponentId);
    if (friendGamesToday >= MAX_FRIEND_RATED_GAMES_PER_DAY) {
      return NextResponse.json<RecordRoomGameResponse>({
        ok: true,
        status: 'unrated_limit',
        rated: false,
        error: 'daily_friend_limit_reached',
      });
    }

    // Ensure profiles exist
    const { player: me } = eloStore.getOrCreatePlayer(playerId, nickname || 'Player');
    const { player: opp } = eloStore.getOrCreatePlayer(opponentId, opponentNickname || 'Opponent');

    // Handle single-sided forfeit / disconnect timeout if opponent abandoned
    if (reason === 'forfeit') {
      const outcome = result; // usually 'win' for remaining player
      const oppOutcome = outcome === 'win' ? 'loss' : 'win';

      const myUpdate = calculateEloUpdate(me.rating, opp.rating, outcome, me.games);
      const oppUpdate = calculateEloUpdate(opp.rating, me.rating, oppOutcome, opp.games);

      const updatedMe = eloStore.updatePlayerStats(playerId, myUpdate.delta, myUpdate.newRating, outcome);
      eloStore.updatePlayerStats(opponentId, oppUpdate.delta, oppUpdate.newRating, oppOutcome);
      eloStore.recordFriendGamePair(playerId, opponentId);

      const matchRecord: MatchRecord = {
        id: `m_rm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        timestamp: Date.now(),
        gameMode: 'online',
        playerId,
        playerNickname: me.nickname,
        opponentId,
        opponentNickname: opp.nickname,
        opponentRating: opp.rating,
        result: outcome,
        ratingBefore: me.rating,
        ratingAfter: myUpdate.newRating,
        delta: myUpdate.delta,
        movesCount,
        reason: 'forfeit',
        verified: true,
      };
      eloStore.recordMatch(matchRecord);
      eloStore.clearPendingRoomReports(matchId);

      return NextResponse.json<RecordRoomGameResponse>({
        ok: true,
        status: 'completed',
        rated: true,
        ratingBefore: me.rating,
        ratingAfter: myUpdate.newRating,
        delta: myUpdate.delta,
        games: updatedMe.games,
        wins: updatedMe.wins,
        isProvisional: updatedMe.isProvisional,
      });
    }

    // 3. Bilateral report pairing
    const existingReports = eloStore.savePendingRoomReport(report);
    const opponentReport = existingReports.find((r) => r.playerId === opponentId);

    if (!opponentReport) {
      // 1st player reported, waiting for opponent's report
      return NextResponse.json<RecordRoomGameResponse>({
        ok: true,
        status: 'pending_opponent',
        rated: true,
        ratingBefore: me.rating,
      });
    }

    // 4. Verify bilateral consensus
    let consensus = false;
    if (result === 'win' && opponentReport.result === 'loss') consensus = true;
    else if (result === 'loss' && opponentReport.result === 'win') consensus = true;
    else if (result === 'draw' && opponentReport.result === 'draw') consensus = true;

    if (!consensus) {
      console.warn(`[Anti-Cheat] Room match result mismatch for match ${matchId}`);
      eloStore.clearPendingRoomReports(matchId);
      return NextResponse.json<RecordRoomGameResponse>({
        ok: false,
        status: 'mismatch',
        rated: false,
        error: 'reports_mismatch',
      });
    }

    // 5. Consensus confirmed: Update both players' ratings
    const myUpdate = calculateEloUpdate(me.rating, opp.rating, result, me.games);
    const oppUpdate = calculateEloUpdate(
      opp.rating,
      me.rating,
      opponentReport.result,
      opp.games
    );

    const updatedMe = eloStore.updatePlayerStats(playerId, myUpdate.delta, myUpdate.newRating, result);
    eloStore.updatePlayerStats(
      opponentId,
      oppUpdate.delta,
      oppUpdate.newRating,
      opponentReport.result
    );

    eloStore.recordFriendGamePair(playerId, opponentId);

    const matchRecordMe: MatchRecord = {
      id: `m_rm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      gameMode: 'online',
      playerId,
      playerNickname: me.nickname,
      opponentId,
      opponentNickname: opp.nickname,
      opponentRating: opp.rating,
      result,
      ratingBefore: me.rating,
      ratingAfter: myUpdate.newRating,
      delta: myUpdate.delta,
      movesCount,
      reason,
      verified: true,
    };
    eloStore.recordMatch(matchRecordMe);
    eloStore.clearPendingRoomReports(matchId);

    return NextResponse.json<RecordRoomGameResponse>({
      ok: true,
      status: 'completed',
      rated: true,
      ratingBefore: me.rating,
      ratingAfter: myUpdate.newRating,
      delta: myUpdate.delta,
      games: updatedMe.games,
      wins: updatedMe.wins,
      isProvisional: updatedMe.isProvisional,
    });
  } catch (err) {
    console.error('[Elo API] Record room game error:', err);
    return NextResponse.json<RecordRoomGameResponse>(
      { ok: false, status: 'unrated_limit', error: 'internal_error', rated: false },
      { status: 500 }
    );
  }
}
