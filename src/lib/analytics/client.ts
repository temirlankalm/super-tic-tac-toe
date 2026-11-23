'use client';

import { EventType } from './types';

const VID_STORAGE_KEY = 'sttt_analytics_vid';
const SID_STORAGE_KEY = 'sttt_analytics_sid';

function getOrCreateVisitorId(): string {
  if (typeof window === 'undefined') return 'server';
  try {
    let vid = localStorage.getItem(VID_STORAGE_KEY);
    if (!vid) {
      vid = `v_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem(VID_STORAGE_KEY, vid);
    }
    return vid;
  } catch {
    return 'anonymous';
  }
}

function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return 'server';
  try {
    let sid = sessionStorage.getItem(SID_STORAGE_KEY);
    if (!sid) {
      sid = `s_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      sessionStorage.setItem(SID_STORAGE_KEY, sid);
    }
    return sid;
  } catch {
    return 'session';
  }
}

export function sendAnalyticsEvent(
  type: EventType,
  target: string,
  category: string,
  metadata?: Record<string, unknown>
): void {
  if (typeof window === 'undefined') return;

  try {
    const payload = {
      visitorId: getOrCreateVisitorId(),
      sessionId: getOrCreateSessionId(),
      type,
      target,
      category,
      metadata,
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
    // Fail silently so gameplay is never impacted
  }
}

export const analytics = {
  pageview: (path: string = '/') => {
    sendAnalyticsEvent('pageview', 'pageview', 'navigation', { path });
  },

  click: (target: string, category: string = 'ui', metadata?: Record<string, unknown>) => {
    sendAnalyticsEvent('click', target, category, metadata);
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

  gameFinished: (winner: string, reason?: string, movesCount?: number) => {
    sendAnalyticsEvent('game', 'game_finish', 'game_result', { winner, reason, movesCount });
  },
};
