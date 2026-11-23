'use client';

import { EventType } from './types';

const VID_STORAGE_KEY = 'sttt_analytics_vid';
const SID_STORAGE_KEY = 'sttt_analytics_sid';
const VISITED_BEFORE_KEY = 'sttt_visited_before';

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
  return match ? decodeURIComponent(match[3]) : null;
}

function setCookie(name: string, value: string, maxAgeSec: number = 31536000) {
  if (typeof document === 'undefined') return;
  try {
    document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAgeSec}; Path=/; SameSite=Lax`;
  } catch {}
}

function isDoNotTrack(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const nav = window.navigator as { doNotTrack?: string; globalPrivacyControl?: boolean };
    const win = window as unknown as { doNotTrack?: string };
    return (
      nav.doNotTrack === '1' ||
      nav.doNotTrack === 'yes' ||
      win.doNotTrack === '1' ||
      nav.globalPrivacyControl === true
    );
  } catch {
    return false;
  }
}

function getOrCreateVisitorId(): string {
  if (typeof window === 'undefined') return 'server';
  try {
    let vid = getCookie('sttt_vid') || localStorage.getItem(VID_STORAGE_KEY);
    if (!vid) {
      vid = `v_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem(VID_STORAGE_KEY, vid);
      setCookie('sttt_vid', vid, 365 * 24 * 3600);
    } else {
      setCookie('sttt_vid', vid, 365 * 24 * 3600);
    }
    return vid;
  } catch {
    return 'anonymous';
  }
}

function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return 'server';
  try {
    let sid = getCookie('sttt_sid') || sessionStorage.getItem(SID_STORAGE_KEY);
    if (!sid) {
      sid = `s_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      sessionStorage.setItem(SID_STORAGE_KEY, sid);
      setCookie('sttt_sid', sid, 12 * 3600);
    }
    return sid;
  } catch {
    return 'session';
  }
}

function checkAndMarkReturning(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const visited = localStorage.getItem(VISITED_BEFORE_KEY);
    if (visited) {
      return true;
    }
    localStorage.setItem(VISITED_BEFORE_KEY, '1');
    return false;
  } catch {
    return false;
  }
}

export function sendAnalyticsEvent(
  type: EventType,
  target: string,
  category: string,
  metadata?: Record<string, unknown>
): void {
  if (typeof window === 'undefined') return;
  if (isDoNotTrack()) return; // Respect user's Do Not Track preference

  try {
    const isReturning = checkAndMarkReturning();
    const isHeadless = !!(typeof navigator !== 'undefined' && (navigator as { webdriver?: boolean }).webdriver);
    const clientLang = typeof navigator !== 'undefined' ? navigator.language : 'en';

    const payload = {
      visitorId: getOrCreateVisitorId(),
      sessionId: getOrCreateSessionId(),
      type,
      target,
      category,
      metadata: {
        ...metadata,
        webdriver: isHeadless,
      },
      isReturning,
      language: clientLang,
      path: window.location.pathname || '/',
      referrer: document.referrer || undefined,
    };

    const url = '/api/analytics/track';
    const body = JSON.stringify(payload);

    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      navigator.sendBeacon(url, blob);
    } else {
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // Fail silently so gameplay is NEVER impacted
  }
}

export const analytics = {
  pageview: (path: string = '/') => {
    sendAnalyticsEvent('pageview', 'pageview', 'navigation', { path });
  },

  gameStart: (mode: string, difficulty?: string, roomId?: string) => {
    sendAnalyticsEvent('game', 'game_start', 'gameplay', {
      mode,
      difficulty: mode === 'ai' ? (difficulty || 'qnet') : undefined,
      roomId,
    });
  },

  gameEnd: (result: 'win' | 'loss' | 'draw', mode: string, movesCount?: number, durationMs?: number) => {
    sendAnalyticsEvent('game', `game_${result}`, 'gameplay', {
      result,
      mode,
      movesCount,
      durationMs,
    });
  },

  dailyPlayed: (won: boolean, movesCount: number, challengeNum?: number) => {
    sendAnalyticsEvent('game', 'daily_challenge_played', 'daily', {
      won,
      movesCount,
      challengeNum,
    });
  },

  roomCreated: (roomId: string) => {
    sendAnalyticsEvent('feature', 'room_created', 'online', { roomId });
  },

  roomLinkShared: (action: 'copy' | 'share', roomId?: string) => {
    sendAnalyticsEvent('click', `room_link_${action}`, 'growth', { action, roomId });
  },

  buttonClick: (buttonName: string, metadata?: Record<string, unknown>) => {
    sendAnalyticsEvent('click', buttonName, 'button', metadata);
  },

  languageToggle: (lang: 'ru' | 'en') => {
    sendAnalyticsEvent('click', 'language_toggle', 'settings', { to: lang });
  },

  themeToggle: (theme: 'light' | 'dark') => {
    sendAnalyticsEvent('click', 'theme_toggle', 'settings', { to: theme });
  },

  outboundClick: (url: string) => {
    sendAnalyticsEvent('click', 'outbound_link', 'navigation', { destination: url });
  },

  gameMode: (mode: string) => {
    sendAnalyticsEvent('feature', `mode_${mode}`, 'game_mode', { mode });
  },

  difficulty: (difficulty: string) => {
    sendAnalyticsEvent('feature', `diff_${difficulty}`, 'difficulty', { difficulty });
  },

  modifier: (modifier: string, enabled: boolean) => {
    sendAnalyticsEvent('feature', `mod_${modifier}`, 'modifier', { modifier, enabled });
  },

  timeControl: (timeControl: string | number) => {
    sendAnalyticsEvent('feature', `clock_${timeControl}`, 'time_control', { timeControl });
  },

  cellClick: (sector: number, cell: number) => {
    sendAnalyticsEvent('game', 'board_cell_click', 'cell_click', { sector, cell });
  },

  click: (target: string, category: string = 'ui', metadata?: Record<string, unknown>) => {
    sendAnalyticsEvent('click', target, category, metadata);
  },
};
