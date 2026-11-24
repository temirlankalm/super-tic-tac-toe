import { NextRequest, NextResponse } from 'next/server';
import {
  ADMIN_BADGE_COOKIE_NAME,
  ADMIN_COOKIE_NAME,
  getAdminBadgeCookieDomain,
  getAdminCookieDomain,
} from '@/lib/analytics/auth';

export async function POST(req: NextRequest) {
  const cookieDomain = getAdminCookieDomain(req);
  const badgeDomain = getAdminBadgeCookieDomain(req);
  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    domain: cookieDomain,
    path: '/',
    maxAge: 0,
  });
  response.cookies.set({
    name: ADMIN_BADGE_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    domain: badgeDomain,
    path: '/',
    maxAge: 0,
  });
  return response;
}
