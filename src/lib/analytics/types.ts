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
  language: string;
  isReturning?: boolean;
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
  time: string; // e.g. "14:00" or "11.23"
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

export interface PeriodStats {
  visits: number;
  uniques: number;
  bots: number;
}

export interface FunnelStats {
  visits: number;
  gameStarts: number;
  gameFinishes: number;
  roomsOrShares: number;
}

export interface GameBehaviorStats {
  startsByMode: Record<string, number>;
  completionRate: number; // 0 to 100 percentage
  totalStarts: number;
  totalFinishes: number;
  averageSessionSeconds: number;
}

export interface ReferrerCategoryStat {
  category: 'Direct' | 'Search' | 'Social' | 'Reddit' | 'Other';
  count: number;
  percentage: number;
  sources: { name: string; count: number }[];
}

export interface HourlyArrivalStat {
  hour: number;
  label: string; // e.g. "00:00" - "23:00"
  count: number;
  uniques: number;
  percentage: number;
}

export interface AnalyticsSummary {
  // Visitors & Periods
  visitorsNow: number; // active in last 5 min
  today: PeriodStats;
  last7d: PeriodStats;
  last30d: PeriodStats;
  totalVisits: number;
  uniqueVisitors: number;
  totalBots: number;
  botPercentage: number;

  // Breakdown
  humansVsBots: {
    humanVisits: number;
    humanUniques: number;
    botVisits: number;
    botUniques: number;
    botPercentage: number;
  };
  returningVsNew: {
    returning: number;
    newVisitors: number;
    returningPercentage: number;
  };

  // Traffic & Geography
  countries: CountryStat[];
  topReferrers: { referrer: string; count: number }[];
  referrersCategorized: ReferrerCategoryStat[];
  devices: { device: DeviceType; count: number; percentage: number }[];
  browsers?: { name: string; count: number; percentage: number }[];
  osBreakdown?: { name: string; count: number; percentage: number }[];

  // Behavior & Funnel
  gameBehavior: GameBehaviorStats;
  funnel: FunnelStats;
  buttonClicks: ClickStat[];
  clickHeatmap: ClickStat[];
  featureStats: FeatureStats;

  // Timelines & Events
  timeline: TimePoint[]; // hourly for last 24h
  dailyTimeline: TimePoint[]; // daily for last 14-30d
  hourlyArrivals: HourlyArrivalStat[]; // 24-hour diurnal distribution (when users arrive)
  recentEvents: VisitorEvent[];
  botBreakdown: { name: string; count: number }[];
}
