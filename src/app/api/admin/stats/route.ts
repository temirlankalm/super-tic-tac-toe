import { NextRequest, NextResponse } from 'next/server';
import { analyticsStore } from '@/lib/analytics/store';
import { verifyAdminRequest } from '@/lib/analytics/auth';

export async function GET(req: NextRequest) {
  const isAuthed = verifyAdminRequest(req);
  if (!isAuthed) {
    // Everyone else gets a 404
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const url = new URL(req.url);
    const rangeParam = url.searchParams.get('range') as '24h' | '7d' | '30d' | 'all' | null;
    const range = rangeParam || '7d';

    const summary = analyticsStore.getSummary(range);
    return NextResponse.json(summary);
  } catch (err) {
    console.error('[Admin API] Stats fetch error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const isAuthed = verifyAdminRequest(req);
  if (!isAuthed) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    analyticsStore.clearAll();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
