import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { analyticsStore } from '@/lib/analytics/store';
import {
  checkAbnormalRate,
  detectBot,
  detectBrowser,
  detectDevice,
  detectOs,
  getCountryDisplayName,
} from '@/lib/analytics/botDetector';
import { EventType, VisitorEvent } from '@/lib/analytics/types';

function getDailySalt(): string {
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || 'tic3_daily_salt_secret';
  const today = new Date().toISOString().slice(0, 10);
  return crypto.createHash('sha256').update(`${secret}_${today}`).digest('hex');
}

function hashIpAddress(rawIp: string): string {
  if (!rawIp) return 'anonymous_ip';
  const salt = getDailySalt();
  return crypto.createHash('sha256').update(`${rawIp}:${salt}`).digest('hex').slice(0, 16);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      visitorId,
      sessionId,
      type = 'pageview',
      target = 'pageview',
      category = 'navigation',
      metadata,
      path = '/',
      referrer,
      language = 'en',
      isReturning = false,
    } = body as {
      visitorId?: string;
      sessionId?: string;
      type?: EventType;
      target?: string;
      category?: string;
      metadata?: Record<string, unknown>;
      path?: string;
      referrer?: string;
      language?: string;
      isReturning?: boolean;
    };

    if (!visitorId || !sessionId) {
      return NextResponse.json({ error: 'Missing identifiers' }, { status: 400 });
    }

    const userAgent = req.headers.get('user-agent') || '';

    // Privacy-safe IP hashing with daily-rotating salt - RAW IP IS NEVER STORED
    const rawIp =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      '';
    const hashedIp = hashIpAddress(rawIp);

    // Bot detection heuristics
    const clientWebdriver = !!(metadata && metadata.webdriver);
    const botCheck = detectBot(userAgent, { isHeadless: clientWebdriver, webdriver: clientWebdriver });
    const isRateAbnormal = checkAbnormalRate(hashedIp);

    const isBot = botCheck.isBot || isRateAbnormal;
    const botName = botCheck.botName || (isRateAbnormal ? 'High-Frequency Bot' : undefined);

    const device = detectDevice(userAgent, isBot);
    const browser = detectBrowser(userAgent);
    const os = detectOs(userAgent);

    // Geo enrichment via server headers (Vercel & Cloudflare IP headers) - No external geo API
    const rawCountry =
      req.headers.get('x-vercel-ip-country') ||
      req.headers.get('cf-ipcountry') ||
      req.headers.get('x-country-code') ||
      'UNKNOWN';

    const rawCity =
      req.headers.get('x-vercel-ip-city') ||
      req.headers.get('cf-ipcity') ||
      undefined;

    const country = rawCountry.toUpperCase();
    const countryName = getCountryDisplayName(country);

    const event: VisitorEvent = {
      id: `ev_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      timestamp: Date.now(),
      visitorId,
      sessionId,
      type,
      target,
      category,
      metadata,
      isBot,
      botName,
      country,
      countryName,
      city: rawCity ? decodeURIComponent(rawCity) : undefined,
      device,
      browser,
      os,
      language: (language || 'en').slice(0, 10),
      isReturning: Boolean(isReturning),
      referrer: referrer || req.headers.get('referer') || undefined,
      path: path.slice(0, 200),
    };

    analyticsStore.recordEvent(event);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[Analytics] Ingest error:', err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
