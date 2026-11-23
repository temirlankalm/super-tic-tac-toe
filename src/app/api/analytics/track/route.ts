import { NextRequest, NextResponse } from 'next/server';
import { analyticsStore } from '@/lib/analytics/store';
import {
  detectBot,
  detectBrowser,
  detectDevice,
  detectOs,
  getCountryDisplayName,
} from '@/lib/analytics/botDetector';
import { EventType, VisitorEvent } from '@/lib/analytics/types';

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
    } = body as {
      visitorId?: string;
      sessionId?: string;
      type?: EventType;
      target?: string;
      category?: string;
      metadata?: Record<string, unknown>;
      path?: string;
      referrer?: string;
    };

    if (!visitorId || !sessionId) {
      return NextResponse.json({ error: 'Missing identifiers' }, { status: 400 });
    }

    const userAgent = req.headers.get('user-agent') || '';
    const botCheck = detectBot(userAgent);
    const device = detectDevice(userAgent, botCheck.isBot);
    const browser = detectBrowser(userAgent);
    const os = detectOs(userAgent);

    // Geo enrichment via Vercel headers (with Cloudflare fallback)
    const rawCountry =
      req.headers.get('x-vercel-ip-country') ||
      req.headers.get('cf-ipcountry') ||
      'UNKNOWN';
    const city =
      req.headers.get('x-vercel-ip-city') ||
      req.headers.get('cf-ipcity') ||
      undefined;

    const country = rawCountry.toUpperCase();
    const countryName = getCountryDisplayName(country);

    const event: VisitorEvent = {
      id: `ev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      visitorId,
      sessionId,
      type,
      target,
      category,
      metadata,
      isBot: botCheck.isBot,
      botName: botCheck.botName,
      country,
      countryName,
      city: city ? decodeURIComponent(city) : undefined,
      device,
      browser,
      os,
      referrer: referrer || req.headers.get('referer') || undefined,
      path,
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
