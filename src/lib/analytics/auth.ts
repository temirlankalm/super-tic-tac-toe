import crypto from 'crypto';
import { NextRequest } from 'next/server';
import { ADMIN_COOKIE_NAME, isAdminHost, getAdminCookieDomain } from './constants';

export { ADMIN_COOKIE_NAME, isAdminHost, getAdminCookieDomain };

// In-memory rate limiting for login attempts per hashed IP (max 5 failed attempts / 15 minutes)
interface LoginAttempt {
  count: number;
  firstAttempt: number;
}
const loginAttempts = new Map<string, LoginAttempt>();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes lockout

export function checkLoginRateLimit(clientIpHash: string): {
  allowed: boolean;
  remainingAttempts: number;
  retryAfterSec?: number;
} {
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

/**
 * Constant-time comparison between two buffers of equal length.
 */
function safeTimingCompare(bufA: Buffer, bufB: Buffer): boolean {
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Verifies admin credentials against environment variables ADMIN_EMAIL and ADMIN_PASSWORD / ADMIN_PASSWORD_HASH.
 * Uses constant-time cryptographic comparison (timingSafeEqual) on SHA-256 hashes.
 * Never allows login if no password environment variable is set.
 */
export function verifyAdminCredentials(inputPassword: string, inputEmail?: string): boolean {
  const envEmail = process.env.ADMIN_EMAIL;
  const envPassword = process.env.ADMIN_PASSWORD;
  const envPasswordHash = process.env.ADMIN_PASSWORD_HASH;

  // Never allow login if neither password nor password hash is configured in environment
  if (!envPassword && !envPasswordHash) {
    console.error('[Admin Auth] Authentication blocked: neither ADMIN_PASSWORD nor ADMIN_PASSWORD_HASH is set.');
    return false;
  }

  if (!inputPassword || typeof inputPassword !== 'string') {
    return false;
  }

  // 1. Email check: if ADMIN_EMAIL is configured, enforce exact match
  if (envEmail && envEmail.trim()) {
    if (!inputEmail || typeof inputEmail !== 'string') {
      return false;
    }
    const inputEmailHash = crypto
      .createHash('sha256')
      .update(inputEmail.trim().toLowerCase())
      .digest();
    const targetEmailHash = crypto
      .createHash('sha256')
      .update(envEmail.trim().toLowerCase())
      .digest();

    if (!safeTimingCompare(inputEmailHash, targetEmailHash)) {
      return false;
    }
  }

  // 2. Password check using SHA-256 hash comparison with crypto.timingSafeEqual
  const inputHash = crypto.createHash('sha256').update(inputPassword).digest();

  if (envPasswordHash && envPasswordHash.trim()) {
    try {
      const targetHash = Buffer.from(envPasswordHash.trim().toLowerCase(), 'hex');
      if (targetHash.length === inputHash.length && safeTimingCompare(inputHash, targetHash)) {
        return true;
      }
    } catch {
      return false;
    }
  }

  if (envPassword) {
    const targetHash = crypto.createHash('sha256').update(envPassword).digest();
    return safeTimingCompare(inputHash, targetHash);
  }

  return false;
}

function getSessionSecret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.ADMIN_PASSWORD ||
    'tic3_admin_session_secret_please_set_in_production'
  );
}

export function createSessionToken(): string {
  const now = Date.now();
  const exp = now + 7 * 24 * 3600 * 1000; // 7 days expiration
  const payloadStr = JSON.stringify({ iat: now, exp, role: 'admin' });
  const payloadB64 = Buffer.from(payloadStr).toString('base64url');

  const signature = crypto
    .createHmac('sha256', getSessionSecret())
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
      .createHmac('sha256', getSessionSecret())
      .update(payloadB64)
      .digest('base64url');

    const sigBuf = Buffer.from(signature);
    const expectedSigBuf = Buffer.from(expectedSig);
    if (!safeTimingCompare(sigBuf, expectedSigBuf)) {
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
