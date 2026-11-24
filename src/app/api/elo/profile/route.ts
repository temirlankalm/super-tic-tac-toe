import { NextRequest, NextResponse } from 'next/server';
import { eloStore } from '@/lib/elo/store';
import { checkApiRateLimit } from '@/lib/elo/verifier';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const playerId = searchParams.get('playerId');
    const nickname = searchParams.get('nickname') || 'Player';

    if (!playerId) {
      return NextResponse.json({ error: 'Missing playerId' }, { status: 400 });
    }

    const { player } = eloStore.getOrCreatePlayer(playerId, nickname);
    return NextResponse.json(player);
  } catch (err: any) {
    if (err?.digest === 'NEXT_PRERENDER_INTERRUPTED') {
      throw err;
    }
    console.error('[Elo API] Profile fetch error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      'anonymous_ip';

    if (!checkApiRateLimit(`profile:${ip}`, 30, 60000)) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const body = await req.json();
    const { playerId, nickname } = body;

    if (!playerId || !nickname) {
      return NextResponse.json({ error: 'Missing playerId or nickname' }, { status: 400 });
    }

    const res = eloStore.updateNickname(playerId, String(nickname));
    if (!res.ok) {
      return NextResponse.json({ ok: false, error: res.error }, { status: 400 });
    }

    return NextResponse.json({ ok: true, player: res.player });
  } catch (err) {
    console.error('[Elo API] Profile update error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
