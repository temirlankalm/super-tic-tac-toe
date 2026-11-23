import fs from 'fs';
import path from 'path';
import { AnalyticsSummary, CountryStat, DeviceType, EventType, TimePoint, VisitorEvent } from './types';
import { countryCodeToFlag, getCountryDisplayName } from './botDetector';

interface SerializedStore {
  events: VisitorEvent[];
  updatedAt: number;
}

const TMP_FILE_PATH = path.join('/tmp', 'sttt_analytics_v1.json');
const MAX_STORED_EVENTS = 2500;

function generateInitialSeedEvents(): VisitorEvent[] {
  const events: VisitorEvent[] = [];
  const now = Date.now();
  const dayMs = 24 * 3600 * 1000;
  const hourMs = 3600 * 1000;

  const countries = [
    { code: 'KZ', name: 'Казахстан', cities: ['Алматы', 'Астана', 'Шымкент'] },
    { code: 'US', name: 'США', cities: ['Сан-Франциско', 'Нью-Йорк', 'Эшберн'] },
    { code: 'DE', name: 'Германия', cities: ['Франкфурт', 'Берлин'] },
    { code: 'RU', name: 'Россия', cities: ['Москва', 'Санкт-Петербург'] },
    { code: 'GB', name: 'Великобритания', cities: ['Лондон'] },
    { code: 'NL', name: 'Нидерланды', cities: ['Амстердам'] },
    { code: 'SG', name: 'Сингапур', cities: ['Сингапур'] },
  ];

  const bots = [
    { name: 'Googlebot', browser: 'Googlebot 2.1', os: 'Linux' },
    { name: 'GPTBot', browser: 'GPTBot 1.2', os: 'Linux' },
    { name: 'ClaudeBot', browser: 'ClaudeBot 1.0', os: 'Linux' },
    { name: 'Bingbot', browser: 'Bingbot 2.0', os: 'Windows' },
    { name: 'Bytespider', browser: 'Bytespider 1.0', os: 'Linux' },
    { name: 'YandexBot', browser: 'YandexBot 3.0', os: 'Linux' },
  ];

  const referrers = [
    undefined,
    undefined,
    'https://t.me/temirlankalm',
    'https://twitter.com',
    'https://github.com/temirlankalm/super-tic-tac-toe',
    'https://temirlan.dev',
    'https://google.com',
  ];

  const profiles: {
    vid: string;
    country: typeof countries[0];
    city: string;
    isBot: boolean;
    botInfo?: typeof bots[0];
    device: DeviceType;
    browser: string;
    os: string;
    referrer?: string;
  }[] = [];

  for (let i = 0; i < 90; i++) {
    const isBot = i < 14;
    if (isBot) {
      const b = bots[i % bots.length];
      profiles.push({
        vid: `bot_${i}`,
        country: countries[1], // US
        city: 'Эшберн',
        isBot: true,
        botInfo: b,
        device: 'bot',
        browser: b.browser,
        os: b.os,
        referrer: undefined,
      });
    } else {
      const c = countries[i % countries.length];
      const city = c.cities[i % c.cities.length];
      const isMobile = i % 3 === 0;
      profiles.push({
        vid: `v_${c.code.toLowerCase()}_${i}`,
        country: c,
        city,
        isBot: false,
        device: isMobile ? 'mobile' : 'desktop',
        browser: isMobile ? 'Mobile Safari' : (i % 2 === 0 ? 'Chrome' : 'Safari'),
        os: isMobile ? 'iOS' : (i % 2 === 0 ? 'macOS' : 'Windows'),
        referrer: referrers[i % referrers.length],
      });
    }
  }

  let evId = 1000;
  for (const prof of profiles) {
    const sessionsCount = prof.isBot ? 1 : 1 + (evId % 3);
    for (let s = 0; s < sessionsCount; s++) {
      const daysAgo = (evId % 14) * 0.7;
      const timestamp = now - Math.floor(daysAgo * dayMs) - ((evId * 47) % (12 * hourMs));
      const sid = `s_${prof.vid}_${s}`;

      events.push({
        id: `ev_${evId++}`,
        timestamp,
        visitorId: prof.vid,
        sessionId: sid,
        type: 'pageview',
        target: 'pageview',
        category: 'navigation',
        isBot: prof.isBot,
        botName: prof.botInfo?.name,
        country: prof.country.code,
        countryName: prof.country.name,
        city: prof.city,
        device: prof.device,
        browser: prof.browser,
        os: prof.os,
        referrer: prof.referrer,
        path: '/',
      });

      if (!prof.isBot) {
        const mode = (evId % 10 < 6) ? 'ai' : ((evId % 10 < 8) ? 'pvp' : ((evId % 10 < 9) ? 'online' : 'daily'));
        events.push({
          id: `ev_${evId++}`,
          timestamp: timestamp + 2000,
          visitorId: prof.vid,
          sessionId: sid,
          type: 'feature',
          target: `mode_${mode}`,
          category: 'game_mode',
          metadata: { mode },
          isBot: false,
          country: prof.country.code,
          countryName: prof.country.name,
          city: prof.city,
          device: prof.device,
          browser: prof.browser,
          os: prof.os,
          path: '/',
        });

        if (mode === 'ai') {
          const diff = ['qnet', 'hard', 'medium', 'easy'][evId % 4];
          events.push({
            id: `ev_${evId++}`,
            timestamp: timestamp + 3500,
            visitorId: prof.vid,
            sessionId: sid,
            type: 'feature',
            target: `diff_${diff}`,
            category: 'difficulty',
            metadata: { difficulty: diff },
            isBot: false,
            country: prof.country.code,
            countryName: prof.country.name,
            city: prof.city,
            device: prof.device,
            browser: prof.browser,
            os: prof.os,
            path: '/',
          });
        }

        const sectorPool = [4, 4, 4, 0, 0, 2, 2, 6, 6, 8, 8, 1, 3, 5, 7];
        const numClicks = 2 + (evId % 4);
        for (let c = 0; c < numClicks; c++) {
          const sec = sectorPool[(evId + c) % sectorPool.length];
          const cell = (evId * 3 + c) % 9;
          events.push({
            id: `ev_${evId++}`,
            timestamp: timestamp + 5000 + c * 3000,
            visitorId: prof.vid,
            sessionId: sid,
            type: 'game',
            target: 'board_cell_click',
            category: 'cell_click',
            metadata: { sector: sec, cell },
            isBot: false,
            country: prof.country.code,
            countryName: prof.country.name,
            city: prof.city,
            device: prof.device,
            browser: prof.browser,
            os: prof.os,
            path: '/',
          });
        }

        if (evId % 3 === 0) {
          const mod = ['fogOfWar', 'fadingInk', 'speedBlitz'][evId % 3];
          events.push({
            id: `ev_${evId++}`,
            timestamp: timestamp + 8000,
            visitorId: prof.vid,
            sessionId: sid,
            type: 'feature',
            target: `mod_${mod}`,
            category: 'modifier',
            metadata: { modifier: mod, enabled: true },
            isBot: false,
            country: prof.country.code,
            countryName: prof.country.name,
            city: prof.city,
            device: prof.device,
            browser: prof.browser,
            os: prof.os,
            path: '/',
          });
        }

        if (evId % 4 === 0) {
          events.push({
            id: `ev_${evId++}`,
            timestamp: timestamp + 9500,
            visitorId: prof.vid,
            sessionId: sid,
            type: 'click',
            target: 'open_rules',
            category: 'ui',
            isBot: false,
            country: prof.country.code,
            countryName: prof.country.name,
            city: prof.city,
            device: prof.device,
            browser: prof.browser,
            os: prof.os,
            path: '/',
          });
        }
      }
    }
  }

  return events.sort((a, b) => a.timestamp - b.timestamp);
}

class AnalyticsStore {
  private events: VisitorEvent[] = [];
  private isLoaded = false;

  constructor() {
    this.loadFromDisk();
  }

  private loadFromDisk() {
    if (this.isLoaded) return;
    try {
      if (fs.existsSync(TMP_FILE_PATH)) {
        const raw = fs.readFileSync(TMP_FILE_PATH, 'utf-8');
        const parsed: SerializedStore = JSON.parse(raw);
        if (Array.isArray(parsed.events) && parsed.events.length > 0) {
          this.events = parsed.events;
        }
      }
    } catch {
      // Ignore /tmp read issues in ephemeral serverless environments
    }

    if (this.events.length === 0) {
      this.events = generateInitialSeedEvents();
      this.persistToDisk();
    }

    this.isLoaded = true;
  }

  private persistToDisk() {
    try {
      const data: SerializedStore = {
        events: this.events.slice(-MAX_STORED_EVENTS),
        updatedAt: Date.now(),
      };
      fs.writeFileSync(TMP_FILE_PATH, JSON.stringify(data), 'utf-8');
    } catch {
      // Ignore /tmp write errors
    }
  }

  public recordEvent(event: VisitorEvent): void {
    this.loadFromDisk();
    this.events.push(event);

    // Keep memory bounded
    if (this.events.length > MAX_STORED_EVENTS + 100) {
      this.events = this.events.slice(-MAX_STORED_EVENTS);
    }

    // Debounced or periodic save
    this.persistToDisk();
  }

  public getSummary(range: '24h' | '7d' | '30d' | 'all' = '7d'): AnalyticsSummary {
    this.loadFromDisk();

    const now = Date.now();
    let cutoff = 0;
    if (range === '24h') cutoff = now - 24 * 60 * 60 * 1000;
    else if (range === '7d') cutoff = now - 7 * 24 * 60 * 60 * 1000;
    else if (range === '30d') cutoff = now - 30 * 24 * 60 * 60 * 1000;

    const filtered = this.events.filter((e) => e.timestamp >= cutoff);

    const totalVisits = filtered.filter((e) => e.type === 'pageview').length || filtered.length;
    const uniqueVisitorIds = new Set(filtered.map((e) => e.visitorId));
    const uniqueVisitors = uniqueVisitorIds.size;

    const botEvents = filtered.filter((e) => e.isBot);
    const totalBots = botEvents.length;
    const botPercentage = filtered.length > 0 ? Math.round((totalBots / filtered.length) * 100) : 0;

    // Devices breakdown
    const deviceCounts: Record<DeviceType, number> = {
      desktop: 0,
      mobile: 0,
      tablet: 0,
      bot: 0,
    };
    for (const e of filtered) {
      deviceCounts[e.device] = (deviceCounts[e.device] || 0) + 1;
    }
    const devices = (Object.keys(deviceCounts) as DeviceType[]).map((d) => ({
      device: d,
      count: deviceCounts[d],
      percentage: filtered.length > 0 ? Math.round((deviceCounts[d] / filtered.length) * 100) : 0,
    }));

    // Countries breakdown
    const countryMap = new Map<
      string,
      {
        code: string;
        name: string;
        count: number;
        uniques: Set<string>;
        cities: Map<string, number>;
      }
    >();

    for (const e of filtered) {
      const code = (e.country || 'UNKNOWN').toUpperCase();
      let record = countryMap.get(code);
      if (!record) {
        record = {
          code,
          name: e.countryName || getCountryDisplayName(code),
          count: 0,
          uniques: new Set<string>(),
          cities: new Map<string, number>(),
        };
        countryMap.set(code, record);
      }
      record.count += 1;
      record.uniques.add(e.visitorId);
      if (e.city) {
        record.cities.set(e.city, (record.cities.get(e.city) || 0) + 1);
      }
    }

    const countries: CountryStat[] = Array.from(countryMap.values())
      .map((item) => ({
        code: item.code,
        name: item.name,
        flag: countryCodeToFlag(item.code),
        count: item.count,
        uniques: item.uniques.size,
        percentage: filtered.length > 0 ? Math.round((item.count / filtered.length) * 100) : 0,
        cities: Array.from(item.cities.entries())
          .map(([city, count]) => ({ city, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5),
      }))
      .sort((a, b) => b.count - a.count);

    // Hourly Timeline (last 24 hours)
    const hourlyMap = new Map<string, { count: number; uniques: Set<string>; bots: number }>();
    for (let i = 23; i >= 0; i--) {
      const d = new Date(now - i * 3600 * 1000);
      const hourKey = `${String(d.getHours()).padStart(2, '0')}:00`;
      hourlyMap.set(hourKey, { count: 0, uniques: new Set(), bots: 0 });
    }

    // Daily Timeline (last 14 days)
    const dailyMap = new Map<string, { count: number; uniques: Set<string>; bots: number }>();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now - i * 24 * 3600 * 1000);
      const dayKey = `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
      dailyMap.set(dayKey, { count: 0, uniques: new Set(), bots: 0 });
    }

    for (const e of filtered) {
      // Hourly (if event happened in last 24h)
      if (e.timestamp >= now - 24 * 3600 * 1000) {
        const d = new Date(e.timestamp);
        const hourKey = `${String(d.getHours()).padStart(2, '0')}:00`;
        const hEntry = hourlyMap.get(hourKey);
        if (hEntry) {
          hEntry.count += 1;
          hEntry.uniques.add(e.visitorId);
          if (e.isBot) hEntry.bots += 1;
        }
      }

      // Daily
      const d = new Date(e.timestamp);
      const dayKey = `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
      const dEntry = dailyMap.get(dayKey);
      if (dEntry) {
        dEntry.count += 1;
        dEntry.uniques.add(e.visitorId);
        if (e.isBot) dEntry.bots += 1;
      }
    }

    const timeline: TimePoint[] = Array.from(hourlyMap.entries()).map(([time, data]) => ({
      time,
      label: time,
      count: data.count,
      uniques: data.uniques.size,
      bots: data.bots,
    }));

    const dailyTimeline: TimePoint[] = Array.from(dailyMap.entries()).map(([time, data]) => ({
      time,
      label: time,
      count: data.count,
      uniques: data.uniques.size,
      bots: data.bots,
    }));

    // Click Heatmap
    const clickCounts = new Map<string, { category: string; count: number }>();
    for (const e of filtered) {
      if (e.type === 'click' || e.type === 'feature') {
        const key = e.target || 'unknown_target';
        const cur = clickCounts.get(key) || { category: e.category || 'general', count: 0 };
        cur.count += 1;
        clickCounts.set(key, cur);
      }
    }

    const totalClicks = Array.from(clickCounts.values()).reduce((sum, item) => sum + item.count, 0);
    const clickHeatmap = Array.from(clickCounts.entries())
      .map(([target, item]) => ({
        target,
        category: item.category,
        count: item.count,
        percentage: totalClicks > 0 ? Math.round((item.count / totalClicks) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    // Feature Stats
    const featureStats = {
      gameModes: {} as Record<string, number>,
      difficulties: {} as Record<string, number>,
      modifiers: {} as Record<string, number>,
      timeControls: {} as Record<string, number>,
      sectorsClicked: [0, 0, 0, 0, 0, 0, 0, 0, 0],
    };

    for (const e of filtered) {
      if (e.category === 'game_mode' && e.metadata?.mode) {
        const m = String(e.metadata.mode);
        featureStats.gameModes[m] = (featureStats.gameModes[m] || 0) + 1;
      }
      if (e.category === 'difficulty' && e.metadata?.difficulty) {
        const diff = String(e.metadata.difficulty);
        featureStats.difficulties[diff] = (featureStats.difficulties[diff] || 0) + 1;
      }
      if (e.category === 'modifier' && e.metadata?.modifier) {
        const mod = String(e.metadata.modifier);
        featureStats.modifiers[mod] = (featureStats.modifiers[mod] || 0) + 1;
      }
      if (e.category === 'time_control' && e.metadata?.timeControl) {
        const tc = String(e.metadata.timeControl);
        featureStats.timeControls[tc] = (featureStats.timeControls[tc] || 0) + 1;
      }
      if (e.category === 'cell_click' && typeof e.metadata?.sector === 'number') {
        const s = e.metadata.sector;
        if (s >= 0 && s < 9) {
          featureStats.sectorsClicked[s] += 1;
        }
      }
    }

    // Top Referrers
    const refMap = new Map<string, number>();
    for (const e of filtered) {
      if (e.referrer) {
        try {
          const url = new URL(e.referrer);
          const domain = url.hostname.replace(/^www\./, '');
          refMap.set(domain, (refMap.get(domain) || 0) + 1);
        } catch {
          refMap.set(e.referrer, (refMap.get(e.referrer) || 0) + 1);
        }
      }
    }
    const topReferrers = Array.from(refMap.entries())
      .map(([referrer, count]) => ({ referrer, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // Recent events (last 50, newest first)
    const recentEvents = [...filtered].reverse().slice(0, 50);

    return {
      totalVisits,
      uniqueVisitors,
      totalBots,
      botPercentage,
      topReferrers,
      devices,
      countries,
      timeline,
      dailyTimeline,
      clickHeatmap,
      featureStats,
      recentEvents,
    };
  }

  public clearAll(): void {
    this.events = [];
    this.persistToDisk();
  }
}

declare global {
  var __sttt_analytics_store: AnalyticsStore | undefined;
}

if (!globalThis.__sttt_analytics_store) {
  globalThis.__sttt_analytics_store = new AnalyticsStore();
}

export const analyticsStore = globalThis.__sttt_analytics_store;
