import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import {
  ADMIN_BADGE_COOKIE_NAME,
  ADMIN_COOKIE_NAME,
  areAdminAuthEnvVarsConfigured,
  checkLoginRateLimit,
  createAdminBadgeToken,
  getAdminBadgeCookieDomain,
  recordFailedLogin,
  resetLoginAttempts,
  verifyAdminBadgeToken,
  verifyAdminCredentials,
  verifySessionToken,
} from '@/lib/analytics/auth';

function hashClientIp(req: NextRequest): string {
  const rawIp =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1';
  return crypto.createHash('sha256').update(rawIp).digest('hex').slice(0, 16);
}

/**
 * Returns whether the current browser carries a valid admin visibility badge.
 * Always returns 200 { isAdmin: boolean } so public page components never reveal admin status to third parties.
 */
export async function GET(req: NextRequest) {
  const badgeToken = req.cookies.get(ADMIN_BADGE_COOKIE_NAME)?.value;
  const sessionToken = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const isAdmin = verifyAdminBadgeToken(badgeToken) || verifySessionToken(sessionToken);
  return NextResponse.json(
    { isAdmin },
    {
      headers: {
        'Cache-Control': 'no-store',
        'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet',
      },
    }
  );
}

/**
 * Allows the site owner on ttt.temr.dev to unlock the personal analytics button on a fresh browser
 * via the hidden admin trigger without navigating away first.
 */
export async function POST(req: NextRequest) {
  if (!areAdminAuthEnvVarsConfigured()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const clientIpHash = hashClientIp(req);
  const rateLimit = checkLoginRateLimit(clientIpHash);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: `Too many attempts. Retry in ${rateLimit.retryAfterSec || 900}s.` },
      { status: 429 }
    );
  }

  try {
    const body = (await req.json()) as { password?: string; email?: string };
    const password = body?.password;

    if (!password) {
      recordFailedLogin(clientIpHash);
      return NextResponse.json({ error: 'Password required' }, { status: 400 });
    }

    if (!verifyAdminCredentials(password, body?.email)) {
      recordFailedLogin(clientIpHash);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    resetLoginAttempts(clientIpHash);
    const badgeToken = createAdminBadgeToken();
    const response = NextResponse.json({ ok: true, isAdmin: true });

    response.cookies.set({
      name: ADMIN_BADGE_COOKIE_NAME,
      value: badgeToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      domain: getAdminBadgeCookieDomain(req),
      path: '/',
      maxAge: 90 * 24 * 3600,
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
