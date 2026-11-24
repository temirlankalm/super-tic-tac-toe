import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import {
  ADMIN_COOKIE_NAME,
  areAdminAuthEnvVarsConfigured,
  checkLoginRateLimit,
  createSessionToken,
  getAdminCookieDomain,
  recordFailedLogin,
  resetLoginAttempts,
  verifyAdminCredentials,
} from '@/lib/analytics/auth';

function hashClientIp(req: NextRequest): string {
  const rawIp =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1';
  return crypto.createHash('sha256').update(rawIp).digest('hex').slice(0, 16);
}

export async function POST(req: NextRequest) {
  // If admin environment variables are not configured, admin login is disabled -> 404
  if (!areAdminAuthEnvVarsConfigured()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const clientIpHash = hashClientIp(req);
  const rateLimit = checkLoginRateLimit(clientIpHash);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: `Слишком много попыток входа. Попробуйте через ${rateLimit.retryAfterSec || 900} сек.`,
        retryAfter: rateLimit.retryAfterSec,
      },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const { password, email } = body as { password?: string; email?: string };

    if (!password) {
      recordFailedLogin(clientIpHash);
      return NextResponse.json({ error: 'Пароль обязателен' }, { status: 400 });
    }

    const isValid = verifyAdminCredentials(password, email);

    if (!isValid) {
      recordFailedLogin(clientIpHash);
      const updatedLimit = checkLoginRateLimit(clientIpHash);
      return NextResponse.json(
        {
          error: 'Неверные данные доступа',
          remainingAttempts: updatedLimit.remainingAttempts,
        },
        { status: 401 }
      );
    }

    // Success: clear rate limit counter and issue session token
    resetLoginAttempts(clientIpHash);
    const token = createSessionToken();
    const cookieDomain = getAdminCookieDomain(req);

    const response = NextResponse.json({ ok: true });
    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      domain: cookieDomain,
      path: '/',
      maxAge: 7 * 24 * 3600, // 7 days session expiry
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
