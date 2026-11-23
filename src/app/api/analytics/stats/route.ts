import { NextRequest, NextResponse } from 'next/server';
import { analyticsStore } from '@/lib/analytics/store';

const ADMIN_SECRET = process.env.ADMIN_PASSWORD || 'temr';

function checkAuth(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.replace(/^Bearer\s+/i, '') === ADMIN_SECRET) {
    return true;
  }
  const url = new URL(req.url);
  const token = url.searchParams.get('token');
  if (token === ADMIN_SECRET) {
    return true;
  }
  return false;
}

export async function GET(req: NextRequest) {
  try {
    const isAuthed = checkAuth(req);
    if (!isAuthed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const rangeParam = url.searchParams.get('range') as '24h' | '7d' | '30d' | 'all' | null;
    const range = rangeParam || '7d';

    const summary = analyticsStore.getSummary(range);
    return NextResponse.json(summary);
  } catch (err) {
    console.error('[Analytics] Stats fetch error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const isAuthed = checkAuth(req);
    if (!isAuthed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    analyticsStore.clearAll();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
