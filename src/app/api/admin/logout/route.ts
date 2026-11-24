import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE_NAME, getAdminCookieDomain } from '@/lib/analytics/auth';

export async function POST(req: NextRequest) {
  const cookieDomain = getAdminCookieDomain(req);
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
  return response;
}
