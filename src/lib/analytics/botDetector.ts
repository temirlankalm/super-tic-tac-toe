import { DeviceType } from './types';

const BOT_PATTERNS: { name: string; pattern: RegExp }[] = [
  // Search engines
  { name: 'Googlebot', pattern: /googlebot/i },
  { name: 'Bingbot', pattern: /bingbot|msnbot/i },
  { name: 'YandexBot', pattern: /yandex(bot|images|metrika)/i },
  { name: 'Baiduspider', pattern: /baiduspider/i },
  { name: 'Applebot', pattern: /applebot/i },
  { name: 'DuckDuckBot', pattern: /duckduckbot/i },

  // AI & LLM Crawlers
  { name: 'GPTBot (OpenAI)', pattern: /gptbot/i },
  { name: 'ChatGPT-User', pattern: /chatgpt-user/i },
  { name: 'ClaudeBot (Anthropic)', pattern: /claudebot|anthropic-ai/i },
  { name: 'PerplexityBot', pattern: /perplexitybot/i },
  { name: 'Bytespider (ByteDance)', pattern: /bytespider/i },
  { name: 'CCBot (Common Crawl)', pattern: /ccbot/i },
  { name: 'Cohere', pattern: /cohere-ai/i },
  { name: 'Google-Extended', pattern: /google-extended/i },

  // Social Previews & Messengers
  { name: 'TelegramBot', pattern: /telegrambot/i },
  { name: 'Twitterbot', pattern: /twitterbot/i },
  { name: 'Discordbot', pattern: /discordbot/i },
  { name: 'WhatsApp', pattern: /whatsapp/i },
  { name: 'Slackbot', pattern: /slackbot/i },
  { name: 'FacebookBot', pattern: /facebookexternalhit|facebookbot/i },
  { name: 'LinkedInBot', pattern: /linkedinbot/i },

  // Headless & Automated Tools
  { name: 'HeadlessChrome / Puppeteer', pattern: /headlesschrome|puppeteer|playwright/i },
  { name: 'Python Bot', pattern: /python-requests|aiohttp|urllib/i },
  { name: 'cURL / Wget', pattern: /curl|wget/i },
  { name: 'Go HTTP', pattern: /go-http-client/i },
];

export function detectBot(userAgent: string): { isBot: boolean; botName?: string } {
  if (!userAgent || typeof userAgent !== 'string') {
    return { isBot: true, botName: 'Empty User-Agent' };
  }

  for (const { name, pattern } of BOT_PATTERNS) {
    if (pattern.test(userAgent)) {
      return { isBot: true, botName: name };
    }
  }

  // Generic heuristic for bots or headless browsers
  if (/bot|crawler|spider|scraper|headless|crawl/i.test(userAgent)) {
    return { isBot: true, botName: 'Generic Bot' };
  }

  return { isBot: false };
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
  KZ: 'Казахстан',
  RU: 'Россия',
  US: 'США',
  DE: 'Германия',
  GB: 'Великобритания',
  UZ: 'Узбекистан',
  KG: 'Кыргызстан',
  TR: 'Турция',
  BY: 'Беларусь',
  UA: 'Украина',
  FR: 'Франция',
  NL: 'Нидерланды',
  PL: 'Польша',
  CN: 'Китай',
  SG: 'Сингапур',
  JP: 'Япония',
  KR: 'Южная Корея',
  CA: 'Канада',
  AE: 'ОАЭ',
  GE: 'Грузия',
  AM: 'Армения',
  AZ: 'Азербайджан',
};

export function getCountryDisplayName(isoCode: string, rawHeaderName?: string): string {
  if (rawHeaderName && rawHeaderName.trim()) {
    return rawHeaderName.trim();
  }
  const code = (isoCode || '').toUpperCase();
  return COMMON_COUNTRY_NAMES[code] || code || 'Неизвестно';
}
