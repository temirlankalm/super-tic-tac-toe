import crypto from 'crypto';
import { NextRequest } from 'next/server';
import { ADMIN_COOKIE_NAME, isAdminHost, getAdminCookieDomain } from './constants';

export { ADMIN_COOKIE_NAME, isAdminHost, getAdminCookieDomain };

/**
 * ==============================================================================
 * Rate Limiting & Cold Starts Architecture Note:
 * ==============================================================================
 * This in-memory Map provides rapid rate-limiting per hashed IP (max 5 failed attempts / 15 min).
 *
 * SERVERLESS LIMITATION:
 * In serverless environments (such as Vercel Edge / Lambda functions), in-memory
 * state does not persist across isolated microVM cold starts or concurrent instances.
 * To provide persistent, globally synchronized rate limiting across cold starts without
 * relying on in-process memory, integrate an external distributed key-value store such
 * as Upstash Redis (@upstash/ratelimit) or Vercel KV (@vercel/kv).
 * ==============================================================================
 */
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
 * Checks whether admin credentials are configured in the environment.
 * Requires at least ADMIN_PASSWORD or ADMIN_PASSWORD_HASH.
 */
export function areAdminAuthEnvVarsConfigured(): boolean {
  const password = process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD_HASH;
  return Boolean(password && password.trim());
}

/**
 * Verifies admin credentials against environment variables ADMIN_EMAIL and ADMIN_PASSWORD / ADMIN_PASSWORD_HASH.
 * Uses constant-time cryptographic comparison (timingSafeEqual) on SHA-256 hashes.
 */
export function verifyAdminCredentials(inputPassword: string, inputEmail?: string): boolean {
  if (!areAdminAuthEnvVarsConfigured()) {
    console.error('[Admin Auth] Authentication disabled: ADMIN_PASSWORD is not set.');
    return false;
  }

  const envEmail = process.env.ADMIN_EMAIL?.trim();
  const envPassword = process.env.ADMIN_PASSWORD?.trim();
  const envPasswordHash = process.env.ADMIN_PASSWORD_HASH?.trim();

  if (!inputPassword || typeof inputPassword !== 'string') {
    return false;
  }

  // 1. Email check: if ADMIN_EMAIL is set, compare in constant time
  let emailValid = true;
  if (envEmail) {
    const inputEmailClean = (inputEmail || '').trim().toLowerCase();
    const inputEmailHash = crypto.createHash('sha256').update(inputEmailClean).digest();
    const targetEmailHash = crypto.createHash('sha256').update(envEmail.toLowerCase()).digest();
    emailValid = safeTimingCompare(inputEmailHash, targetEmailHash);
  }

  // 2. Password check using SHA-256 hash comparison with crypto.timingSafeEqual
  const inputHash = crypto.createHash('sha256').update(inputPassword).digest();

  let passwordValid = false;
  if (envPasswordHash) {
    try {
      const targetHash = Buffer.from(envPasswordHash.toLowerCase(), 'hex');
      if (targetHash.length === inputHash.length) {
        passwordValid = safeTimingCompare(inputHash, targetHash);
      }
    } catch {
      passwordValid = false;
    }
  } else if (envPassword) {
    const targetHash = crypto.createHash('sha256').update(envPassword).digest();
    passwordValid = safeTimingCompare(inputHash, targetHash);
  }

  return emailValid && passwordValid;
}

/**
 * Retrieves the session signing secret.
 * Uses ADMIN_SESSION_SECRET if set, or derives a secure 256-bit key from ADMIN_PASSWORD.
 */
export function getSessionSecret(): string {
  if (process.env.ADMIN_SESSION_SECRET?.trim()) {
    return process.env.ADMIN_SESSION_SECRET.trim();
  }
  const pass = process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD_HASH || '';
  if (pass) {
    return crypto.createHmac('sha256', pass).update('tic3_session_secret_derivation_salt_v1').digest('hex');
  }
  return 'tic3_default_secure_session_signing_secret_do_not_rely_in_prod';
}

/**
 * Retrieves the IP salt secret.
 * Uses ANALYTICS_SALT_SECRET/IP_SALT_SECRET if set, or derives a key from ADMIN_PASSWORD.
 */
export function getIpSaltSecret(): string {
  const salt = process.env.ANALYTICS_SALT_SECRET || process.env.IP_SALT_SECRET;
  if (salt?.trim()) {
    return salt.trim();
  }
  const pass = process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD_HASH || '';
  if (pass) {
    return crypto.createHmac('sha256', pass).update('tic3_ip_salt_derivation_salt_v1').digest('hex');
  }
  return 'tic3_default_ip_salt_secret_v1';
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
