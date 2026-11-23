export type EventType = 'pageview' | 'click' | 'game' | 'feature';

export type DeviceType = 'desktop' | 'mobile' | 'tablet' | 'bot';

export interface VisitorEvent {
  id: string;
  timestamp: number;
  visitorId: string;
  sessionId: string;
  type: EventType;
  target: string;
  category: string;
  metadata?: Record<string, unknown>;
  isBot: boolean;
  botName?: string;
  country: string;
  countryName: string;
  city?: string;
  device: DeviceType;
  browser: string;
  os: string;
  referrer?: string;
  path: string;
}

export interface CountryStat {
  code: string;
  name: string;
  flag: string;
  count: number;
  uniques: number;
  percentage: number;
  cities: { city: string; count: number }[];
}

export interface TimePoint {
  time: string; // e.g. "14:00" or "2026-11-23"
  label: string;
  count: number;
  uniques: number;
  bots: number;
}

export interface ClickStat {
  target: string;
  category: string;
  count: number;
  percentage: number;
}

export interface FeatureStats {
  gameModes: Record<string, number>;
  difficulties: Record<string, number>;
  modifiers: Record<string, number>;
  timeControls: Record<string, number>;
  sectorsClicked: number[]; // 9 sectors (0..8)
}

export interface AnalyticsSummary {
  totalVisits: number;
  uniqueVisitors: number;
  totalBots: number;
  botPercentage: number;
  topReferrers: { referrer: string; count: number }[];
  devices: { device: DeviceType; count: number; percentage: number }[];
  countries: CountryStat[];
  timeline: TimePoint[]; // hourly for last 24h
  dailyTimeline: TimePoint[]; // daily for last 14-30d
  clickHeatmap: ClickStat[];
  featureStats: FeatureStats;
  recentEvents: VisitorEvent[];
}
