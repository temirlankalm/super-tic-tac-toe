import { DeviceType } from './types';

const BOT_PATTERNS: { name: string; pattern: RegExp }[] = [
  // Major Search Engines & Crawlers
  { name: 'Googlebot', pattern: /googlebot|google-inspectiontool|adsbot-google|mediapartners-google/i },
  { name: 'Bingbot', pattern: /bingbot|msnbot|bingpreview/i },
  { name: 'YandexBot', pattern: /yandex(bot|images|metrika|media|blogs|favicons|webmaster)/i },
  { name: 'Baiduspider', pattern: /baiduspider/i },
  { name: 'Applebot', pattern: /applebot/i },
  { name: 'DuckDuckBot', pattern: /duckduckbot|duckduckgo-favicons-bot/i },
  { name: 'Sogou', pattern: /sogou/i },
  { name: 'Yahoo! Slurp', pattern: /slurp/i },

  // AI & LLM Training / Search Crawlers
  { name: 'GPTBot (OpenAI)', pattern: /gptbot/i },
  { name: 'ChatGPT-User', pattern: /chatgpt-user/i },
  { name: 'ClaudeBot (Anthropic)', pattern: /claudebot|anthropic-ai/i },
  { name: 'PerplexityBot', pattern: /perplexitybot/i },
  { name: 'Bytespider (ByteDance)', pattern: /bytespider/i },
  { name: 'CCBot (Common Crawl)', pattern: /ccbot/i },
  { name: 'Cohere', pattern: /cohere-ai/i },
  { name: 'Google-Extended', pattern: /google-extended/i },
  { name: 'Meta-ExternalAgent', pattern: /meta-externalagent|facebookcatalog/i },
  { name: 'Amazonbot', pattern: /amazonbot/i },
  { name: 'Diffbot', pattern: /diffbot/i },

  // Social Previews & Messengers
  { name: 'TelegramBot', pattern: /telegrambot/i },
  { name: 'Twitterbot', pattern: /twitterbot/i },
  { name: 'Discordbot', pattern: /discordbot/i },
  { name: 'WhatsApp', pattern: /whatsapp/i },
  { name: 'Slackbot', pattern: /slackbot|slack-imgproxy/i },
  { name: 'FacebookBot', pattern: /facebookexternalhit|facebot/i },
  { name: 'LinkedInBot', pattern: /linkedinbot/i },
  { name: 'Pinterest', pattern: /pinterest/i },
  { name: 'SkypeUriPreview', pattern: /skypeuripreview/i },
  { name: 'Viber', pattern: /viber/i },

  // Headless & Automation Tools
  { name: 'HeadlessChrome', pattern: /headlesschrome/i },
  { name: 'Puppeteer', pattern: /puppeteer/i },
  { name: 'Playwright', pattern: /playwright/i },
  { name: 'Selenium', pattern: /selenium|webdriver/i },
  { name: 'PhantomJS', pattern: /phantomjs/i },
  { name: 'Cypress', pattern: /cypress/i },

  // HTTP Clients, Scrapers & CLIs
  { name: 'Python Requests', pattern: /python-requests|aiohttp|urllib|scrapy/i },
  { name: 'cURL', pattern: /^curl\//i },
  { name: 'Wget', pattern: /^wget\//i },
  { name: 'Go-http-client', pattern: /go-http-client/i },
  { name: 'Node Fetch / Axios', pattern: /node-fetch|axios|got\/|superagent/i },
  { name: 'Postman', pattern: /postmanruntime/i },
  { name: 'HTTPie', pattern: /httpie/i },
  { name: 'Java HTTP', pattern: /java\/|apache-httpclient/i },
  { name: 'Ruby Net::HTTP', pattern: /ruby|faraday/i },
];

export function detectBot(
  userAgent: string,
  extraSignals?: { isHeadless?: boolean; webdriver?: boolean }
): { isBot: boolean; botName?: string } {
  if (!userAgent || typeof userAgent !== 'string' || userAgent.trim().length === 0) {
    return { isBot: true, botName: 'Empty User-Agent' };
  }

  // Client-side headless webdriver signal
  if (extraSignals?.webdriver || extraSignals?.isHeadless) {
    return { isBot: true, botName: 'Headless Webdriver' };
  }

  for (const { name, pattern } of BOT_PATTERNS) {
    if (pattern.test(userAgent)) {
      return { isBot: true, botName: name };
    }
  }

  // Generic heuristic for bots or crawlers
  if (/\b(bot|crawler|spider|scraper|crawl|headless|archiver|transcoder)\b/i.test(userAgent)) {
    return { isBot: true, botName: 'Generic Bot' };
  }

  return { isBot: false };
}

// In-memory sliding window rate tracker for abnormal request frequency (>35 req / min = flagged as bot)
const recentRequestTimestamps = new Map<string, number[]>();

export function checkAbnormalRate(clientKey: string): boolean {
  if (!clientKey) return false;
  const now = Date.now();
  const oneMinuteAgo = now - 60_000;

  const timestamps = recentRequestTimestamps.get(clientKey) || [];
  const filtered = timestamps.filter((t) => t > oneMinuteAgo);
  filtered.push(now);
  recentRequestTimestamps.set(clientKey, filtered);

  // Periodic cleanup if map grows
  if (recentRequestTimestamps.size > 2000) {
    for (const [key, tsList] of recentRequestTimestamps.entries()) {
      if (tsList.length === 0 || tsList[tsList.length - 1] < oneMinuteAgo) {
        recentRequestTimestamps.delete(key);
      }
    }
  }

  return filtered.length > 35;
}

export function detectDevice(userAgent: string, isBot: boolean): DeviceType {
  if (isBot) return 'bot';
  if (!userAgent) return 'desktop';

  if (/ipad|tablet|(android(?!.*mobile))/i.test(userAgent)) {
    return 'tablet';
  }
  if (/mobile|iphone|ipod|android.*mobile|blackberry|phone/i.test(userAgent)) {
    return 'mobile';
  }
  return 'desktop';
}

export function detectBrowser(userAgent: string): string {
  if (!userAgent) return 'Unknown';
  if (/edg\//i.test(userAgent)) return 'Edge';
  if (/opr\/|opera/i.test(userAgent)) return 'Opera';
  if (/chrome|crios/i.test(userAgent)) return 'Chrome';
  if (/firefox|fxios/i.test(userAgent)) return 'Firefox';
  if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) return 'Safari';
  return 'Other';
}

export function detectOs(userAgent: string): string {
  if (!userAgent) return 'Unknown';
  if (/windows/i.test(userAgent)) return 'Windows';
  if (/macintosh|mac os x/i.test(userAgent)) return 'macOS';
  if (/iphone|ipad|ipod/i.test(userAgent)) return 'iOS';
  if (/android/i.test(userAgent)) return 'Android';
  if (/linux/i.test(userAgent)) return 'Linux';
  return 'Other';
}

/** Converts ISO 3166-1 alpha-2 code to emoji flag, e.g. "KZ" -> "🇰🇿" */
export function countryCodeToFlag(isoCode: string): string {
  if (!isoCode || isoCode.length !== 2) return '🌐';
  const code = isoCode.toUpperCase();
  const first = code.charCodeAt(0) - 65 + 0x1f1e6;
  const second = code.charCodeAt(1) - 65 + 0x1f1e6;
  if (first < 0x1f1e6 || first > 0x1f1ff || second < 0x1f1e6 || second > 0x1f1ff) {
    return '🌐';
  }
  return String.fromCodePoint(first, second);
}

const COMMON_COUNTRY_NAMES: Record<string, string> = {
  KZ: 'Kazakhstan',
  RU: 'Russia',
  US: 'United States',
  DE: 'Germany',
  GB: 'United Kingdom',
  UZ: 'Uzbekistan',
  KG: 'Kyrgyzstan',
  TR: 'Turkey',
  BY: 'Belarus',
  UA: 'Ukraine',
  FR: 'France',
  NL: 'Netherlands',
  PL: 'Poland',
  CN: 'China',
  SG: 'Singapore',
  JP: 'Japan',
  KR: 'South Korea',
  CA: 'Canada',
  AE: 'United Arab Emirates',
  GE: 'Georgia',
  AM: 'Armenia',
  AZ: 'Azerbaijan',
  IN: 'India',
  BR: 'Brazil',
  AU: 'Australia',
  ES: 'Spain',
  IT: 'Italy',
  CH: 'Switzerland',
  SE: 'Sweden',
  FI: 'Finland',
};

export function getCountryDisplayName(isoCode: string, rawHeaderName?: string): string {
  if (rawHeaderName && rawHeaderName.trim()) {
    return rawHeaderName.trim();
  }
  const code = (isoCode || '').toUpperCase();
  return COMMON_COUNTRY_NAMES[code] || code || 'Unknown';
}
