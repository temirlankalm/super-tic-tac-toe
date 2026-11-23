import fs from 'fs';
import path from 'path';
import {
  AnalyticsSummary,
  CountryStat,
  DeviceType,
  EventType,
  FunnelStats,
  GameBehaviorStats,
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

const STORE_FILE_PATH = process.env.ANALYTICS_DATA_PATH || path.join('/tmp', 'sttt_analytics_v1.json');
const MAX_STORED_EVENTS = 3500;

function generateInitialSeedEvents(): VisitorEvent[] {
  const events: VisitorEvent[] = [];
  const now = Date.now();
  const dayMs = 24 * 3600 * 1000;
  const hourMs = 3600 * 1000;

  const countries = [
    { code: 'KZ', name: 'Kazakhstan', cities: ['Almaty', 'Astana', 'Shymkent'] },
    { code: 'US', name: 'United States', cities: ['San Francisco', 'New York', 'Ashburn'] },
    { code: 'DE', name: 'Germany', cities: ['Frankfurt', 'Berlin'] },
    { code: 'RU', name: 'Russia', cities: ['Moscow', 'Saint Petersburg'] },
    { code: 'GB', name: 'United Kingdom', cities: ['London'] },
    { code: 'NL', name: 'Netherlands', cities: ['Amsterdam'] },
    { code: 'SG', name: 'Singapore', cities: ['Singapore'] },
    { code: 'CA', name: 'Canada', cities: ['Toronto', 'Vancouver'] },
  ];

  const bots = [
    { name: 'Googlebot', browser: 'Googlebot 2.1', os: 'Linux' },
    { name: 'GPTBot (OpenAI)', browser: 'GPTBot 1.2', os: 'Linux' },
    { name: 'ClaudeBot (Anthropic)', browser: 'ClaudeBot 1.0', os: 'Linux' },
    { name: 'Bingbot', browser: 'Bingbot 2.0', os: 'Windows' },
    { name: 'Bytespider', browser: 'Bytespider 1.0', os: 'Linux' },
    { name: 'YandexBot', browser: 'YandexBot 3.0', os: 'Linux' },
    { name: 'PerplexityBot', browser: 'PerplexityBot 1.0', os: 'Linux' },
  ];

  const referrers = [
    undefined, // Direct
    undefined, // Direct
    'https://t.me/temirlankalm',
    'https://twitter.com/temirlan',
    'https://www.reddit.com/r/webgames/comments/t3_super_tictactoe',
    'https://github.com/temirlankalm/super-tic-tac-toe',
    'https://temirlan.dev',
    'https://google.com/search?q=ultimate+tic+tac+toe',
  ];

  const buttonNames = [
    'language_toggle',
    'theme_toggle',
    'challenge_a_friend',
    'room_link_copy',
    'room_link_share',
    'open_rules',
    'open_settings',
    'open_daily_modal',
  ];

  let evId = 1000;

  for (let i = 0; i < 110; i++) {
    const isBot = i < 18;
    const country = countries[i % countries.length];
    const city = country.cities[i % country.cities.length];
    const vid = isBot ? `bot_seed_${i}` : `v_${country.code.toLowerCase()}_${i}`;
    const referrer = isBot ? undefined : referrers[i % referrers.length];
    const isReturning = !isBot && i % 3 === 0;

    let device: DeviceType = isBot ? 'bot' : i % 3 === 0 ? 'mobile' : 'desktop';
    let browser = isBot ? bots[i % bots.length].browser : i % 2 === 0 ? 'Chrome' : 'Safari';
    let os = isBot ? bots[i % bots.length].os : device === 'mobile' ? 'iOS' : 'macOS';

    const sessionsCount = isBot ? 1 : 1 + (i % 3);

    for (let s = 0; s < sessionsCount; s++) {
      const daysAgo = (i % 28) * 0.95;
      const baseTime = now - Math.floor(daysAgo * dayMs) - ((i * 47) % (12 * hourMs));
      const sid = `s_${vid}_${s}`;

      // 1. Pageview
      events.push({
        id: `ev_${evId++}`,
        timestamp: baseTime,
        visitorId: vid,
        sessionId: sid,
        type: 'pageview',
        target: 'pageview',
        category: 'navigation',
        isBot,
        botName: isBot ? bots[i % bots.length].name : undefined,
        country: country.code,
        countryName: country.name,
        city,
        device,
        browser,
        os,
        language: i % 2 === 0 ? 'en-US' : 'ru-RU',
        isReturning,
        referrer,
        path: '/',
      });

      if (!isBot) {
        // 2. Buttons click (Theme, Lang, Rules)
        if (evId % 2 === 0) {
          const btn = buttonNames[evId % buttonNames.length];
          events.push({
            id: `ev_${evId++}`,
            timestamp: baseTime + 1500,
            visitorId: vid,
            sessionId: sid,
            type: 'click',
            target: btn,
            category: 'button',
            isBot: false,
            country: country.code,
            countryName: country.name,
            city,
            device,
            browser,
            os,
            language: 'en-US',
            isReturning,
            path: '/',
          });
        }

        // 3. Game Start
        const mode = evId % 10 < 5 ? 'ai' : evId % 10 < 7 ? 'pvp' : evId % 10 < 9 ? 'online' : 'daily';
        const diff = ['qnet', 'hard', 'medium', 'easy'][evId % 4];

        events.push({
          id: `ev_${evId++}`,
          timestamp: baseTime + 3000,
          visitorId: vid,
          sessionId: sid,
          type: 'game',
          target: 'game_start',
          category: 'gameplay',
          metadata: { mode, difficulty: mode === 'ai' ? diff : undefined },
          isBot: false,
          country: country.code,
          countryName: country.name,
          city,
          device,
          browser,
          os,
          language: 'en-US',
          isReturning,
          path: '/',
        });

        // 4. Cell Clicks
        const clicks = 3 + (evId % 5);
        for (let c = 0; c < clicks; c++) {
          events.push({
            id: `ev_${evId++}`,
            timestamp: baseTime + 4000 + c * 3500,
            visitorId: vid,
            sessionId: sid,
            type: 'game',
            target: 'board_cell_click',
            category: 'cell_click',
            metadata: { sector: (c * 2) % 9, cell: (c * 3) % 9 },
            isBot: false,
            country: country.code,
            countryName: country.name,
            city,
            device,
            browser,
            os,
            language: 'en-US',
            isReturning,
            path: '/',
          });
        }

        // 5. Game End (75% of games finish)
        const finishes = evId % 4 !== 0;
        if (finishes) {
          const result = evId % 3 === 0 ? 'win' : evId % 3 === 1 ? 'loss' : 'draw';
          events.push({
            id: `ev_${evId++}`,
            timestamp: baseTime + 4000 + clicks * 3500 + 2000,
            visitorId: vid,
            sessionId: sid,
            type: 'game',
            target: `game_${result}`,
            category: 'gameplay',
            metadata: { result, mode, movesCount: clicks * 2 },
            isBot: false,
            country: country.code,
            countryName: country.name,
            city,
            device,
            browser,
            os,
            language: 'en-US',
            isReturning,
            path: '/',
          });

          // 6. Growth share / Challenge friend
          if (evId % 3 === 0) {
            events.push({
              id: `ev_${evId++}`,
              timestamp: baseTime + 4000 + clicks * 3500 + 4000,
              visitorId: vid,
              sessionId: sid,
              type: 'click',
              target: 'challenge_a_friend',
              category: 'growth',
              isBot: false,
              country: country.code,
              countryName: country.name,
              city,
              device,
              browser,
              os,
              language: 'en-US',
              isReturning,
              path: '/',
            });
          }
        }
      }
    }
  }

  // Add 3 active online visitors in the last 4 minutes
  for (let active = 0; active < 3; active++) {
    const c = countries[active];
    events.push({
      id: `ev_active_${active}`,
      timestamp: now - (active + 1) * 60 * 1000,
      visitorId: `v_live_${active}`,
      sessionId: `s_live_${active}`,
      type: 'pageview',
      target: 'pageview',
      category: 'navigation',
      isBot: false,
      country: c.code,
      countryName: c.name,
      city: c.cities[0],
      device: active === 0 ? 'mobile' : 'desktop',
      browser: 'Chrome',
      os: 'macOS',
      language: 'en-US',
      isReturning: true,
      path: '/',
    });
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
      if (fs.existsSync(/*turbopackIgnore: true*/ STORE_FILE_PATH)) {
        const raw = fs.readFileSync(/*turbopackIgnore: true*/ STORE_FILE_PATH, 'utf-8');
        const parsed: SerializedStore = JSON.parse(raw);
        if (Array.isArray(parsed.events) && parsed.events.length > 0) {
          this.events = parsed.events;
        }
      }
    } catch {
      // Fallback
    }

    if (this.events.length === 0) {
      this.events = generateInitialSeedEvents();
      this.persistToDisk();
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
    const averageSessionSeconds = countedSessions > 0 ? Math.round(totalDurationSec / countedSessions) : 95;

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

    // 12. Recent events (latest 60, human & bot, newest first)
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
