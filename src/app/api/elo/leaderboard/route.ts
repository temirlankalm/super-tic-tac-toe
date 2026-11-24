import { NextRequest, NextResponse } from 'next/server';
import { eloStore } from '@/lib/elo/store';
import { checkApiRateLimit } from '@/lib/elo/verifier';

export async function GET(req: NextRequest) {
  try {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      'anonymous_ip';

    if (!checkApiRateLimit(`lb:${ip}`, 60, 60000)) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const playerId = searchParams.get('playerId') || undefined;
    const limit = Math.min(100, Math.max(10, parseInt(searchParams.get('limit') || '100', 10)));

    const leaderboard = eloStore.getLeaderboard(limit, playerId);
    return NextResponse.json(leaderboard, {
      headers: {
        'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=10',
      },
    });
  } catch (err: any) {
    if (err?.digest === 'NEXT_PRERENDER_INTERRUPTED') {
      throw err;
    }
    console.error('[Elo API] Leaderboard fetch error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
