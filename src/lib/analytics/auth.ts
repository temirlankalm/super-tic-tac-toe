import crypto from 'crypto';
import { NextRequest } from 'next/server';

export const ADMIN_COOKIE_NAME = 'sttt_admin_session';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;
const SESSION_SECRET =
  process.env.ADMIN_SESSION_SECRET ||
  process.env.ADMIN_PASSWORD ||
  'tic3_admin_default_session_secret_change_in_production';

// In-memory rate limiting for login attempts per hashed IP (max 5 failed attempts / 15 minutes)
interface LoginAttempt {
  count: number;
  firstAttempt: number;
}
const loginAttempts = new Map<string, LoginAttempt>();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export function checkLoginRateLimit(clientIpHash: string): { allowed: boolean; remainingAttempts: number; retryAfterSec?: number } {
  const now = Date.now();
  const attempt = loginAttempts.get(clientIpHash);

  if (!attempt) {
    return { allowed: true, remainingAttempts: MAX_FAILED_ATTEMPTS };
  }

  // If window expired, reset
  if (now - attempt.firstAttempt > LOCKOUT_WINDOW_MS) {
    loginAttempts.delete(clientIpHash);
    return { allowed: true, remainingAttempts: MAX_FAILED_ATTEMPTS };
  }

  if (attempt.count >= MAX_FAILED_ATTEMPTS) {
    const retryAfterSec = Math.ceil((attempt.firstAttempt + LOCKOUT_WINDOW_MS - now) / 1000);
    return { allowed: false, remainingAttempts: 0, retryAfterSec };
  }

  return { allowed: true, remainingAttempts: MAX_FAILED_ATTEMPTS - attempt.count };
}

export function recordFailedLogin(clientIpHash: string) {
  const now = Date.now();
  const attempt = loginAttempts.get(clientIpHash);
  if (!attempt || now - attempt.firstAttempt > LOCKOUT_WINDOW_MS) {
    loginAttempts.set(clientIpHash, { count: 1, firstAttempt: now });
  } else {
    attempt.count += 1;
  }
}

export function resetLoginAttempts(clientIpHash: string) {
  loginAttempts.delete(clientIpHash);
}

function safeCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

export function verifyAdminCredentials(inputPassword: string, inputEmail?: string): boolean {
  if (!inputPassword) return false;

  // 1. Email check if configured
  if (ADMIN_EMAIL && ADMIN_EMAIL.trim()) {
    if (!inputEmail || inputEmail.trim().toLowerCase() !== ADMIN_EMAIL.trim().toLowerCase()) {
      return false;
    }
  }

  // 2. Password Hash check if configured
  if (ADMIN_PASSWORD_HASH && ADMIN_PASSWORD_HASH.trim()) {
    const inputHash = crypto.createHash('sha256').update(inputPassword).digest('hex');
    return safeCompare(inputHash, ADMIN_PASSWORD_HASH.trim().toLowerCase());
  }

  // 3. Plain password check (env var or default 'temr' for dev)
  const targetPassword = ADMIN_PASSWORD || 'temr';
  return safeCompare(inputPassword, targetPassword);
}

export function createSessionToken(): string {
  const now = Date.now();
  const exp = now + 7 * 24 * 3600 * 1000; // 7 days expiration
  const payloadStr = JSON.stringify({ iat: now, exp, role: 'admin' });
  const payloadB64 = Buffer.from(payloadStr).toString('base64url');

  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payloadB64)
    .digest('base64url');

  return `${payloadB64}.${signature}`;
}

export function verifySessionToken(token: string | null | undefined): boolean {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [payloadB64, signature] = parts;
  try {
    const expectedSig = crypto
      .createHmac('sha256', SESSION_SECRET)
      .update(payloadB64)
      .digest('base64url');

    if (!safeCompare(signature, expectedSig)) {
      return false;
    }

    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8'));
    if (!payload.exp || Date.now() > payload.exp) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export function verifyAdminRequest(req: NextRequest | Request): boolean {
  if (req instanceof NextRequest) {
    const cookie = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
    if (cookie && verifySessionToken(cookie)) {
      return true;
    }
    // Check Authorization header fallback (e.g. for scripted API calls with Bearer)
    const auth = req.headers.get('authorization');
    if (auth) {
      const token = auth.replace(/^Bearer\s+/i, '');
      if (verifySessionToken(token) || verifyAdminCredentials(token)) {
        return true;
      }
    }
    return false;
  }

  const cookieHeader = req.headers.get('cookie') || '';
  const match = cookieHeader.match(new RegExp(`(^|;\\s*)${ADMIN_COOKIE_NAME}=([^;]*)`));
  if (match) {
    const val = decodeURIComponent(match[2]);
    return verifySessionToken(val);
  }

  return false;
}
