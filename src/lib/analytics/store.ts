import fs from 'fs';
import path from 'path';
import {
  AnalyticsSummary,
  CountryStat,
  DeviceType,
  EventType,
  FunnelStats,
  GameBehaviorStats,
  HourlyArrivalStat,
  PeriodStats,
  ReferrerCategoryStat,
  TimePoint,
  VisitorEvent,
} from './types';
import { countryCodeToFlag, getCountryDisplayName } from './botDetector';

interface SerializedStore {
  events: VisitorEvent[];
  updatedAt: number;
}

const STORE_FILE_PATH = process.env.ANALYTICS_DATA_PATH || path.join('/tmp', 'sttt_analytics_pure_live_v4.json');
const MAX_STORED_EVENTS = 5000;

class AnalyticsStore {
  private events: VisitorEvent[] = [];
  private isLoaded = false;

  constructor() {
    this.loadFromDisk();
  }

  private loadFromDisk() {
    if (this.isLoaded) return;
    try {
      if (fs.existsSync(/*turbopackIgnore: true*/ STORE_FILE_PATH)) {
        const raw = fs.readFileSync(/*turbopackIgnore: true*/ STORE_FILE_PATH, 'utf-8');
        const parsed: SerializedStore = JSON.parse(raw);
        if (Array.isArray(parsed.events)) {
          // Keep only genuine live traffic; discard any demo/seed remnants
          this.events = parsed.events.filter(
            (e) =>
              !e.id?.includes('seed') &&
              !e.id?.includes('active_') &&
              !e.visitorId?.includes('seed_') &&
              !e.visitorId?.startsWith('v_kz_') &&
              !e.visitorId?.startsWith('v_live_')
          );
        }
      }
    } catch {
      // Fallback
    }

    this.isLoaded = true;
  }

  private persistToDisk() {
    try {
      const dir = path.dirname(STORE_FILE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const data: SerializedStore = {
        events: this.events.slice(-MAX_STORED_EVENTS),
        updatedAt: Date.now(),
      };
      fs.writeFileSync(STORE_FILE_PATH, JSON.stringify(data), 'utf-8');
    } catch {
      // Ignore disk errors in serverless
    }
  }

  public recordEvent(event: VisitorEvent): void {
    this.loadFromDisk();
    this.events.push(event);

    if (this.events.length > MAX_STORED_EVENTS + 150) {
      this.events = this.events.slice(-MAX_STORED_EVENTS);
    }

    this.persistToDisk();

    // Async sync to Upstash / Vercel KV if configured in environment
    const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
    if (kvUrl && kvToken) {
      fetch(`${kvUrl}/rpush/sttt_live_events/${encodeURIComponent(JSON.stringify(event))}`, {
        headers: { Authorization: `Bearer ${kvToken}` },
      }).catch(() => {});
    }
  }

  public getSummary(range: '24h' | '7d' | '30d' | 'all' = '7d'): AnalyticsSummary {
    this.loadFromDisk();
    const now = Date.now();

    let cutoff = 0;
    if (range === '24h') cutoff = now - 24 * 3600 * 1000;
    else if (range === '7d') cutoff = now - 7 * 24 * 3600 * 1000;
    else if (range === '30d') cutoff = now - 30 * 24 * 3600 * 1000;

    const filtered = this.events.filter((e) => e.timestamp >= cutoff);

    // 1. Visitors Now (last 5 minutes, human only)
    const fiveMinAgo = now - 5 * 60 * 1000;
    const activeRecentVisitors = new Set(
      this.events
        .filter((e) => e.timestamp >= fiveMinAgo && !e.isBot)
        .map((e) => e.visitorId)
    );
    const visitorsNow = activeRecentVisitors.size;

    // Helper for periods
    const computePeriod = (since: number): PeriodStats => {
      const evs = this.events.filter((e) => e.timestamp >= since);
      const humans = evs.filter((e) => !e.isBot);
      const uniques = new Set(humans.map((e) => e.visitorId)).size;
      const bots = evs.filter((e) => e.isBot).length;
      return {
        visits: humans.filter((e) => e.type === 'pageview').length || humans.length,
        uniques,
        bots,
      };
    };

    const startOfToday = new Date().setHours(0, 0, 0, 0);
    const today = computePeriod(startOfToday);
    const last7d = computePeriod(now - 7 * 24 * 3600 * 1000);
    const last30d = computePeriod(now - 30 * 24 * 3600 * 1000);

    // 2. Humans vs Bots
    const humanEvents = filtered.filter((e) => !e.isBot);
    const botEvents = filtered.filter((e) => e.isBot);

    const humanVisits = humanEvents.filter((e) => e.type === 'pageview').length || humanEvents.length;
    const humanUniques = new Set(humanEvents.map((e) => e.visitorId)).size;
    const botVisits = botEvents.length;
    const botUniques = new Set(botEvents.map((e) => e.visitorId)).size;
    const totalEvents = filtered.length;
    const botPercentage = totalEvents > 0 ? Math.round((botVisits / totalEvents) * 100) : 0;

    const humansVsBots = {
      humanVisits,
      humanUniques,
      botVisits,
      botUniques,
      botPercentage,
    };

    const totalVisits = humanVisits;
    const uniqueVisitors = humanUniques;
    const totalBots = botVisits;

    // 3. Returning vs New (human only)
    let returningCount = 0;
    let newCount = 0;
    const seenHumanVids = new Set<string>();

    for (const e of humanEvents) {
      if (seenHumanVids.has(e.visitorId)) continue;
      seenHumanVids.add(e.visitorId);
      if (e.isReturning) {
        returningCount++;
      } else {
        newCount++;
      }
    }
    const totalUniqueSeen = returningCount + newCount;
    const returningPercentage =
      totalUniqueSeen > 0 ? Math.round((returningCount / totalUniqueSeen) * 100) : 0;

    const returningVsNew = {
      returning: returningCount,
      newVisitors: newCount,
      returningPercentage,
    };

    // 4. Devices (human only)
    const deviceCounts: Record<DeviceType, number> = {
      desktop: 0,
      mobile: 0,
      tablet: 0,
      bot: 0,
    };
    for (const e of humanEvents) {
      deviceCounts[e.device] = (deviceCounts[e.device] || 0) + 1;
    }
    const devices = (['desktop', 'mobile', 'tablet'] as DeviceType[]).map((d) => ({
      device: d,
      count: deviceCounts[d],
      percentage: humanEvents.length > 0 ? Math.round((deviceCounts[d] / humanEvents.length) * 100) : 0,
    }));

    // 5. Countries (human only)
    const countryMap = new Map<
      string,
      { code: string; name: string; count: number; uniques: Set<string>; cities: Map<string, number> }
    >();

    for (const e of humanEvents) {
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
        percentage: humanEvents.length > 0 ? Math.round((item.count / humanEvents.length) * 100) : 0,
        cities: Array.from(item.cities.entries())
          .map(([city, count]) => ({ city, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5),
      }))
      .sort((a, b) => b.count - a.count);

    // 6. Referrers & Categorization
    const rawRefMap = new Map<string, number>();
    const categoryMap: Record<'Direct' | 'Search' | 'Social' | 'Reddit' | 'Other', Map<string, number>> = {
      Direct: new Map(),
      Search: new Map(),
      Social: new Map(),
      Reddit: new Map(),
      Other: new Map(),
    };

    for (const e of humanEvents) {
      const ref = e.referrer?.trim();
      if (!ref) {
        categoryMap.Direct.set('direct', (categoryMap.Direct.get('direct') || 0) + 1);
        rawRefMap.set('direct', (rawRefMap.get('direct') || 0) + 1);
        continue;
      }

      let host = ref;
      try {
        host = new URL(ref).hostname.replace(/^www\./, '');
      } catch {}

      rawRefMap.set(host, (rawRefMap.get(host) || 0) + 1);

      if (/reddit\.com|redd\.it/i.test(host)) {
        categoryMap.Reddit.set(host, (categoryMap.Reddit.get(host) || 0) + 1);
      } else if (/google\.|bing\.|duckduckgo\.|yandex\.|baidu\.|yahoo\./i.test(host)) {
        categoryMap.Search.set(host, (categoryMap.Search.get(host) || 0) + 1);
      } else if (/twitter\.com|x\.com|t\.me|telegram|linkedin\.com|facebook\.com|instagram\.com/i.test(host)) {
        categoryMap.Social.set(host, (categoryMap.Social.get(host) || 0) + 1);
      } else {
        categoryMap.Other.set(host, (categoryMap.Other.get(host) || 0) + 1);
      }
    }

    const topReferrers = Array.from(rawRefMap.entries())
      .map(([referrer, count]) => ({ referrer, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const totalReferrersCount = humanEvents.length || 1;
    const referrersCategorized: ReferrerCategoryStat[] = (
      ['Direct', 'Search', 'Social', 'Reddit', 'Other'] as const
    ).map((cat) => {
      const map = categoryMap[cat];
      const count = Array.from(map.values()).reduce((sum, v) => sum + v, 0);
      const sources = Array.from(map.entries())
        .map(([name, c]) => ({ name, count: c }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      return {
        category: cat,
        count,
        percentage: Math.round((count / totalReferrersCount) * 100),
        sources,
      };
    });

    // 7. Behavior & Funnel
    const startsByMode: Record<string, number> = {};
    let totalStarts = 0;
    let totalFinishes = 0;
    let roomsOrShares = 0;

    // Session duration calculations
    const sessionTimes = new Map<string, { min: number; max: number }>();

    for (const e of humanEvents) {
      // Session time span
      const st = sessionTimes.get(e.sessionId);
      if (!st) {
        sessionTimes.set(e.sessionId, { min: e.timestamp, max: e.timestamp });
      } else {
        st.min = Math.min(st.min, e.timestamp);
        st.max = Math.max(st.max, e.timestamp);
      }

      // Game starts
      if (e.target === 'game_start' || (e.category === 'game_mode' && e.metadata?.mode)) {
        totalStarts++;
        const mode = String(e.metadata?.mode || 'ai');
        const diff = e.metadata?.difficulty ? ` (${e.metadata.difficulty})` : '';
        const modeKey = `${mode}${diff}`;
        startsByMode[modeKey] = (startsByMode[modeKey] || 0) + 1;
      }

      // Game finishes
      if (
        e.target === 'game_finish' ||
        e.target === 'game_win' ||
        e.target === 'game_loss' ||
        e.target === 'game_draw'
      ) {
        totalFinishes++;
      }

      // Rooms created & links shared
      if (
        e.target === 'room_created' ||
        e.target === 'room_link_copy' ||
        e.target === 'room_link_share' ||
        e.target === 'challenge_a_friend' ||
        e.target === 'share_result'
      ) {
        roomsOrShares++;
      }
    }

    const completionRate =
      totalStarts > 0 ? Math.min(100, Math.round((totalFinishes / totalStarts) * 100)) : 0;

    let totalDurationSec = 0;
    let countedSessions = 0;
    for (const { min, max } of sessionTimes.values()) {
      const diffSec = Math.round((max - min) / 1000);
      if (diffSec > 0 && diffSec < 3600) {
        totalDurationSec += diffSec;
        countedSessions++;
      }
    }
    const averageSessionSeconds = countedSessions > 0 ? Math.round(totalDurationSec / countedSessions) : 0;

    const gameBehavior: GameBehaviorStats = {
      startsByMode,
      completionRate,
      totalStarts,
      totalFinishes,
      averageSessionSeconds,
    };

    const visitsCount = humanEvents.filter((e) => e.type === 'pageview').length || humanEvents.length;
    const funnel: FunnelStats = {
      visits: visitsCount,
      gameStarts: totalStarts,
      gameFinishes: totalFinishes,
      roomsOrShares,
    };

    // 8. Button Clicks
    const buttonClickMap = new Map<string, number>();
    for (const e of humanEvents) {
      if (e.type === 'click' || e.category === 'button') {
        const key = e.target;
        buttonClickMap.set(key, (buttonClickMap.get(key) || 0) + 1);
      }
    }
    const totalButtons = Array.from(buttonClickMap.values()).reduce((sum, v) => sum + v, 0);
    const buttonClicks = Array.from(buttonClickMap.entries())
      .map(([target, count]) => ({
        target,
        category: 'button',
        count,
        percentage: totalButtons > 0 ? Math.round((count / totalButtons) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);

    // 9. Click Heatmap & Feature Stats
    const clickCounts = new Map<string, { category: string; count: number }>();
    for (const e of humanEvents) {
      if (e.type === 'click' || e.type === 'feature' || e.type === 'game') {
        const key = e.target || 'action';
        const cur = clickCounts.get(key) || { category: e.category || 'ui', count: 0 };
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

    const featureStats = {
      gameModes: {} as Record<string, number>,
      difficulties: {} as Record<string, number>,
      modifiers: {} as Record<string, number>,
      timeControls: {} as Record<string, number>,
      sectorsClicked: [0, 0, 0, 0, 0, 0, 0, 0, 0],
    };

    for (const e of humanEvents) {
      if (e.category === 'game_mode' && e.metadata?.mode) {
        const m = String(e.metadata.mode);
        featureStats.gameModes[m] = (featureStats.gameModes[m] || 0) + 1;
      }
      if ((e.category === 'difficulty' || e.target === 'game_start') && e.metadata?.difficulty) {
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

    // 10. Bots Breakdown
    const botCountMap = new Map<string, number>();
    for (const e of botEvents) {
      const bname = e.botName || 'Unknown Bot';
      botCountMap.set(bname, (botCountMap.get(bname) || 0) + 1);
    }
    const botBreakdown = Array.from(botCountMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // 11. Timelines (Hourly 24h & Daily 14d)
    const hourlyMap = new Map<string, { count: number; uniques: Set<string>; bots: number }>();
    for (let i = 23; i >= 0; i--) {
      const d = new Date(now - i * 3600 * 1000);
      const hourKey = `${String(d.getHours()).padStart(2, '0')}:00`;
      hourlyMap.set(hourKey, { count: 0, uniques: new Set(), bots: 0 });
    }

    const dailyMap = new Map<string, { count: number; uniques: Set<string>; bots: number }>();
    const daySpan = range === '30d' || range === 'all' ? 30 : 14;
    for (let i = daySpan - 1; i >= 0; i--) {
      const d = new Date(now - i * 24 * 3600 * 1000);
      const dayKey = `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
      dailyMap.set(dayKey, { count: 0, uniques: new Set(), bots: 0 });
    }

    for (const e of filtered) {
      if (e.timestamp >= now - 24 * 3600 * 1000) {
        const d = new Date(e.timestamp);
        const hourKey = `${String(d.getHours()).padStart(2, '0')}:00`;
        const hEntry = hourlyMap.get(hourKey);
        if (hEntry) {
          if (e.isBot) {
            hEntry.bots += 1;
          } else {
            hEntry.count += 1;
            hEntry.uniques.add(e.visitorId);
          }
        }
      }

      const d = new Date(e.timestamp);
      const dayKey = `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
      const dEntry = dailyMap.get(dayKey);
      if (dEntry) {
        if (e.isBot) {
          dEntry.bots += 1;
        } else {
          dEntry.count += 1;
          dEntry.uniques.add(e.visitorId);
        }
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

    // 12. Hourly Arrival Distribution (00:00 - 23:00)
    const hourlyArrivalBuckets: { count: number; uniques: Set<string> }[] = Array.from(
      { length: 24 },
      () => ({ count: 0, uniques: new Set<string>() })
    );

    for (const e of humanEvents) {
      const h = new Date(e.timestamp).getHours();
      if (h >= 0 && h < 24) {
        hourlyArrivalBuckets[h].count += 1;
        hourlyArrivalBuckets[h].uniques.add(e.visitorId);
      }
    }

    const totalHourlyArrivals = hourlyArrivalBuckets.reduce((s, b) => s + b.count, 0) || 1;

    const hourlyArrivals: HourlyArrivalStat[] = hourlyArrivalBuckets.map((b, h) => ({
      hour: h,
      label: `${String(h).padStart(2, '0')}:00`,
      count: b.count,
      uniques: b.uniques.size,
      percentage: Math.round((b.count / totalHourlyArrivals) * 100),
    }));

    // 13. Recent events (latest 60, human & bot, newest first)
    const recentEvents = [...filtered].reverse().slice(0, 60);

    return {
      visitorsNow,
      today,
      last7d,
      last30d,
      totalVisits,
      uniqueVisitors,
      totalBots,
      botPercentage,
      humansVsBots,
      returningVsNew,
      countries,
      topReferrers,
      referrersCategorized,
      devices,
      gameBehavior,
      funnel,
      buttonClicks,
      clickHeatmap,
      featureStats,
      timeline,
      dailyTimeline,
      hourlyArrivals,
      recentEvents,
      botBreakdown,
    };
  }

  public exportCsv(range: '24h' | '7d' | '30d' | 'all' = '7d'): string {
    this.loadFromDisk();
    const now = Date.now();
    let cutoff = 0;
    if (range === '24h') cutoff = now - 24 * 3600 * 1000;
    else if (range === '7d') cutoff = now - 7 * 24 * 3600 * 1000;
    else if (range === '30d') cutoff = now - 30 * 24 * 3600 * 1000;

    const filtered = this.events.filter((e) => e.timestamp >= cutoff);

    const headers = [
      'id',
      'timestamp',
      'iso_time',
      'type',
      'target',
      'category',
      'visitor_id',
      'session_id',
      'country',
      'country_name',
      'city',
      'device',
      'browser',
      'os',
      'language',
      'is_returning',
      'is_bot',
      'bot_name',
      'path',
      'referrer',
      'metadata',
    ];

    const escapeCsv = (val: unknown): string => {
      if (val === undefined || val === null) return '';
      const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = filtered.map((e) => [
      e.id,
      e.timestamp,
      new Date(e.timestamp).toISOString(),
      e.type,
      e.target,
      e.category,
      e.visitorId,
      e.sessionId,
      e.country,
      e.countryName,
      e.city || '',
      e.device,
      e.browser,
      e.os,
      e.language,
      e.isReturning ? 'true' : 'false',
      e.isBot ? 'true' : 'false',
      e.botName || '',
      e.path,
      e.referrer || '',
      e.metadata ? JSON.stringify(e.metadata) : '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map(escapeCsv).join(',')),
    ].join('\n');

    return csvContent;
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
