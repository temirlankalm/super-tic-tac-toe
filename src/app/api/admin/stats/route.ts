import { NextRequest, NextResponse } from 'next/server';
import { analyticsStore } from '@/lib/analytics/store';
import {
  ADMIN_BADGE_COOKIE_NAME,
  createAdminBadgeToken,
  getAdminBadgeCookieDomain,
  verifyAdminBadgeToken,
  verifyAdminRequest,
} from '@/lib/analytics/auth';

export async function GET(req: NextRequest) {
  const isAuthed = verifyAdminRequest(req);
  if (!isAuthed) {
    // Everyone else gets a 404
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    await analyticsStore.ensureHydratedFromKv();
    const url = new URL(req.url);
    const rangeParam = url.searchParams.get('range') as '24h' | '7d' | '30d' | 'all' | null;
    const range = rangeParam || '7d';

    const summary = analyticsStore.getSummary(range);
    const response = NextResponse.json(summary);

    // Ensure the admin visibility badge cookie is set on .ttt.temr.dev whenever authenticated admin loads stats
    const currentBadge = req.cookies.get(ADMIN_BADGE_COOKIE_NAME)?.value;
    if (!verifyAdminBadgeToken(currentBadge)) {
      response.cookies.set({
        name: ADMIN_BADGE_COOKIE_NAME,
        value: createAdminBadgeToken(),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        domain: getAdminBadgeCookieDomain(req),
        path: '/',
        maxAge: 90 * 24 * 3600,
      });
    }

    return response;
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
