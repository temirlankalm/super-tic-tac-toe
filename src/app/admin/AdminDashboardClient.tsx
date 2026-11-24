'use client';

import React, { useState, useEffect, useCallback, useTransition, useMemo } from 'react';
import {
  Users,
  Bot,
  Globe,
  Clock,
  ArrowLeft,
  RefreshCw,
  Lock,
  Download,
  LogOut,
  Sun,
  Moon,
  TrendingUp,
  Gamepad2,
  Activity,
  MousePointerClick,
  Compass,
  Laptop,
  Smartphone,
  Tablet,
  Grid3X3,
  Sliders,
  Trash2,
  Check,
  X,
  Repeat,
  Radio,
} from 'lucide-react';
import { AnalyticsSummary, TimePoint, HourlyArrivalStat } from '@/lib/analytics/types';
import { countryCodeToFlag } from '@/lib/analytics/botDetector';
import { ADMIN_STRINGS, AdminLang } from './adminTranslations';

interface AdminDashboardClientProps {
  initialAuthenticated?: boolean;
}

type DashboardTab = 'all' | 'traffic' | 'gameplay' | 'events';
type EventFilter = 'all' | 'humans' | 'pageviews' | 'games' | 'bots';

function formatDuration(seconds: number, lang: AdminLang): string {
  if (!seconds || seconds <= 0) return lang === 'ru' ? '0с' : '0s';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return lang === 'ru' ? `${s}с` : `${s}s`;
  return lang === 'ru' ? `${m}м ${s}с` : `${m}m ${s}s`;
}

export function AdminDashboardClient({
  initialAuthenticated = false,
}: AdminDashboardClientProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(initialAuthenticated);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [range, setRange] = useState<'24h' | '7d' | '30d' | 'all'>('7d');
  const [activeTab, setActiveTab] = useState<DashboardTab>('all');
  const [eventFilter, setEventFilter] = useState<EventFilter>('all');
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const [clearFeedback, setClearFeedback] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>('');
  const [hoveredTimeIdx, setHoveredTimeIdx] = useState<number | null>(null);
  const [hoveredHourIdx, setHoveredHourIdx] = useState<number | null>(null);
  const [, startTransition] = useTransition();

  const [gameUrl, setGameUrl] = useState('https://ttt.temr.dev');
  const [isDark, setIsDark] = useState(false);
  const [adminLang, setAdminLang] = useState<AdminLang>('ru');

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
    if (
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname === 'admin.localhost')
    ) {
      setGameUrl(
        window.location.hostname === 'admin.localhost'
          ? `http://localhost:${window.location.port || '3000'}`
          : '/'
      );
    }
    try {
      const stored =
        localStorage.getItem('ttt_lang') ||
        (navigator.language?.startsWith('ru') ? 'ru' : 'en');
      if (stored === 'en' || stored === 'ru') {
        setAdminLang(stored);
      }
    } catch {}
  }, []);

  const str = ADMIN_STRINGS[adminLang];

  const toggleAdminLang = () => {
    const next: AdminLang = adminLang === 'ru' ? 'en' : 'ru';
    setAdminLang(next);
    try {
      localStorage.setItem('ttt_lang', next);
    } catch {}
  };

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem('ttt_theme', next ? 'dark' : 'light');
    } catch {}
  };

  const fetchStats = useCallback(async (activeRange: string) => {
    setIsLoadingStats(true);
    try {
      const res = await fetch(`/api/admin/stats?range=${activeRange}`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const data: AnalyticsSummary = await res.json();
        setSummary(data);
        setIsAuthenticated(true);
        setAuthError(null);
        setLastRefreshedAt(
          new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })
        );
      } else {
        setIsAuthenticated(false);
      }
    } catch {
      setIsAuthenticated(false);
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchStats(range);
    }
  }, [fetchStats, range, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !autoRefresh) return;
    const interval = setInterval(() => {
      fetchStats(range);
    }, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, autoRefresh, range, fetchStats]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setAuthError(str.login.errorRequired);
      return;
    }

    setIsSubmitting(true);
    setAuthError(null);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim() || undefined,
          password: password.trim(),
        }),
      });

      if (res.ok) {
        setPassword('');
        await fetchStats(range);
      } else {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setAuthError(data.error || str.login.errorInvalid);
      }
    } catch {
      setAuthError(str.login.errorNetwork);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } catch {}
    setIsAuthenticated(false);
    setSummary(null);
  };

  const handleExportCsv = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const res = await fetch(`/api/admin/export?range=${range}`);
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tic3-analytics-${range}-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {} finally {
      setIsExporting(false);
    }
  };

  const handleConfirmClearData = async () => {
    try {
      const res = await fetch('/api/admin/stats', { method: 'DELETE' });
      if (res.ok) {
        setIsConfirmingClear(false);
        setClearFeedback(str.header.resetDone);
        setTimeout(() => setClearFeedback(null), 3000);
        await fetchStats(range);
      }
    } catch {}
  };

  const filteredEvents = useMemo(() => {
    if (!summary) return [];
    const list = summary.recentEvents || [];
    switch (eventFilter) {
      case 'humans':
        return list.filter((e) => !e.isBot);
      case 'pageviews':
        return list.filter((e) => !e.isBot && e.type === 'pageview');
      case 'games':
        return list.filter((e) => !e.isBot && e.type === 'game');
      case 'bots':
        return list.filter((e) => e.isBot);
      default:
        return list;
    }
  }, [summary, eventFilter]);

  // 1. Unauthenticated Login Gate
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-[var(--bg)] text-[var(--ink)] font-sans antialiased">
        <div className="w-full max-w-sm rounded-2xl p-7 border border-[var(--line)] bg-[var(--surface)] shadow-xl backdrop-blur-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-[var(--highlight-ink)]">
              <Lock size={15} />
              <h1 className="font-serif text-xl font-medium tracking-tight lowercase">
                {str.login.title}
              </h1>
            </div>
            <button
              type="button"
              onClick={toggleAdminLang}
              className="min-h-[32px] px-2 text-[11px] font-mono uppercase tracking-wider text-[var(--ink-soft)] hover:text-[var(--highlight-ink)] border border-[var(--line)] rounded-md transition-colors cursor-pointer"
            >
              {adminLang === 'ru' ? 'EN' : 'RU'}
            </button>
          </div>

          <p className="text-xs text-[var(--ink-soft)] mb-6 lowercase leading-relaxed">
            {str.login.subtitle}
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="admin-email"
                className="block text-[11px] text-[var(--ink-soft)] uppercase tracking-wider mb-1.5"
              >
                {str.login.emailLabel}
              </label>
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={str.login.emailPlaceholder}
                className="w-full min-h-[40px] px-3 py-2 text-xs rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[var(--highlight-ink)] focus:outline-none focus:border-[var(--highlight-ink)] transition-colors"
                autoComplete="email"
              />
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="block text-[11px] text-[var(--ink-soft)] uppercase tracking-wider mb-1.5"
              >
                {str.login.passwordLabel}
              </label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setAuthError(null);
                }}
                placeholder={str.login.passwordPlaceholder}
                className="w-full min-h-[40px] px-3 py-2 text-xs rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[var(--highlight-ink)] focus:outline-none focus:border-[var(--highlight-ink)] transition-colors"
                autoFocus
                autoComplete="current-password"
              />
            </div>

            {authError && (
              <p
                role="alert"
                className="text-[11px] text-rose-600 dark:text-rose-400 font-medium lowercase px-2.5 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20"
              >
                {authError}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full min-h-[42px] py-2.5 px-3 rounded-lg bg-[var(--highlight-ink)] text-[var(--bg)] text-xs font-medium lowercase hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? str.login.submitting : str.login.submit}
            </button>

            <div className="pt-2 flex items-center justify-between text-xs text-[var(--ink-mute)]">
              <a
                href={gameUrl}
                className="hover:text-[var(--highlight-ink)] hairline-link transition-colors flex items-center gap-1"
              >
                <ArrowLeft size={12} />
                <span>{str.login.returnToGame}</span>
              </a>
              <button
                type="button"
                onClick={toggleTheme}
                className="hover:text-[var(--highlight-ink)] hairline-link flex items-center gap-1 cursor-pointer"
              >
                {isDark ? <Sun size={12} /> : <Moon size={12} />}
                <span>{isDark ? str.login.lightTheme : str.login.darkTheme}</span>
              </button>
            </div>
          </form>
        </div>
      </main>
    );
  }

  // 2. Authenticated Dashboard View
  const s = summary;
  const showTraffic = activeTab === 'all' || activeTab === 'traffic';
  const showGameplay = activeTab === 'all' || activeTab === 'gameplay';
  const showEvents = activeTab === 'all' || activeTab === 'events';

  return (
    <div className="min-h-screen w-full min-w-0 bg-[var(--bg)] text-[var(--ink)] font-sans antialiased px-3.5 py-5 sm:px-6 md:px-8 max-w-6xl mx-auto overflow-x-hidden selection:bg-[var(--selection-bg)]">
      {/* Top Header Bar */}
      <header className="pb-4 border-b border-[var(--line)] mb-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <a
                href={gameUrl}
                className="min-h-[36px] px-2.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--ink)] hover:text-[var(--highlight-ink)] text-xs lowercase inline-flex items-center gap-1.5 transition-colors"
                title={str.header.returnToGame}
              >
                <ArrowLeft size={13} />
                <span>{str.header.returnToGame}</span>
              </a>
              <h1 className="font-serif text-xl sm:text-2xl font-medium tracking-tight text-[var(--highlight-ink)] lowercase">
                {str.header.title}
              </h1>
              {s && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium tabular-nums bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {s.visitorsNow} {str.header.onlineNow}
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--ink-soft)] mt-1.5 lowercase">
              {str.header.subtitle}
            </p>
          </div>

          {/* Primary Action & Range Controls */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {/* Time range selector */}
            <div
              role="group"
              aria-label="time range"
              className="inline-flex items-center rounded-lg border border-[var(--line)] bg-[var(--surface)] p-0.5 text-xs lowercase"
            >
              {(['24h', '7d', '30d', 'all'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setRange(r);
                    setHoveredTimeIdx(null);
                    startTransition(() => {
                      fetchStats(r);
                    });
                  }}
                  className={`min-h-[32px] px-2.5 py-1 rounded-md transition-colors cursor-pointer text-xs tabular-nums ${
                    range === r
                      ? 'bg-[var(--highlight-ink)] text-[var(--bg)] font-medium shadow-xs'
                      : 'text-[var(--ink-soft)] hover:text-[var(--highlight-ink)]'
                  }`}
                >
                  {str.header.ranges[r]}
                </button>
              ))}
            </div>

            {/* Auto-refresh pill */}
            <button
              type="button"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`min-h-[34px] px-2.5 rounded-lg border text-[11px] font-medium lowercase inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                autoRefresh
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                  : 'border-[var(--line)] bg-[var(--surface)] text-[var(--ink-soft)]'
              }`}
              title={lastRefreshedAt ? `${str.header.updatedAt} ${lastRefreshedAt}` : undefined}
            >
              <Radio size={12} className={autoRefresh ? 'animate-pulse' : 'opacity-50'} />
              <span>{autoRefresh ? str.header.autoRefreshOn : str.header.autoRefreshOff}</span>
            </button>

            {/* Manual refresh */}
            <button
              type="button"
              onClick={() => fetchStats(range)}
              disabled={isLoadingStats}
              className="min-h-[34px] min-w-[34px] inline-flex items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--ink-soft)] hover:text-[var(--highlight-ink)] transition-colors cursor-pointer"
              title={str.header.refresh}
              aria-label={str.header.refresh}
            >
              <RefreshCw size={13} className={isLoadingStats ? 'animate-spin' : ''} />
            </button>

            {/* Export CSV */}
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={isExporting}
              className="min-h-[34px] inline-flex items-center gap-1.5 px-2.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--ink)] hover:text-[var(--highlight-ink)] text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
              title={str.header.exportCsv}
            >
              <Download size={12} />
              <span>{isExporting ? str.header.exportingCsv : str.header.exportCsv}</span>
            </button>

            {/* Reset Data (inline 2-step confirmation) */}
            {!isConfirmingClear ? (
              <button
                type="button"
                onClick={() => setIsConfirmingClear(true)}
                className="min-h-[34px] min-w-[34px] inline-flex items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--surface)] hover:border-rose-400 hover:text-rose-600 text-[var(--ink-soft)] transition-colors cursor-pointer"
                title={str.header.resetData}
                aria-label={str.header.resetData}
              >
                <Trash2 size={13} />
              </button>
            ) : (
              <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-rose-500/40 bg-rose-500/10 text-xs">
                <span className="text-[11px] text-rose-700 dark:text-rose-300 lowercase mr-1">
                  {str.header.resetConfirmPrompt}
                </span>
                <button
                  type="button"
                  onClick={handleConfirmClearData}
                  className="px-2 py-0.5 rounded bg-rose-600 text-white text-[11px] font-medium lowercase hover:opacity-90 cursor-pointer inline-flex items-center gap-0.5"
                >
                  <Check size={11} />
                  <span>{str.header.resetConfirmYes}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfirmingClear(false)}
                  className="px-1.5 py-0.5 rounded text-[11px] text-[var(--ink-soft)] hover:text-[var(--highlight-ink)] lowercase cursor-pointer inline-flex items-center"
                >
                  <X size={12} />
                </button>
              </div>
            )}

            {/* Lang toggle */}
            <button
              type="button"
              onClick={toggleAdminLang}
              className="min-h-[34px] px-2 rounded-lg border border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[11px] font-mono uppercase text-[var(--ink-soft)] hover:text-[var(--highlight-ink)] transition-colors cursor-pointer"
            >
              {adminLang === 'ru' ? 'EN' : 'RU'}
            </button>

            {/* Theme toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="min-h-[34px] min-w-[34px] inline-flex items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--ink-soft)] hover:text-[var(--highlight-ink)] transition-colors cursor-pointer"
              aria-label="toggle theme"
            >
              {isDark ? <Sun size={14} /> : <Moon size={14} />}
            </button>

            {/* Logout */}
            <button
              type="button"
              onClick={handleLogout}
              className="min-h-[34px] inline-flex items-center gap-1 px-2.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] hover:border-rose-400 hover:text-rose-600 text-[var(--ink-soft)] text-xs font-medium lowercase transition-colors cursor-pointer"
              title={str.header.logout}
            >
              <LogOut size={13} />
              <span className="hidden sm:inline">{str.header.logout}</span>
            </button>
          </div>
        </div>

        {/* View Tabs + Updated Stamp */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
          <nav
            aria-label="dashboard sections"
            className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0"
          >
            {(['all', 'traffic', 'gameplay', 'events'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs lowercase whitespace-nowrap transition-colors cursor-pointer ${
                  activeTab === tab
                    ? 'bg-[var(--highlight-ink)] text-[var(--bg)] font-medium'
                    : 'text-[var(--ink-soft)] hover:text-[var(--highlight-ink)] hover:bg-[var(--surface)]'
                }`}
              >
                {str.header.tabs[tab]}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3 text-[11px] text-[var(--ink-mute)] tabular-nums">
            {clearFeedback && (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium lowercase">
                {clearFeedback}
              </span>
            )}
            {lastRefreshedAt && (
              <span className="lowercase">
                {str.header.updatedAt}: {lastRefreshedAt}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Loading skeleton when authenticated and waiting for initial payload */}
      {!s && isLoadingStats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6 animate-pulse">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-28 rounded-2xl border border-[var(--line)] bg-[var(--surface)]"
            />
          ))}
        </div>
      )}

      {s && (
        <div className="space-y-6">
          {/* ===================================================================== */}
          {/* BAND 1: PRIMARY KPI CARDS + TRAFFIC BALANCE STRIP */}
          {/* ===================================================================== */}
          <section aria-label="key metrics">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {/* 1. Online Now */}
              <div className="p-4 sm:p-5 rounded-2xl border border-[var(--line)] bg-[var(--surface)] flex flex-col justify-between">
                <div className="flex items-center justify-between text-[var(--ink-soft)] text-xs lowercase mb-2">
                  <span>{str.kpi.onlineTitle}</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <div className="text-3xl font-serif font-medium text-[var(--highlight-ink)] tabular-nums">
                  {s.visitorsNow}
                </div>
                <div className="text-[11px] text-[var(--ink-soft)] lowercase mt-1.5 leading-snug">
                  {str.kpi.onlineDesc}
                </div>
              </div>

              {/* 2. Unique Players & Visits */}
              <div className="p-4 sm:p-5 rounded-2xl border border-[var(--line)] bg-[var(--surface)] flex flex-col justify-between">
                <div className="flex items-center justify-between text-[var(--ink-soft)] text-xs lowercase mb-2">
                  <span>{str.kpi.uniquesTitle}</span>
                  <Users size={14} />
                </div>
                <div className="text-3xl font-serif font-medium text-[var(--highlight-ink)] tabular-nums">
                  {s.uniqueVisitors}
                </div>
                <div className="text-[11px] text-[var(--ink-soft)] lowercase mt-1.5 leading-snug tabular-nums">
                  {str.kpi.uniquesDesc(s.totalVisits, s.today.uniques)}
                </div>
              </div>

              {/* 3. Returning Rate */}
              <div className="p-4 sm:p-5 rounded-2xl border border-[var(--line)] bg-[var(--surface)] flex flex-col justify-between">
                <div className="flex items-center justify-between text-[var(--ink-soft)] text-xs lowercase mb-2">
                  <span>{str.kpi.retentionTitle}</span>
                  <Repeat size={14} />
                </div>
                <div className="text-3xl font-serif font-medium text-[var(--highlight-ink)] tabular-nums">
                  {s.returningVsNew.returningPercentage}%
                </div>
                <div className="text-[11px] text-[var(--ink-soft)] lowercase mt-1.5 leading-snug tabular-nums">
                  {str.kpi.retentionDesc(
                    s.returningVsNew.returning,
                    s.returningVsNew.newVisitors
                  )}
                </div>
              </div>

              {/* 4. Matches & Engagement */}
              <div className="p-4 sm:p-5 rounded-2xl border border-[var(--line)] bg-[var(--surface)] flex flex-col justify-between">
                <div className="flex items-center justify-between text-[var(--ink-soft)] text-xs lowercase mb-2">
                  <span>{str.kpi.matchesTitle}</span>
                  <Gamepad2 size={14} />
                </div>
                <div className="text-3xl font-serif font-medium text-[var(--highlight-ink)] tabular-nums">
                  {s.gameBehavior.totalStarts}
                </div>
                <div className="text-[11px] text-[var(--ink-soft)] lowercase mt-1.5 leading-snug tabular-nums">
                  {str.kpi.matchesDesc(
                    s.gameBehavior.completionRate,
                    formatDuration(s.gameBehavior.averageSessionSeconds, adminLang)
                  )}
                </div>
              </div>
            </div>

            {/* Slim Humans vs Bots Split Bar */}
            <div className="mt-3 px-4 py-2.5 rounded-xl border border-[var(--line)] bg-[var(--surface)] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex flex-wrap items-center gap-3 tabular-nums lowercase">
                <span className="text-[var(--ink-soft)] font-medium">
                  {str.kpi.trafficBalance}:
                </span>
                <span className="inline-flex items-center gap-1.5 text-[var(--highlight-ink)]">
                  <span className="w-2 h-2 rounded-xs bg-[var(--highlight-ink)]" />
                  {str.kpi.humansLabel}: <strong>{s.humansVsBots.humanVisits}</strong>
                </span>
                <span className="inline-flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                  <span className="w-2 h-2 rounded-xs bg-rose-500/80" />
                  {str.kpi.botsLabel}: <strong>{s.humansVsBots.botVisits}</strong> (
                  {s.humansVsBots.botPercentage}%)
                </span>
              </div>
              <span className="text-[11px] text-[var(--ink-mute)] lowercase">
                {str.kpi.botsExcluded}
              </span>
            </div>
          </section>

          {/* ===================================================================== */}
          {/* BAND 2: VISITS TIMELINE */}
          {/* ===================================================================== */}
          {showTraffic && (
            <section className="p-4 sm:p-5 rounded-2xl border border-[var(--line)] bg-[var(--surface)] min-w-0 overflow-hidden">
              {(() => {
                const points: TimePoint[] = range === '24h' ? s.timeline : s.dailyTimeline;
                const maxVal = Math.max(
                  ...points.map((p) => Math.max(p.count, p.bots)),
                  1
                );
                const hasAnyData = points.some((p) => p.count > 0 || p.bots > 0);
                const activePoint =
                  hoveredTimeIdx !== null ? points[hoveredTimeIdx] : null;
                const tickStep = Math.max(1, Math.ceil(points.length / 8));

                return (
                  <>
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-3">
                      <div>
                        <h2 className="font-serif text-lg font-medium text-[var(--highlight-ink)] lowercase">
                          {str.timeline.title}
                        </h2>
                        <p className="text-xs text-[var(--ink-soft)] lowercase">
                          {range === '24h'
                            ? str.timeline.subtitle24h
                            : str.timeline.subtitleDays(str.header.ranges[range])}
                        </p>
                      </div>

                      {/* Live Readout + Legend */}
                      <div className="flex flex-wrap items-center justify-between md:justify-end gap-2 sm:gap-3 min-w-0">
                        <div className="px-2.5 py-1 rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[11px] font-mono tabular-nums text-[var(--ink)] max-w-full break-words">
                          {activePoint ? (
                            <span>
                              <strong className="text-[var(--highlight-ink)]">
                                {activePoint.label}
                              </strong>{' '}
                              · {str.timeline.visits}: {activePoint.count} ·{' '}
                              {str.timeline.uniques}: {activePoint.uniques} ·{' '}
                              {str.timeline.bots}: {activePoint.bots}
                            </span>
                          ) : (
                            <span className="text-[var(--ink-mute)] font-sans lowercase">
                              {str.timeline.hoverHint}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-[var(--ink-soft)] lowercase">
                          <span className="inline-flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-xs bg-[var(--highlight-ink)]" />
                            {str.timeline.legendVisits}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-xs bg-rose-500/75" />
                            {str.timeline.legendBots}
                          </span>
                        </div>
                      </div>
                    </div>

                    {!hasAnyData ? (
                      <div className="h-36 flex items-center justify-center border border-dashed border-[var(--line)] rounded-xl text-xs text-[var(--ink-mute)] lowercase">
                        {str.timeline.noData}
                      </div>
                    ) : (
                      <div
                        className="h-44 w-full flex items-end gap-1 sm:gap-1.5 pt-2 px-1 border-b border-[var(--line)] pb-1.5 overflow-x-auto"
                        onMouseLeave={() => setHoveredTimeIdx(null)}
                      >
                        {points.map((p, idx) => {
                          const humanH =
                            p.count > 0
                              ? Math.max(Math.round((p.count / maxVal) * 100), 6)
                              : 0;
                          const botH =
                            p.bots > 0
                              ? Math.max(Math.round((p.bots / maxVal) * 100), 6)
                              : 0;
                          const isSelected = hoveredTimeIdx === idx;

                          return (
                            <button
                              key={idx}
                              type="button"
                              onMouseEnter={() => setHoveredTimeIdx(idx)}
                              onFocus={() => setHoveredTimeIdx(idx)}
                              onClick={() =>
                                setHoveredTimeIdx(isSelected ? null : idx)
                              }
                              aria-label={`${p.label}: ${p.count} ${str.timeline.visits}, ${p.bots} ${str.timeline.bots}`}
                              className={`flex-1 min-w-[24px] sm:min-w-[16px] flex flex-col items-center justify-end h-full rounded-t-md transition-colors cursor-pointer px-0.5 ${
                                isSelected ? 'bg-[var(--line)]/30' : 'hover:bg-[var(--line)]/15'
                              }`}
                            >
                              <div className="w-full flex items-end justify-center gap-0.5 h-full">
                                {p.count > 0 ? (
                                  <div
                                    style={{ height: `${humanH}%` }}
                                    className="w-full max-w-[12px] bg-[var(--highlight-ink)] rounded-t-xs transition-all duration-200"
                                  />
                                ) : (
                                  <div className="w-full max-w-[10px] h-[2px] bg-[var(--line)] rounded-full" />
                                )}
                                {p.bots > 0 && (
                                  <div
                                    style={{ height: `${botH}%` }}
                                    className="w-full max-w-[6px] bg-rose-500/75 rounded-t-xs transition-all duration-200"
                                  />
                                )}
                              </div>

                              <span className="text-[9px] text-[var(--ink-mute)] mt-1.5 tracking-tight tabular-nums whitespace-nowrap text-center h-3">
                                {idx % tickStep === 0 || idx === points.length - 1
                                  ? p.label
                                  : ''}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </>
                );
              })()}
            </section>
          )}

          {/* ===================================================================== */}
          {/* BAND 3: AUDIENCE, DEVICES & GEOGRAPHY */}
          {/* ===================================================================== */}
          {showTraffic && (
            <section className="space-y-4">
              <h2 className="text-[11px] uppercase tracking-[0.14em] text-[var(--ink-soft)] font-medium">
                {str.sections.trafficGeoHeading}
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* 3.1 Countries & Cities */}
                <div className="p-5 rounded-2xl border border-[var(--line)] bg-[var(--surface)] flex flex-col justify-between min-w-0">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-serif text-base font-medium text-[var(--highlight-ink)] lowercase flex items-center gap-1.5">
                        <Globe size={15} />
                        <span>{str.countries.title}</span>
                      </h3>
                      <span className="text-xs text-[var(--ink-soft)] font-mono tabular-nums">
                        {str.countries.countLabel(s.countries.length)}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--ink-soft)] lowercase mb-4">
                      {str.countries.subtitle}
                    </p>

                    <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                      {s.countries.length === 0 ? (
                        <p className="text-xs text-[var(--ink-mute)] lowercase py-6 text-center border border-dashed border-[var(--line)] rounded-xl">
                          {str.countries.empty}
                        </p>
                      ) : (
                        s.countries.slice(0, 10).map((c) => (
                          <div key={c.code} className="text-xs">
                            <div className="flex items-center justify-between mb-1 gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-base shrink-0">{c.flag}</span>
                                <span className="text-[var(--highlight-ink)] font-medium lowercase truncate">
                                  {c.name}
                                </span>
                                {c.cities.length > 0 && (
                                  <span className="text-[10px] text-[var(--ink-mute)] truncate hidden sm:inline">
                                    ({c.cities.map((ci) => ci.city).join(', ')})
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 font-mono text-[11px] tabular-nums shrink-0">
                                <span className="text-[var(--highlight-ink)]">
                                  {c.count} {str.countries.visitsShort}
                                </span>
                                <span className="text-[var(--ink-mute)]">
                                  ({c.uniques} {str.countries.uniquesShort})
                                </span>
                                <span className="text-[var(--ink-soft)] w-8 text-right">
                                  {c.percentage}%
                                </span>
                              </div>
                            </div>
                            <div className="h-1.5 w-full bg-[var(--line)] rounded-full overflow-hidden">
                              <div
                                style={{ width: `${Math.min(Math.max(c.percentage, 2), 100)}%` }}
                                className="h-full bg-[var(--highlight-ink)] rounded-full"
                              />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* 3.2 Devices, Browsers & OS */}
                <div className="p-5 rounded-2xl border border-[var(--line)] bg-[var(--surface)] flex flex-col justify-between min-w-0">
                  <div>
                    <h3 className="font-serif text-base font-medium text-[var(--highlight-ink)] lowercase flex items-center gap-1.5 mb-1">
                      <Laptop size={15} />
                      <span>{str.devices.title}</span>
                    </h3>
                    <p className="text-xs text-[var(--ink-soft)] lowercase mb-4">
                      {str.devices.subtitle}
                    </p>

                    {s.devices.every((d) => d.count === 0) ? (
                      <p className="text-xs text-[var(--ink-mute)] lowercase py-6 text-center border border-dashed border-[var(--line)] rounded-xl">
                        {str.devices.empty}
                      </p>
                    ) : (
                      <div className="space-y-4">
                        <div className="space-y-2.5">
                          {s.devices.map((d) => {
                            const Icon =
                              d.device === 'mobile'
                                ? Smartphone
                                : d.device === 'tablet'
                                ? Tablet
                                : Laptop;
                            const label =
                              d.device === 'mobile'
                                ? str.devices.mobile
                                : d.device === 'tablet'
                                ? str.devices.tablet
                                : str.devices.desktop;

                            return (
                              <div key={d.device} className="text-xs">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="inline-flex items-center gap-1.5 text-[var(--highlight-ink)] lowercase">
                                    <Icon size={13} className="text-[var(--ink-soft)]" />
                                    {label}
                                  </span>
                                  <span className="font-mono text-[11px] tabular-nums text-[var(--ink-soft)]">
                                    {d.count} ({d.percentage}%)
                                  </span>
                                </div>
                                <div className="h-1.5 w-full bg-[var(--line)] rounded-full overflow-hidden">
                                  <div
                                    style={{ width: `${d.count > 0 ? Math.max(d.percentage, 3) : 0}%` }}
                                    className="h-full bg-[var(--highlight-ink)] rounded-full"
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Browsers & OS Badges */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-[var(--line)]">
                          <div>
                            <span className="text-[10px] uppercase tracking-wider text-[var(--ink-soft)] block mb-1.5">
                              {str.devices.browsersTitle}
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {(s.browsers || []).map((b) => (
                                <span
                                  key={b.name}
                                  className="px-2 py-0.5 rounded-md border border-[var(--line)] bg-[var(--bg)] text-[11px] font-mono tabular-nums text-[var(--highlight-ink)]"
                                >
                                  {b.name} <span className="text-[var(--ink-soft)]">{b.percentage}%</span>
                                </span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase tracking-wider text-[var(--ink-soft)] block mb-1.5">
                              {str.devices.osTitle}
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {(s.osBreakdown || []).map((o) => (
                                <span
                                  key={o.name}
                                  className="px-2 py-0.5 rounded-md border border-[var(--line)] bg-[var(--bg)] text-[11px] font-mono tabular-nums text-[var(--highlight-ink)]"
                                >
                                  {o.name} <span className="text-[var(--ink-soft)]">{o.percentage}%</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3.3 24-Hour Arrival Rhythm */}
                <div className="p-5 rounded-2xl border border-[var(--line)] bg-[var(--surface)] flex flex-col justify-between min-w-0">
                  {(() => {
                    const arrivals: HourlyArrivalStat[] = s.hourlyArrivals || [];
                    const hasAnyArrivals = arrivals.some((a) => a.count > 0);
                    const maxH = Math.max(...arrivals.map((a) => a.count), 1);
                    let peakHour = 0;
                    arrivals.forEach((a) => {
                      if (a.count > (arrivals[peakHour]?.count || 0)) peakHour = a.hour;
                    });
                    const activeHour =
                      hoveredHourIdx !== null ? arrivals[hoveredHourIdx] : null;

                    return (
                      <div>
                        <div className="flex items-center justify-between mb-1 gap-2">
                          <h3 className="font-serif text-base font-medium text-[var(--highlight-ink)] lowercase flex items-center gap-1.5">
                            <Clock size={15} />
                            <span>{str.arrivals.title}</span>
                          </h3>
                          <span className="text-[11px] text-[var(--ink-soft)] font-mono">
                            {activeHour
                              ? `${activeHour.label} · ${activeHour.count} (${activeHour.percentage}%)`
                              : str.arrivals.hoursBadge}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--ink-soft)] lowercase mb-4">
                          {str.arrivals.subtitle}
                        </p>

                        {!hasAnyArrivals ? (
                          <div className="h-32 flex items-center justify-center border border-dashed border-[var(--line)] rounded-xl text-xs text-[var(--ink-mute)] lowercase">
                            {str.arrivals.empty}
                          </div>
                        ) : (
                          <>
                            <div
                              className="h-32 w-full flex items-end gap-0.5 sm:gap-1 pt-2 border-b border-[var(--line)] pb-1.5"
                              onMouseLeave={() => setHoveredHourIdx(null)}
                            >
                              {arrivals.map((a) => {
                                const hPct =
                                  a.count > 0
                                    ? Math.max(Math.round((a.count / maxH) * 100), 6)
                                    : 0;
                                const isPeak = a.hour === peakHour && a.count > 0;
                                const isSelected = hoveredHourIdx === a.hour;

                                return (
                                  <button
                                    key={a.hour}
                                    type="button"
                                    onMouseEnter={() => setHoveredHourIdx(a.hour)}
                                    onFocus={() => setHoveredHourIdx(a.hour)}
                                    onClick={() =>
                                      setHoveredHourIdx(isSelected ? null : a.hour)
                                    }
                                    aria-label={`${a.label}: ${a.count}`}
                                    className="flex-1 flex flex-col items-center justify-end h-full cursor-pointer"
                                  >
                                    {a.count > 0 ? (
                                      <div
                                        style={{ height: `${hPct}%` }}
                                        className={`w-full max-w-[9px] rounded-t-xs transition-all ${
                                          isSelected || isPeak
                                            ? 'bg-[var(--highlight-ink)]'
                                            : 'bg-[var(--ink-soft)]/50 hover:bg-[var(--highlight-ink)]'
                                        }`}
                                      />
                                    ) : (
                                      <div className="w-full max-w-[7px] h-[2px] bg-[var(--line)] rounded-full" />
                                    )}
                                    <span className="text-[8px] text-[var(--ink-mute)] mt-1 tabular-nums h-3">
                                      {a.hour % 4 === 0
                                        ? String(a.hour).padStart(2, '0')
                                        : ''}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>

                            <div className="pt-3 mt-2 text-xs text-[var(--ink-soft)] lowercase flex items-center justify-between gap-2">
                              <span>
                                {str.arrivals.peakLabel}:{' '}
                                <strong className="text-[var(--highlight-ink)] font-mono tabular-nums">
                                  {String(peakHour).padStart(2, '0')}:00–
                                  {String((peakHour + 1) % 24).padStart(2, '0')}:00
                                </strong>
                              </span>
                              <span className="font-mono text-[11px] tabular-nums text-[var(--ink-mute)]">
                                {str.arrivals.peakVisits(arrivals[peakHour]?.count || 0)}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* 3.4 Traffic Sources (Referrers) */}
                <div className="p-5 rounded-2xl border border-[var(--line)] bg-[var(--surface)] flex flex-col justify-between min-w-0">
                  <div>
                    <h3 className="font-serif text-base font-medium text-[var(--highlight-ink)] lowercase flex items-center gap-1.5 mb-1">
                      <Compass size={15} />
                      <span>{str.referrers.title}</span>
                    </h3>
                    <p className="text-xs text-[var(--ink-soft)] lowercase mb-4">
                      {str.referrers.subtitle}
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
                      {s.referrersCategorized.map((cat) => (
                        <div
                          key={cat.category}
                          className="p-2.5 rounded-xl border border-[var(--line)] bg-[var(--bg)] text-center"
                        >
                          <span className="text-[10px] text-[var(--ink-soft)] block lowercase tracking-wide">
                            {str.referrers.categories[cat.category]}
                          </span>
                          <span className="text-base font-serif font-medium text-[var(--highlight-ink)] tabular-nums block mt-0.5">
                            {cat.count}
                          </span>
                          <span className="text-[10px] text-[var(--ink-mute)] font-mono tabular-nums">
                            {cat.percentage}%
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {s.topReferrers.length === 0 ? (
                        <p className="text-xs text-[var(--ink-mute)] lowercase">
                          {str.referrers.allDirect}
                        </p>
                      ) : (
                        s.topReferrers.map((ref) => (
                          <div
                            key={ref.referrer}
                            className="flex items-center justify-between text-xs py-1.5 border-b border-[var(--line)]/50 last:border-none"
                          >
                            <span
                              className="text-[var(--highlight-ink)] font-mono text-[11px] truncate max-w-[230px]"
                              title={ref.referrer}
                            >
                              {ref.referrer}
                            </span>
                            <span className="text-[var(--ink-soft)] font-mono text-[11px] tabular-nums">
                              {ref.count} {str.countries.visitsShort}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ===================================================================== */}
          {/* BAND 4: GAMEPLAY, FUNNEL, 3x3 SECTORS & UI CLICKS */}
          {/* ===================================================================== */}
          {showGameplay && (
            <section className="space-y-4">
              <h2 className="text-[11px] uppercase tracking-[0.14em] text-[var(--ink-soft)] font-medium">
                {str.sections.gameplayHeading}
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* 4.1 Conversion Funnel */}
                <div className="p-5 rounded-2xl border border-[var(--line)] bg-[var(--surface)] flex flex-col justify-between min-w-0">
                  <div>
                    <h3 className="font-serif text-base font-medium text-[var(--highlight-ink)] lowercase flex items-center gap-1.5 mb-1">
                      <TrendingUp size={15} />
                      <span>{str.funnel.title}</span>
                    </h3>
                    <p className="text-xs text-[var(--ink-soft)] lowercase mb-4">
                      {str.funnel.subtitle}
                    </p>

                    {(() => {
                      const f = s.funnel;
                      const base = Math.max(f.visits, 1);
                      const steps = [
                        {
                          label: str.funnel.steps[0],
                          count: f.visits,
                          pct: f.visits > 0 ? 100 : 0,
                        },
                        {
                          label: str.funnel.steps[1],
                          count: f.gameStarts,
                          pct: f.visits > 0 ? Math.round((f.gameStarts / base) * 100) : 0,
                        },
                        {
                          label: str.funnel.steps[2],
                          count: f.gameFinishes,
                          pct: f.visits > 0 ? Math.round((f.gameFinishes / base) * 100) : 0,
                        },
                        {
                          label: str.funnel.steps[3],
                          count: f.roomsOrShares,
                          pct: f.visits > 0 ? Math.round((f.roomsOrShares / base) * 100) : 0,
                        },
                      ];

                      return (
                        <div className="space-y-3">
                          {steps.map((st) => (
                            <div key={st.label} className="text-xs">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[var(--highlight-ink)] lowercase">
                                  {st.label}
                                </span>
                                <span className="text-[var(--ink-soft)] font-mono tabular-nums">
                                  {st.count} ({st.pct}%)
                                </span>
                              </div>
                              <div className="h-2 w-full bg-[var(--line)] rounded-full overflow-hidden">
                                <div
                                  style={{
                                    width: `${st.count > 0 ? Math.min(Math.max(st.pct, 3), 100) : 0}%`,
                                  }}
                                  className="h-full bg-[var(--highlight-ink)] rounded-full transition-all"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>

                  <div className="pt-4 mt-4 border-t border-[var(--line)] grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-[var(--ink-soft)] block lowercase">
                        {str.funnel.completionLabel}
                      </span>
                      <span className="text-base font-serif font-medium text-[var(--highlight-ink)] tabular-nums">
                        {s.gameBehavior.completionRate}%
                      </span>
                      <span className="text-[10px] text-[var(--ink-mute)] block lowercase tabular-nums">
                        {str.funnel.finishedLabel(s.gameBehavior.totalFinishes)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[var(--ink-soft)] block lowercase">
                        {str.funnel.avgSessionLabel}
                      </span>
                      <span className="text-base font-serif font-medium text-[var(--highlight-ink)] tabular-nums">
                        {formatDuration(s.gameBehavior.averageSessionSeconds, adminLang)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[var(--ink-soft)] block lowercase">
                        {str.funnel.viralityLabel}
                      </span>
                      <span className="text-base font-serif font-medium text-[var(--highlight-ink)] tabular-nums">
                        {s.funnel.visits > 0
                          ? Math.round((s.funnel.roomsOrShares / s.funnel.visits) * 100)
                          : 0}
                        %
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4.2 3x3 SuperBoard Sector Click Heatmap */}
                {(() => {
                  const sectorClicks =
                    s.featureStats?.sectorsClicked || [0, 0, 0, 0, 0, 0, 0, 0, 0];
                  const totalMoves = sectorClicks.reduce((a, b) => a + b, 0);
                  const maxMoves = Math.max(...sectorClicks, 1);
                  let topIdx = 4;
                  sectorClicks.forEach((val, idx) => {
                    if (val > (sectorClicks[topIdx] || 0)) topIdx = idx;
                  });

                  return (
                    <div className="p-5 rounded-2xl border border-[var(--line)] bg-[var(--surface)] flex flex-col justify-between min-w-0">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-serif text-base font-medium text-[var(--highlight-ink)] lowercase flex items-center gap-1.5">
                            <Grid3X3 size={15} />
                            <span>{str.sectors.title}</span>
                          </h3>
                          <span className="text-xs text-[var(--ink-soft)] font-mono tabular-nums">
                            {str.sectors.clicksLabel(totalMoves)}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--ink-soft)] lowercase mb-4">
                          {str.sectors.subtitle}
                        </p>

                        <div className="grid grid-cols-3 gap-2 aspect-square max-w-[236px] mx-auto p-2.5 bg-[var(--bg)] rounded-xl border border-[var(--line)]">
                          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((sectorIdx) => {
                            const clicks = sectorClicks[sectorIdx] || 0;
                            const pct =
                              totalMoves > 0
                                ? Math.round((clicks / totalMoves) * 100)
                                : 0;
                            const isTop = clicks === maxMoves && clicks > 0;
                            const intensity =
                              totalMoves > 0
                                ? Math.min(Math.max(clicks / maxMoves, 0.1), 1)
                                : 0;

                            return (
                              <div
                                key={sectorIdx}
                                style={{
                                  backgroundColor:
                                    clicks > 0
                                      ? isDark
                                        ? `rgba(245, 247, 249, ${intensity * 0.24 + 0.04})`
                                        : `rgba(46, 51, 56, ${intensity * 0.26 + 0.04})`
                                      : undefined,
                                }}
                                className={`relative flex flex-col items-center justify-center p-1.5 rounded-lg border text-center transition-colors ${
                                  isTop
                                    ? 'border-[var(--highlight-ink)] ring-1 ring-[var(--highlight-ink)]/30'
                                    : 'border-[var(--line)]'
                                }`}
                                title={`${str.sectors.names[sectorIdx]}: ${clicks} (${pct}%)`}
                              >
                                {isTop && (
                                  <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.2 rounded-full text-[8px] font-bold bg-[var(--highlight-ink)] text-[var(--bg)] uppercase">
                                    {str.sectors.topBadge}
                                  </span>
                                )}
                                <span className="text-[10px] text-[var(--ink-soft)] font-mono">
                                  #{sectorIdx}
                                </span>
                                <span className="text-sm font-serif font-medium text-[var(--highlight-ink)] tabular-nums">
                                  {clicks}
                                </span>
                                <span className="text-[9px] text-[var(--ink-mute)] font-mono tabular-nums">
                                  {pct}%
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="pt-3 mt-4 border-t border-[var(--line)] text-[11px] text-[var(--ink-soft)] lowercase">
                        {totalMoves > 0
                          ? str.sectors.topInsight(
                              topIdx,
                              str.sectors.names[topIdx] || '',
                              maxMoves
                            )
                          : str.sectors.empty}
                      </div>
                    </div>
                  );
                })()}

                {/* 4.3 Modes, Difficulty, Clocks & Modifiers */}
                <div className="p-5 rounded-2xl border border-[var(--line)] bg-[var(--surface)] min-w-0">
                  <h3 className="font-serif text-base font-medium text-[var(--highlight-ink)] lowercase flex items-center gap-1.5 mb-1">
                    <Sliders size={15} />
                    <span>{str.features.title}</span>
                  </h3>
                  <p className="text-xs text-[var(--ink-soft)] lowercase mb-4">
                    {str.features.subtitle}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Game Modes */}
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-[var(--ink-soft)] block mb-2">
                        {str.features.modesTitle}
                      </span>
                      {Object.keys(s.gameBehavior.startsByMode).length === 0 ? (
                        <span className="text-xs text-[var(--ink-mute)] lowercase">
                          {str.features.empty}
                        </span>
                      ) : (
                        <div className="space-y-1.5">
                          {Object.entries(s.gameBehavior.startsByMode)
                            .sort(([, a], [, b]) => b - a)
                            .map(([rawMode, count]) => {
                              const [baseMode, diffPart] = rawMode.split(' (');
                              const cleanMode =
                                str.features.modeLabels[baseMode] || baseMode;
                              const cleanDiff = diffPart
                                ? ` · ${
                                    str.features.difficultyLabels[
                                      diffPart.replace(')', '')
                                    ] || diffPart.replace(')', '')
                                  }`
                                : '';
                              return (
                                <div
                                  key={rawMode}
                                  className="flex items-center justify-between px-2.5 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--bg)] text-xs"
                                >
                                  <span className="text-[var(--highlight-ink)] lowercase truncate">
                                    {cleanMode}
                                    {cleanDiff}
                                  </span>
                                  <span className="font-mono font-medium tabular-nums text-[var(--ink-soft)]">
                                    {count}
                                  </span>
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </div>

                    {/* AI Difficulties + Clocks + Modifiers */}
                    <div className="space-y-3">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-[var(--ink-soft)] block mb-1.5">
                          {str.features.difficultyTitle}
                        </span>
                        {Object.keys(s.featureStats.difficulties || {}).length === 0 ? (
                          <span className="text-xs text-[var(--ink-mute)] lowercase">
                            {str.features.empty}
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {Object.entries(s.featureStats.difficulties).map(
                              ([diff, count]) => (
                                <span
                                  key={diff}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[var(--line)] bg-[var(--bg)] text-xs"
                                >
                                  <span className="text-[var(--highlight-ink)] lowercase">
                                    {str.features.difficultyLabels[diff] || diff}
                                  </span>
                                  <span className="font-mono text-[var(--ink-soft)] tabular-nums">
                                    {count}
                                  </span>
                                </span>
                              )
                            )}
                          </div>
                        )}
                      </div>

                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-[var(--ink-soft)] block mb-1.5">
                          {str.features.timersTitle}
                        </span>
                        {Object.keys(s.featureStats.timeControls || {}).length === 0 ? (
                          <span className="text-xs text-[var(--ink-mute)] lowercase">
                            {str.features.empty}
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {Object.entries(s.featureStats.timeControls).map(
                              ([tc, count]) => (
                                <span
                                  key={tc}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[var(--line)] bg-[var(--bg)] text-xs"
                                >
                                  <span className="text-[var(--highlight-ink)] lowercase">
                                    {str.features.timerLabels[tc] || tc}
                                  </span>
                                  <span className="font-mono text-[var(--ink-soft)] tabular-nums">
                                    {count}
                                  </span>
                                </span>
                              )
                            )}
                          </div>
                        )}
                      </div>

                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-[var(--ink-soft)] block mb-1.5">
                          {str.features.modifiersTitle}
                        </span>
                        {Object.keys(s.featureStats.modifiers || {}).length === 0 ? (
                          <span className="text-xs text-[var(--ink-mute)] lowercase">
                            {str.features.empty}
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {Object.entries(s.featureStats.modifiers).map(
                              ([mod, count]) => (
                                <span
                                  key={mod}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[var(--line)] bg-[var(--bg)] text-xs"
                                >
                                  <span className="text-[var(--highlight-ink)] lowercase">
                                    {str.features.modifierLabels[mod] || mod}
                                  </span>
                                  <span className="font-mono text-[var(--ink-soft)] tabular-nums">
                                    {count}
                                  </span>
                                </span>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4.4 UI Interactions */}
                <div className="p-5 rounded-2xl border border-[var(--line)] bg-[var(--surface)] min-w-0">
                  <h3 className="font-serif text-base font-medium text-[var(--highlight-ink)] lowercase flex items-center gap-1.5 mb-1">
                    <MousePointerClick size={15} />
                    <span>{str.buttons.title}</span>
                  </h3>
                  <p className="text-xs text-[var(--ink-soft)] lowercase mb-4">
                    {str.buttons.subtitle}
                  </p>

                  {s.buttonClicks.length === 0 ? (
                    <p className="text-xs text-[var(--ink-mute)] lowercase py-6 text-center border border-dashed border-[var(--line)] rounded-xl">
                      {str.buttons.empty}
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {s.buttonClicks.slice(0, 8).map((btn) => {
                        const friendly = str.buttons.labels[btn.target] || btn.target;
                        return (
                          <div key={btn.target} className="text-xs">
                            <div className="flex items-center justify-between mb-1">
                              <div className="min-w-0 flex items-center gap-2">
                                <span className="text-[var(--highlight-ink)] lowercase truncate">
                                  {friendly}
                                </span>
                                {friendly !== btn.target && (
                                  <span className="text-[10px] font-mono text-[var(--ink-mute)] hidden sm:inline">
                                    {btn.target}
                                  </span>
                                )}
                              </div>
                              <span className="font-mono text-[11px] tabular-nums text-[var(--ink-soft)] shrink-0">
                                {btn.count} ({btn.percentage}%)
                              </span>
                            </div>
                            <div className="h-1.5 w-full bg-[var(--line)] rounded-full overflow-hidden">
                              <div
                                style={{
                                  width: `${Math.min(Math.max(btn.percentage, 3), 100)}%`,
                                }}
                                className="h-full bg-[var(--highlight-ink)] rounded-full"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* ===================================================================== */}
          {/* BAND 5: BOTS & UNIFIED FILTERABLE EVENT LOG */}
          {/* ===================================================================== */}
          {showEvents && (
            <section className="space-y-4">
              <h2 className="text-[11px] uppercase tracking-[0.14em] text-[var(--ink-soft)] font-medium">
                {str.sections.logsHeading}
              </h2>

              {/* Bots Breakdown */}
              <div className="p-5 rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-1">
                  <div className="flex items-center gap-2">
                    <Bot size={15} className="text-rose-500" />
                    <h3 className="font-serif text-base font-medium text-[var(--highlight-ink)] lowercase">
                      {str.bots.title} ({s.humansVsBots.botVisits} ·{' '}
                      {s.humansVsBots.botPercentage}%)
                    </h3>
                  </div>
                  <span className="text-[11px] text-[var(--ink-mute)] lowercase">
                    {str.bots.subtitle}
                  </span>
                </div>

                {s.botBreakdown.length === 0 ? (
                  <p className="text-xs text-[var(--ink-mute)] lowercase">
                    {str.bots.empty}
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                    {s.botBreakdown.map((b) => (
                      <div
                        key={b.name}
                        className="p-2.5 rounded-xl border border-rose-500/20 bg-rose-500/5 dark:bg-rose-500/10 flex flex-col justify-between"
                      >
                        <span
                          className="text-[11px] font-medium text-[var(--highlight-ink)] truncate"
                          title={b.name}
                        >
                          {b.name}
                        </span>
                        <span className="text-xs font-mono text-rose-600 dark:text-rose-400 font-semibold mt-1 tabular-nums">
                          {b.count} {str.bots.hits}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Unified Event Stream & Arrival Log */}
              <div className="p-4 sm:p-5 rounded-2xl border border-[var(--line)] bg-[var(--surface)] min-w-0 overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Activity size={15} className="text-emerald-500" />
                      <h3 className="font-serif text-base font-medium text-[var(--highlight-ink)] lowercase">
                        {str.stream.title}
                      </h3>
                    </div>
                    <p className="text-xs text-[var(--ink-soft)] lowercase mt-0.5">
                      {str.stream.subtitle} ·{' '}
                      <span className="font-mono tabular-nums">
                        {str.stream.showingCount(
                          Math.min(filteredEvents.length, 40),
                          s.recentEvents.length
                        )}
                      </span>
                    </p>
                  </div>

                  {/* Filter pills */}
                  <div
                    role="group"
                    aria-label="filter events"
                    className="flex flex-wrap items-center gap-1"
                  >
                    {(
                      ['all', 'humans', 'pageviews', 'games', 'bots'] as const
                    ).map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setEventFilter(f)}
                        className={`min-h-[32px] px-2.5 py-1 rounded-lg text-xs lowercase transition-colors cursor-pointer ${
                          eventFilter === f
                            ? 'bg-[var(--highlight-ink)] text-[var(--bg)] font-medium'
                            : 'border border-[var(--line)] bg-[var(--bg)] text-[var(--ink-soft)] hover:text-[var(--highlight-ink)]'
                        }`}
                      >
                        {str.stream.filters[f]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[var(--line)] text-[var(--ink-soft)] uppercase text-[10px] tracking-wider">
                        <th className="py-2 px-2">{str.stream.columns.time}</th>
                        <th className="py-2 px-2">{str.stream.columns.event}</th>
                        <th className="py-2 px-2">{str.stream.columns.visitor}</th>
                        <th className="py-2 px-2">{str.stream.columns.location}</th>
                        <th className="py-2 px-2">{str.stream.columns.client}</th>
                        <th className="py-2 px-2">{str.stream.columns.details}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--line)]/50">
                      {filteredEvents.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="py-8 text-center text-xs text-[var(--ink-mute)] lowercase"
                          >
                            {str.stream.empty}
                          </td>
                        </tr>
                      ) : (
                        filteredEvents.slice(0, 40).map((ev) => {
                          const d = new Date(ev.timestamp);
                          const clockStr = d.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          });
                          const dateStr = d.toLocaleDateString([], {
                            day: '2-digit',
                            month: '2-digit',
                          });
                          const timeAgoSec = Math.max(
                            0,
                            Math.round((Date.now() - ev.timestamp) / 1000)
                          );
                          const agoStr =
                            timeAgoSec < 60
                              ? str.stream.agoSec(timeAgoSec)
                              : timeAgoSec < 3600
                              ? str.stream.agoMin(Math.round(timeAgoSec / 60))
                              : str.stream.agoHour(Math.round(timeAgoSec / 3600));

                          return (
                            <tr
                              key={ev.id}
                              className="hover:bg-[var(--line)]/20 transition-colors"
                            >
                              <td className="py-2.5 px-2 font-mono whitespace-nowrap tabular-nums">
                                <span className="text-[var(--highlight-ink)]">
                                  {clockStr}
                                </span>
                                <span className="text-[var(--ink-mute)] ml-1.5 text-[10px]">
                                  {dateStr} · {agoStr}
                                </span>
                              </td>
                              <td className="py-2.5 px-2">
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-mono font-medium ${
                                      ev.type === 'game'
                                        ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                                        : ev.type === 'click'
                                        ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300'
                                        : ev.type === 'feature'
                                        ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300'
                                        : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                    }`}
                                  >
                                    {ev.type}
                                  </span>
                                  <span className="font-mono text-[var(--highlight-ink)] truncate max-w-[160px]">
                                    {str.buttons.labels[ev.target] || ev.target}
                                  </span>
                                </div>
                              </td>
                              <td className="py-2.5 px-2 whitespace-nowrap">
                                {ev.isBot ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400">
                                    {str.stream.visitorBadges.bot}:{' '}
                                    {ev.botName || 'Bot'}
                                  </span>
                                ) : (
                                  <div className="flex items-center gap-1.5">
                                    <span
                                      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                        ev.isReturning
                                          ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400'
                                          : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                                      }`}
                                    >
                                      {ev.isReturning
                                        ? str.stream.visitorBadges.returning
                                        : str.stream.visitorBadges.new}
                                    </span>
                                    <span
                                      className="font-mono text-[11px] text-[var(--ink-soft)]"
                                      title={ev.visitorId}
                                    >
                                      {ev.visitorId.slice(0, 8)}
                                    </span>
                                  </div>
                                )}
                              </td>
                              <td className="py-2.5 px-2 whitespace-nowrap">
                                <span className="mr-1.5">
                                  {ev.country ? countryCodeToFlag(ev.country) : '🌐'}
                                </span>
                                <span className="text-[var(--highlight-ink)]">
                                  {ev.countryName || ev.country || 'Unknown'}
                                </span>
                                {ev.city && (
                                  <span className="text-[var(--ink-mute)] ml-1 text-[11px]">
                                    ({ev.city})
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-2 text-[var(--ink-soft)] whitespace-nowrap">
                                {ev.device} · {ev.browser}
                                {ev.os ? ` · ${ev.os}` : ''}
                              </td>
                              <td className="py-2.5 px-2 text-[10px] font-mono text-[var(--ink-mute)] truncate max-w-[200px]">
                                {ev.referrer
                                  ? ev.referrer
                                  : ev.metadata
                                  ? JSON.stringify(ev.metadata)
                                  : 'direct'}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
