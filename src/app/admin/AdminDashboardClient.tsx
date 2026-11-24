'use client';

import React, { useState, useEffect, useCallback, useTransition } from 'react';
import Link from 'next/link';
import {
  Users,
  Eye,
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
  Share2,
  CheckCircle2,
  Activity,
  Shield,
  MousePointerClick,
  Compass,
  Laptop,
  Smartphone,
  Tablet,
  Grid3X3,
  Layers,
  Zap,
  MapPin,
  Trash2,
} from 'lucide-react';
import { AnalyticsSummary, VisitorEvent, CountryStat, TimePoint, HourlyArrivalStat } from '@/lib/analytics/types';
import { countryCodeToFlag } from '@/lib/analytics/botDetector';

const SECTOR_NAMES: Record<number, string> = {
  0: 'верх-лево (0)',
  1: 'верх-центр (1)',
  2: 'верх-право (2)',
  3: 'центр-лево (3)',
  4: 'центр (4)',
  5: 'центр-право (5)',
  6: 'низ-лево (6)',
  7: 'низ-центр (7)',
  8: 'низ-право (8)',
};

interface AdminDashboardClientProps {
  initialAuthenticated?: boolean;
}

export function AdminDashboardClient({
  initialAuthenticated = false,
}: AdminDashboardClientProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(initialAuthenticated);
  const [email, setEmail] = useState('temirlan122110@gmail.com');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [range, setRange] = useState<'24h' | '7d' | '30d' | 'all'>('7d');
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>('');
  const [isPending, startTransition] = useTransition();

  // Theme support
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const [adminLang, setAdminLang] = useState<'ru' | 'en'>('ru');
  useEffect(() => {
    try {
      const stored = localStorage.getItem('ttt_lang') || (navigator.language?.startsWith('ru') ? 'ru' : 'en');
      if (stored === 'en' || stored === 'ru') {
        setAdminLang(stored);
      }
    } catch {}
  }, []);

  const toggleAdminLang = () => {
    const next = adminLang === 'ru' ? 'en' : 'ru';
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

  // Check auth and fetch stats on initial mount
  const fetchStats = useCallback(async (activeRange: string) => {
    setIsLoadingStats(true);
    try {
      const res = await fetch(`/api/admin/stats?range=${activeRange}`);
      if (res.ok) {
        const data: AnalyticsSummary = await res.json();
        setSummary(data);
        setIsAuthenticated(true);
        setAuthError(null);
        setLastRefreshedAt(new Date().toLocaleTimeString());
      } else {
        // If 404 or 401, visitor is unauthenticated
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

  // Auto-refresh interval (every 30s)
  useEffect(() => {
    if (!isAuthenticated || !autoRefresh) return;
    const interval = setInterval(() => {
      fetchStats(range);
    }, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, autoRefresh, range, fetchStats]);

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setAuthError('введи пароль');
      return;
    }

    setIsSubmitting(true);
    setAuthError(null);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() || undefined, password: password.trim() }),
      });

      if (res.ok) {
        setPassword('');
        await fetchStats(range);
      } else {
        const data = await res.json().catch(() => ({}));
        setAuthError(data.error || 'неверные данные доступа');
      }
    } catch {
      setAuthError('ошибка соединения с сервером');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } catch {}
    setIsAuthenticated(false);
    setSummary(null);
  };

  // Handle CSV Download
  const handleExportCsv = () => {
    window.location.href = `/api/admin/export?range=${range}`;
  };

  // Handle Clear All Data (Reset to 0)
  const handleClearData = async () => {
    if (!window.confirm('Сбросить все накопленные данные аналитики и начать строго с нуля?')) return;
    try {
      const res = await fetch('/api/admin/stats', { method: 'DELETE' });
      if (res.ok) {
        fetchStats(range);
      }
    } catch {}
  };

  // 1. Loading Initial Auth Check
  if (isAuthenticated === null) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-[var(--bg)] text-[var(--ink-soft)] font-sans">
        <div className="flex items-center gap-2 text-xs">
          <RefreshCw className="animate-spin" size={14} />
          <span>{adminLang === 'ru' ? 'проверка сессии администратора…' : 'checking admin session…'}</span>
        </div>
      </main>
    );
  }

  // 2. Unauthenticated Login Gate
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-[var(--bg)] text-[var(--ink)] font-sans antialiased">
        <div className="w-full max-w-sm rounded-2xl p-7 border border-[var(--line)] bg-[var(--bg)] shadow-xl transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-[var(--highlight-ink)]">
              <Lock size={15} />
              <h1 className="font-serif text-lg font-medium tracking-tight lowercase">
                tic³ · admin access
              </h1>
            </div>
            <button
              type="button"
              onClick={toggleAdminLang}
              className="text-[11px] font-mono uppercase tracking-wider text-[var(--ink-soft)] hover:text-[var(--highlight-ink)] border border-[var(--line)] rounded-md px-1.5 py-0.5 transition-colors cursor-pointer"
            >
              {adminLang === 'ru' ? 'EN' : 'RU'}
            </button>
          </div>

          <p className="text-xs text-[var(--ink-soft)] mb-6 font-sans lowercase leading-relaxed">
            {adminLang === 'ru'
              ? 'приватный дашборд платформы. доступ защищен httpOnly сессией и rate-limiting.'
              : 'private platform dashboard. access secured by httpOnly session and rate-limiting.'}
          </p>

          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label className="block text-[11px] text-[var(--ink-soft)] uppercase tracking-wider mb-1">
                {adminLang === 'ru' ? 'email администратора' : 'admin email'}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--line)] bg-transparent text-[var(--highlight-ink)] focus:outline-none focus:border-[var(--highlight-ink)] transition-colors"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-[11px] text-[var(--ink-soft)] uppercase tracking-wider mb-1">
                {adminLang === 'ru' ? 'пароль администратора' : 'admin password'}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setAuthError(null);
                }}
                placeholder={adminLang === 'ru' ? 'пароль' : 'password'}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--line)] bg-transparent text-[var(--highlight-ink)] focus:outline-none focus:border-[var(--highlight-ink)] transition-colors"
                autoFocus
                autoComplete="current-password"
              />
            </div>

            {authError && (
              <p className="text-[11px] text-rose-500 font-medium lowercase animate-shake">
                {authError}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-3 rounded-lg bg-[var(--highlight-ink)] text-[var(--bg)] text-xs font-medium lowercase hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 mt-1"
            >
              {isSubmitting
                ? adminLang === 'ru'
                  ? 'авторизация…'
                  : 'authenticating…'
                : adminLang === 'ru'
                ? 'войти в панель'
                : 'sign in'}
            </button>

            <div className="pt-2 flex items-center justify-between text-xs text-[var(--ink-mute)]">
              <a
                href="https://ttt.temr.dev"
                className="hover:text-[var(--highlight-ink)] hairline-link transition-colors flex items-center gap-1"
              >
                <ArrowLeft size={12} />
                <span>{adminLang === 'ru' ? 'вернуться к игре' : 'return to game'}</span>
              </a>
              <button
                type="button"
                onClick={toggleTheme}
                className="hover:text-[var(--highlight-ink)] hairline-link flex items-center gap-1 cursor-pointer"
              >
                {isDark ? <Sun size={12} /> : <Moon size={12} />}
                <span>
                  {isDark
                    ? adminLang === 'ru'
                      ? 'светлая'
                      : 'light'
                    : adminLang === 'ru'
                    ? 'тёмная'
                    : 'dark'}
                </span>
              </button>
            </div>
          </form>
        </div>
      </main>
    );
  }

  // 3. Authenticated Dashboard View
  const s = summary;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] font-sans antialiased p-4 md:p-8 max-w-6xl mx-auto selection:bg-[var(--selection-bg)]">
      {/* Top Header Bar */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[var(--line)] gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <a
              href="https://ttt.temr.dev"
              className="p-1.5 rounded-lg border border-[var(--line)] hover:bg-[var(--line)]/30 text-[var(--ink-soft)] hover:text-[var(--highlight-ink)] transition-colors cursor-pointer"
              title="вернуться к игре"
            >
              <ArrowLeft size={15} />
            </a>
            <h1 className="font-serif text-xl md:text-2xl font-medium tracking-tight text-[var(--highlight-ink)] lowercase">
              tic³ · telemetry & analytics
            </h1>
            {s && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {s.visitorsNow} online now
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--ink-soft)] mt-1 lowercase">
            приватная телеметрия платформы · визитеры, география, поведение, боты и конверсии
          </p>
        </div>

        {/* Header Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Time range selector */}
          <div className="flex items-center rounded-lg border border-[var(--line)] p-0.5 text-xs lowercase bg-[var(--bg)]">
            {(
              [
                { id: '24h', label: '24h' },
                { id: '7d', label: '7d' },
                { id: '30d', label: '30d' },
                { id: 'all', label: 'all' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setRange(t.id);
                  startTransition(() => {
                    fetchStats(t.id);
                  });
                }}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer text-xs ${
                  range === t.id
                    ? 'bg-[var(--highlight-ink)] text-[var(--bg)] font-medium shadow-xs'
                    : 'text-[var(--ink-soft)] hover:text-[var(--highlight-ink)]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Refresh button */}
          <button
            onClick={() => fetchStats(range)}
            disabled={isLoadingStats}
            className="p-1.5 rounded-lg border border-[var(--line)] hover:bg-[var(--line)]/30 text-[var(--ink-soft)] hover:text-[var(--highlight-ink)] transition-colors cursor-pointer"
            title="обновить данные"
          >
            <RefreshCw size={14} className={isLoadingStats ? 'animate-spin' : ''} />
          </button>

          {/* Export CSV button */}
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--line)] hover:bg-[var(--line)]/30 text-[var(--ink)] hover:text-[var(--highlight-ink)] text-xs font-medium lowercase transition-colors cursor-pointer"
            title="экспорт данных в CSV"
          >
            <Download size={13} />
            <span>CSV</span>
          </button>

          {/* Reset / Clear Data button */}
          <button
            onClick={handleClearData}
            className="p-1.5 rounded-lg border border-[var(--line)] hover:border-rose-400 hover:text-rose-600 text-[var(--ink-soft)] transition-colors cursor-pointer"
            title="сбросить аналитику (начать с чистого листа)"
          >
            <Trash2 size={13} />
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg border border-[var(--line)] hover:bg-[var(--line)]/30 text-[var(--ink-soft)] hover:text-[var(--highlight-ink)] transition-colors cursor-pointer"
            title="сменить тему"
          >
            {isDark ? <Sun size={14} /> : <Moon size={14} />}
          </button>

          {/* Logout button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[var(--line)] hover:border-rose-300 hover:text-rose-600 text-[var(--ink-soft)] text-xs font-medium lowercase transition-colors cursor-pointer"
            title="выйти из системы"
          >
            <LogOut size={13} />
            <span className="hidden sm:inline">выйти</span>
          </button>
        </div>
      </header>

      {/* KPI Overview Grid */}
      {s && (
        <>
          <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            {/* 1. Visitors Now */}
            <div className="p-4 rounded-xl border border-[var(--line)] bg-[var(--bg)] flex flex-col justify-between">
              <div className="flex items-center justify-between text-[var(--ink-soft)] text-xs mb-1">
                <span>сейчас</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="text-2xl font-serif font-medium text-[var(--highlight-ink)]">
                {s.visitorsNow}
              </div>
              <div className="text-[11px] text-[var(--ink-mute)] lowercase mt-1">
                онлайн (последние 5м)
              </div>
            </div>

            {/* 2. Total Visits */}
            <div className="p-4 rounded-xl border border-[var(--line)] bg-[var(--bg)] flex flex-col justify-between">
              <div className="flex items-center justify-between text-[var(--ink-soft)] text-xs mb-1">
                <span>всего визитеров</span>
                <Eye size={13} />
              </div>
              <div className="text-2xl font-serif font-medium text-[var(--highlight-ink)]">
                {s.totalVisits}
              </div>
              <div className="text-[11px] text-[var(--ink-mute)] lowercase mt-1">
                за период {range}
              </div>
            </div>

            {/* 3. Unique Human Visitors */}
            <div className="p-4 rounded-xl border border-[var(--line)] bg-[var(--bg)] flex flex-col justify-between">
              <div className="flex items-center justify-between text-[var(--ink-soft)] text-xs mb-1">
                <span>уникальные</span>
                <Users size={13} />
              </div>
              <div className="text-2xl font-serif font-medium text-[var(--highlight-ink)]">
                {s.uniqueVisitors}
              </div>
              <div className="text-[11px] text-[var(--ink-mute)] lowercase mt-1">
                реальных людей
              </div>
            </div>

            {/* 4. Bots & Crawlers */}
            <div className="p-4 rounded-xl border border-[var(--line)] bg-[var(--bg)] flex flex-col justify-between">
              <div className="flex items-center justify-between text-[var(--ink-soft)] text-xs mb-1">
                <span>боты</span>
                <Bot size={13} className="text-rose-500" />
              </div>
              <div className="text-2xl font-serif font-medium text-rose-600 dark:text-rose-400">
                {s.totalBots}
              </div>
              <div className="text-[11px] text-[var(--ink-mute)] lowercase mt-1">
                {s.botPercentage}% от всего трафика
              </div>
            </div>

            {/* 5. Today */}
            <div className="p-4 rounded-xl border border-[var(--line)] bg-[var(--bg)] flex flex-col justify-between">
              <div className="flex items-center justify-between text-[var(--ink-soft)] text-xs mb-1">
                <span>сегодня</span>
                <Clock size={13} />
              </div>
              <div className="text-2xl font-serif font-medium text-[var(--highlight-ink)]">
                {s.today.visits}
              </div>
              <div className="text-[11px] text-[var(--ink-mute)] lowercase mt-1">
                {s.today.uniques} уникальных
              </div>
            </div>

            {/* 6. Retention Rate */}
            <div className="p-4 rounded-xl border border-[var(--line)] bg-[var(--bg)] flex flex-col justify-between">
              <div className="flex items-center justify-between text-[var(--ink-soft)] text-xs mb-1">
                <span>возвращаемость</span>
                <CheckCircle2 size={13} />
              </div>
              <div className="text-2xl font-serif font-medium text-[var(--highlight-ink)]">
                {s.returningVsNew.returningPercentage}%
              </div>
              <div className="text-[11px] text-[var(--ink-mute)] lowercase mt-1">
                {s.returningVsNew.returning} повт. · {s.returningVsNew.newVisitors} новых
              </div>
            </div>
          </section>

          {/* Timeline Chart Over Time */}
          <section className="p-5 rounded-2xl border border-[var(--line)] bg-[var(--bg)] mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
              <div>
                <h2 className="font-serif text-base font-medium text-[var(--highlight-ink)] lowercase">
                  динамика визитов во времени
                </h2>
                <p className="text-xs text-[var(--ink-soft)] lowercase">
                  {range === '24h' ? 'почасовая активность (24ч)' : `ежедневная динамика (${range})`} · люди и боты разделены
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs text-[var(--ink-soft)]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[var(--highlight-ink)]" />
                  <span>люди (визиты)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[var(--ink-soft)] opacity-60" />
                  <span>уникальные</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-rose-400 dark:bg-rose-500 opacity-60" />
                  <span>боты</span>
                </div>
              </div>
            </div>

            {/* SVG Minimalist Bar Chart */}
            <div className="h-44 w-full flex items-end gap-1 sm:gap-2 pt-4 px-1 border-b border-[var(--line)] pb-2 overflow-x-auto">
              {(() => {
                const points: TimePoint[] = range === '24h' ? s.timeline : s.dailyTimeline;
                const maxVal = Math.max(...points.map((p) => Math.max(p.count, p.bots)), 1);

                return points.map((p, idx) => {
                  const humanH = Math.round((p.count / maxVal) * 100);
                  const botH = Math.round((p.bots / maxVal) * 100);

                  return (
                    <div
                      key={idx}
                      className="flex-1 min-w-[14px] flex flex-col items-center justify-end h-full group relative"
                    >
                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-20 pointer-events-none">
                        <div className="px-2 py-1 rounded bg-[var(--highlight-ink)] text-[var(--bg)] text-[10px] whitespace-nowrap shadow-md">
                          <p className="font-medium">{p.label}</p>
                          <p>люди: {p.count} (уник: {p.uniques})</p>
                          <p>боты: {p.bots}</p>
                        </div>
                      </div>

                      {/* Stacked/Parallel bars */}
                      <div className="w-full flex items-end justify-center gap-0.5 h-full">
                        <div
                          style={{ height: `${Math.max(humanH, 3)}%` }}
                          className="w-full max-w-[10px] bg-[var(--highlight-ink)] rounded-t-xs transition-all duration-300"
                        />
                        {p.bots > 0 && (
                          <div
                            style={{ height: `${Math.max(botH, 3)}%` }}
                            className="w-full max-w-[6px] bg-rose-400 dark:bg-rose-500/70 rounded-t-xs transition-all duration-300"
                          />
                        )}
                      </div>

                      <span className="text-[9px] text-[var(--ink-mute)] mt-1.5 tracking-tighter truncate w-full text-center">
                        {idx % (range === '24h' ? 3 : 2) === 0 ? p.label : ''}
                      </span>
                    </div>
                  );
                });
              })()}
            </div>
          </section>

          {/* 1. Board Sectors Click Scheme & Frequently Used Features */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* 1.1 3x3 Board Click Heatmap Scheme */}
            {(() => {
              const sectorClicks = s.featureStats?.sectorsClicked || [0, 0, 0, 0, 0, 0, 0, 0, 0];
              const actualSectorClicks = sectorClicks.reduce((a, b) => a + b, 0);
              const maxSectorClicks = Math.max(...sectorClicks, 1);
              let topSectorIndex = 4;
              sectorClicks.forEach((val, idx) => {
                if (val > (sectorClicks[topSectorIndex] || 0)) topSectorIndex = idx;
              });

              return (
                <div className="p-5 rounded-2xl border border-[var(--line)] bg-[var(--bg)] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-serif text-base font-medium text-[var(--highlight-ink)] lowercase flex items-center gap-1.5">
                        <Grid3X3 size={16} />
                        <span>схема кликов по секторам доски</span>
                      </h3>
                      <span className="text-xs text-[var(--ink-soft)] font-mono">
                        {actualSectorClicks} кликов
                      </span>
                    </div>
                    <p className="text-xs text-[var(--ink-soft)] lowercase mb-4">
                      тепловая карта 9 малых секторов большой доски (0–8)
                    </p>

                    {/* Visual 3x3 Grid of the SuperBoard */}
                    <div className="grid grid-cols-3 gap-2.5 aspect-square max-w-[260px] mx-auto p-2.5 bg-[var(--line)]/20 rounded-xl border border-[var(--line)]">
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((sectorIdx) => {
                        const clicks = sectorClicks[sectorIdx] || 0;
                        const pct = actualSectorClicks > 0 ? Math.round((clicks / actualSectorClicks) * 100) : 0;
                        const isTop = clicks === maxSectorClicks && clicks > 0;
                        const intensity = actualSectorClicks > 0 ? Math.min(Math.max(clicks / maxSectorClicks, 0.08), 1) : 0;

                        return (
                          <div
                            key={sectorIdx}
                            style={{
                              backgroundColor: `rgba(78, 84, 90, ${intensity * 0.38 + 0.05})`,
                            }}
                            className={`relative flex flex-col items-center justify-center p-2 rounded-lg border transition-all text-center cursor-default ${
                              isTop
                                ? 'border-[var(--highlight-ink)] shadow-xs ring-1 ring-[var(--highlight-ink)]/40'
                                : 'border-[var(--line)]'
                            }`}
                            title={`${SECTOR_NAMES[sectorIdx]}: ${clicks} кликов (${pct}%)`}
                          >
                            {isTop && (
                              <span className="absolute -top-1.5 -right-1.5 px-1 py-0.2 rounded-full text-[8px] font-bold bg-[var(--highlight-ink)] text-[var(--bg)] uppercase">
                                топ
                              </span>
                            )}
                            <span className="text-[10px] text-[var(--ink-soft)] font-mono">
                              #{sectorIdx}
                            </span>
                            <span className="text-sm sm:text-base font-serif font-medium text-[var(--highlight-ink)]">
                              {clicks}
                            </span>
                            <span className="text-[9px] text-[var(--ink-mute)] font-mono">
                              {pct}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-3 mt-4 border-t border-[var(--line)] text-[11px] text-[var(--ink-soft)] lowercase">
                    {actualSectorClicks > 0 ? (
                      <>
                        чаще всего игроки ходят в сектор <strong className="text-[var(--highlight-ink)] font-mono">#{topSectorIndex}</strong> ({SECTOR_NAMES[topSectorIndex] || ''}) · {maxSectorClicks} кликов
                      </>
                    ) : (
                      <>кликов по доске пока не зафиксировано</>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* 1.2 Frequently Used Features (Difficulty, Time Controls, Modifiers) */}
            <div className="p-5 rounded-2xl border border-[var(--line)] bg-[var(--bg)] flex flex-col justify-between">
              <div>
                <h3 className="font-serif text-base font-medium text-[var(--highlight-ink)] lowercase flex items-center gap-1.5 mb-1">
                  <Zap size={16} />
                  <span>что чаще всего используют</span>
                </h3>
                <p className="text-xs text-[var(--ink-soft)] lowercase mb-3">
                  выбор уровня сложности, таймера и модификаторов
                </p>

                <div className="space-y-3.5">
                  {/* AI Difficulties */}
                  <div>
                    <span className="text-[10px] text-[var(--ink-soft)] block uppercase tracking-wider mb-1">
                      уровень сложности ии
                    </span>
                    {Object.entries(s.featureStats.difficulties || {}).length === 0 ? (
                      <span className="text-xs text-[var(--ink-mute)] lowercase">нет данных</span>
                    ) : (
                      <div className="grid grid-cols-2 gap-1.5">
                        {Object.entries(s.featureStats.difficulties || {}).map(([diff, count]) => (
                          <div key={diff} className="flex items-center justify-between px-2.5 py-1 rounded-md border border-[var(--line)]/60 text-xs bg-[var(--line)]/10">
                            <span className="text-[var(--highlight-ink)] lowercase font-mono">{diff}</span>
                            <span className="text-[var(--ink-soft)] font-mono font-medium">{String(count)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Time controls */}
                  <div>
                    <span className="text-[10px] text-[var(--ink-soft)] block uppercase tracking-wider mb-1">
                      контроль времени (таймер)
                    </span>
                    {Object.entries(s.featureStats.timeControls || {}).length === 0 ? (
                      <span className="text-xs text-[var(--ink-mute)] lowercase">нет данных</span>
                    ) : (
                      <div className="grid grid-cols-3 gap-1.5">
                        {Object.entries(s.featureStats.timeControls || {}).map(([tc, count]) => (
                          <div key={tc} className="flex items-center justify-between px-2 py-1 rounded-md border border-[var(--line)]/60 text-xs bg-[var(--line)]/10">
                            <span className="text-[var(--highlight-ink)] lowercase font-mono">{tc}</span>
                            <span className="text-[var(--ink-soft)] font-mono font-medium">{String(count)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Modifiers */}
                  <div>
                    <span className="text-[10px] text-[var(--ink-soft)] block uppercase tracking-wider mb-1">
                      модификаторы партий
                    </span>
                    {Object.entries(s.featureStats.modifiers || {}).length === 0 ? (
                      <span className="text-xs text-[var(--ink-mute)] lowercase">нет данных</span>
                    ) : (
                      <div className="grid grid-cols-3 gap-1.5">
                        {Object.entries(s.featureStats.modifiers || {}).map(([mod, count]) => {
                          const label = mod === 'fogOfWar' ? 'туман' : mod === 'fadingInk' ? 'чернила' : mod === 'speedBlitz' ? 'блиц' : mod;
                          return (
                            <div key={mod} className="flex items-center justify-between px-2 py-1 rounded-md border border-[var(--line)]/60 text-xs bg-[var(--line)]/10">
                              <span className="text-[var(--highlight-ink)] lowercase">{label}</span>
                              <span className="text-[var(--ink-soft)] font-mono font-medium">{String(count)}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-[var(--line)] text-[10px] text-[var(--ink-mute)] lowercase">
                учитывается реальное использование настроек игроками
              </div>
            </div>

            {/* 1.3 Most Clicked UI Buttons */}
            <div className="p-5 rounded-2xl border border-[var(--line)] bg-[var(--bg)] flex flex-col justify-between">
              <div>
                <h3 className="font-serif text-base font-medium text-[var(--highlight-ink)] lowercase flex items-center gap-1.5 mb-1">
                  <MousePointerClick size={16} />
                  <span>популярные клики UI</span>
                </h3>
                <p className="text-xs text-[var(--ink-soft)] lowercase mb-3">
                  нажатия на кнопки интерфейса и диалоги
                </p>

                <div className="space-y-2">
                  {s.buttonClicks.length === 0 ? (
                    <p className="text-xs text-[var(--ink-soft)] lowercase">нет зафиксированных кликов</p>
                  ) : (
                    s.buttonClicks.slice(0, 7).map((btn) => (
                      <div key={btn.target} className="flex items-center justify-between text-xs py-1 border-b border-[var(--line)]/50 last:border-none">
                        <span className="text-[var(--highlight-ink)] font-mono text-[11px] truncate max-w-[170px]" title={btn.target}>
                          {btn.target}
                        </span>
                        <div className="flex items-center gap-2 font-mono text-[11px]">
                          <span className="text-[var(--ink-soft)]">{btn.count}</span>
                          <span className="text-[10px] text-[var(--ink-mute)] w-7 text-right">{btn.percentage}%</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-3 mt-2 text-[10px] text-[var(--ink-mute)] lowercase">
                тема, смена языка, правила, шеринг, никнейм и вызовы
              </div>
            </div>
          </section>

          {/* 2. Geography & Diurnal Arrival Times (С какой страны и в какое время пришли) */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* 2.1 Countries Table & Bars */}
            <div className="p-5 rounded-2xl border border-[var(--line)] bg-[var(--bg)]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-serif text-base font-medium text-[var(--highlight-ink)] lowercase flex items-center gap-1.5">
                  <Globe size={16} />
                  <span>с какой страны пришли (география)</span>
                </h3>
                <span className="text-xs text-[var(--ink-soft)] font-mono">
                  {s.countries.length} стран
                </span>
              </div>

              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {s.countries.length === 0 ? (
                  <p className="text-xs text-[var(--ink-soft)] lowercase">нет данных о странах</p>
                ) : (
                  s.countries.slice(0, 8).map((c) => (
                    <div key={c.code} className="text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{c.flag}</span>
                          <span className="text-[var(--highlight-ink)] font-medium lowercase">
                            {c.name}
                          </span>
                          {c.cities.length > 0 && (
                            <span className="text-[10px] text-[var(--ink-mute)] hidden sm:inline">
                              ({c.cities.map((ci) => ci.city).join(', ')})
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 font-mono text-[11px]">
                          <span className="text-[var(--highlight-ink)]">{c.count} виз.</span>
                          <span className="text-[var(--ink-mute)] w-8 text-right">{c.percentage}%</span>
                        </div>
                      </div>
                      <div className="h-1.5 w-full bg-[var(--line)] rounded-full overflow-hidden">
                        <div
                          style={{ width: `${Math.max(c.percentage, 2)}%` }}
                          className="h-full bg-[var(--highlight-ink)] rounded-full"
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 2.2 Diurnal Arrival Distribution (В какое время пришли) */}
            <div className="p-5 rounded-2xl border border-[var(--line)] bg-[var(--bg)] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-serif text-base font-medium text-[var(--highlight-ink)] lowercase flex items-center gap-1.5">
                    <Clock size={16} />
                    <span>в какое время пришли (суточный цикл)</span>
                  </h3>
                  <span className="text-xs text-[var(--ink-soft)] font-mono">
                    24 часа (00:00 - 23:00)
                  </span>
                </div>
                <p className="text-xs text-[var(--ink-soft)] lowercase mb-4">
                  распределение времени прихода посетителей в течение суток
                </p>

                {/* 24-hour bar distribution */}
                {(() => {
                  const arrivals = s.hourlyArrivals || [];
                  const maxH = Math.max(...arrivals.map((a) => a.count), 1);
                  let peakHour = 19;
                  arrivals.forEach((a) => {
                    if (a.count > (arrivals[peakHour]?.count || 0)) peakHour = a.hour;
                  });

                  return (
                    <div>
                      <div className="h-36 w-full flex items-end gap-1 pt-2 border-b border-[var(--line)] pb-2">
                        {arrivals.map((a) => {
                          const hPct = Math.round((a.count / maxH) * 100);
                          const isPeak = a.hour === peakHour;

                          return (
                            <div
                              key={a.hour}
                              className="flex-1 flex flex-col items-center justify-end h-full group relative"
                            >
                              {/* Tooltip */}
                              <div className="absolute bottom-full mb-1.5 hidden group-hover:flex flex-col items-center z-20 pointer-events-none">
                                <div className="px-2 py-1 rounded bg-[var(--highlight-ink)] text-[var(--bg)] text-[10px] whitespace-nowrap shadow-md">
                                  <p className="font-medium">{a.label}</p>
                                  <p>{a.count} визитов ({a.percentage}%)</p>
                                  <p>{a.uniques} уникальных</p>
                                </div>
                              </div>

                              <div
                                style={{ height: `${Math.max(hPct, 4)}%` }}
                                className={`w-full max-w-[8px] rounded-t-xs transition-all ${
                                  isPeak
                                    ? 'bg-[var(--highlight-ink)] ring-1 ring-[var(--highlight-ink)]/50'
                                    : 'bg-[var(--ink-soft)]/50 group-hover:bg-[var(--highlight-ink)]'
                                }`}
                              />

                              <span className="text-[8px] text-[var(--ink-mute)] mt-1 tracking-tighter">
                                {a.hour % 4 === 0 ? String(a.hour).padStart(2, '0') : ''}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      <div className="pt-3 mt-3 text-xs text-[var(--ink-soft)] lowercase flex items-center justify-between">
                        {arrivals.some((a) => a.count > 0) ? (
                          <>
                            <span>
                              наибольший наплыв: <strong className="text-[var(--highlight-ink)] font-mono">{String(peakHour).padStart(2, '0')}:00 – {String((peakHour + 2) % 24).padStart(2, '0')}:00</strong>
                            </span>
                            <span className="font-mono text-[11px] text-[var(--ink-mute)]">
                              {arrivals[peakHour]?.count || 0} визитов в пик
                            </span>
                          </>
                        ) : (
                          <span>визитов за выбранный период пока не зафиксировано</span>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="pt-3 mt-3 border-t border-[var(--line)] text-[10px] text-[var(--ink-mute)] lowercase">
                показывает оптимальное время онлайна для организации турниров и игр
              </div>
            </div>
          </section>

          {/* 3. Detailed Arrival Log: Country & Exact Arrival Time */}
          <section className="p-5 rounded-2xl border border-[var(--line)] bg-[var(--bg)] mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-[var(--highlight-ink)]" />
                <h3 className="font-serif text-base font-medium text-[var(--highlight-ink)] lowercase">
                  журнал визитов · страна и точное время прибытия
                </h3>
              </div>
              <span className="text-xs text-[var(--ink-soft)] font-mono">
                последние прибывшие визитеры
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--line)] text-[var(--ink-soft)] uppercase text-[10px] tracking-wider">
                    <th className="py-2 px-2">точное время</th>
                    <th className="py-2 px-2">страна и город</th>
                    <th className="py-2 px-2">тип визитера</th>
                    <th className="py-2 px-2">устройство / браузер</th>
                    <th className="py-2 px-2">источник (referrer)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]/50">
                  {(() => {
                    const visitors = s.recentEvents.filter(
                      (e) => e.type === 'pageview' || e.category === 'navigation' || !e.isBot
                    );
                    if (visitors.length === 0) {
                      return (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-xs text-[var(--ink-mute)] lowercase">
                            пока нет зафиксированных визитов реальных пользователей
                          </td>
                        </tr>
                      );
                    }
                    return visitors.slice(0, 10).map((ev) => {
                      const d = new Date(ev.timestamp);
                      const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                      const dateStr = d.toLocaleDateString([], { day: '2-digit', month: '2-digit' });

                      return (
                        <tr key={ev.id} className="hover:bg-[var(--line)]/20 transition-colors">
                          <td className="py-2.5 px-2 font-mono text-[var(--highlight-ink)] whitespace-nowrap">
                            <span className="text-[var(--ink-soft)] mr-1.5">{dateStr}</span>
                            <span>{timeStr}</span>
                          </td>
                          <td className="py-2.5 px-2 whitespace-nowrap">
                            <span className="mr-1.5 text-base">{ev.country ? countryCodeToFlag(ev.country) : '🌐'}</span>
                            <span className="text-[var(--highlight-ink)] font-medium">{ev.countryName || ev.country || 'Unknown'}</span>
                            {ev.city && (
                              <span className="text-[var(--ink-mute)] ml-1 text-[11px]">({ev.city})</span>
                            )}
                          </td>
                          <td className="py-2.5 px-2">
                            {ev.isBot ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400">
                                бот: {ev.botName || 'Bot'}
                              </span>
                            ) : ev.isReturning ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                вернулся
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                новый
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-2 text-[var(--ink-soft)] whitespace-nowrap">
                            {ev.device} · {ev.browser} {ev.os ? `(${ev.os})` : ''}
                          </td>
                          <td className="py-2.5 px-2 font-mono text-[11px] text-[var(--ink-mute)] truncate max-w-[200px]">
                            {ev.referrer || 'direct'}
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </section>

          {/* 4. Behavior & Conversion Funnel */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* 4.1 Behavior & Modes */}
            <div className="p-5 rounded-2xl border border-[var(--line)] bg-[var(--bg)] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-serif text-base font-medium text-[var(--highlight-ink)] lowercase flex items-center gap-1.5">
                    <Gamepad2 size={16} />
                    <span>режимы игры</span>
                  </h3>
                  <span className="text-xs text-[var(--ink-soft)] font-mono">
                    {s.gameBehavior.totalStarts} стартов
                  </span>
                </div>

                <div className="space-y-2.5">
                  {Object.entries(s.gameBehavior.startsByMode).length === 0 ? (
                    <p className="text-xs text-[var(--ink-soft)] lowercase">нет данных о сыгранных партиях</p>
                  ) : (
                    Object.entries(s.gameBehavior.startsByMode).map(([mode, count]) => {
                      const pct = Math.round((count / (s.gameBehavior.totalStarts || 1)) * 100);
                      return (
                        <div key={mode} className="text-xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[var(--highlight-ink)] lowercase">{mode}</span>
                            <span className="text-[var(--ink-soft)] font-mono">
                              {count} ({pct}%)
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-[var(--line)] rounded-full overflow-hidden">
                            <div
                              style={{ width: `${pct}%` }}
                              className="h-full bg-[var(--highlight-ink)] rounded-full"
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Completion & Session Length */}
              <div className="pt-4 mt-4 border-t border-[var(--line)] grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[var(--ink-soft)] block lowercase">доходимость партий</span>
                  <span className="text-base font-serif font-medium text-[var(--highlight-ink)]">
                    {s.gameBehavior.completionRate}%
                  </span>
                  <span className="text-[10px] text-[var(--ink-mute)] block lowercase">
                    {s.gameBehavior.totalFinishes} завершено
                  </span>
                </div>
                <div>
                  <span className="text-[var(--ink-soft)] block lowercase">средняя сессия</span>
                  <span className="text-base font-serif font-medium text-[var(--highlight-ink)]">
                    {Math.floor(s.gameBehavior.averageSessionSeconds / 60)}m {s.gameBehavior.averageSessionSeconds % 60}s
                  </span>
                  <span className="text-[10px] text-[var(--ink-mute)] block lowercase">активного времени</span>
                </div>
              </div>
            </div>

            {/* 4.2 Conversion Funnel */}
            <div className="p-5 rounded-2xl border border-[var(--line)] bg-[var(--bg)] flex flex-col justify-between">
              <div>
                <h3 className="font-serif text-base font-medium text-[var(--highlight-ink)] lowercase flex items-center gap-1.5 mb-1">
                  <TrendingUp size={16} />
                  <span>воронка конверсии</span>
                </h3>
                <p className="text-xs text-[var(--ink-soft)] lowercase mb-4">
                  визит → старт игры → финиш → создание / шеринг
                </p>

                {(() => {
                  const f = s.funnel;
                  const v100 = Math.max(f.visits, 1);
                  const steps = [
                    { label: '1. Визит страницы', count: f.visits, pct: 100 },
                    { label: '2. Начало партии', count: f.gameStarts, pct: Math.round((f.gameStarts / v100) * 100) },
                    { label: '3. Завершение партии', count: f.gameFinishes, pct: Math.round((f.gameFinishes / v100) * 100) },
                    { label: '4. Шеринг / Создание комнаты', count: f.roomsOrShares, pct: Math.round((f.roomsOrShares / v100) * 100) },
                  ];

                  return (
                    <div className="space-y-3">
                      {steps.map((st) => (
                        <div key={st.label} className="text-xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[var(--highlight-ink)] lowercase">{st.label}</span>
                            <span className="text-[var(--ink-soft)] font-mono">
                              {st.count} ({st.pct}%)
                            </span>
                          </div>
                          <div className="h-2 w-full bg-[var(--line)] rounded-full overflow-hidden">
                            <div
                              style={{ width: `${Math.max(st.pct, 4)}%` }}
                              className="h-full bg-[var(--highlight-ink)] rounded-full transition-all"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              <div className="pt-3 mt-4 border-t border-[var(--line)] text-[11px] text-[var(--ink-soft)] lowercase">
                коэффициент виральности (шеринг на визит):{' '}
                <strong className="text-[var(--highlight-ink)] font-mono">
                  {Math.round((s.funnel.roomsOrShares / Math.max(s.funnel.visits, 1)) * 100)}%
                </strong>
              </div>
            </div>
          </section>

          {/* 5. Traffic Sources (Referrers) */}
          <section className="p-5 rounded-2xl border border-[var(--line)] bg-[var(--bg)] mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-serif text-base font-medium text-[var(--highlight-ink)] lowercase flex items-center gap-1.5">
                <Compass size={16} />
                <span>источники трафика (referrers)</span>
              </h3>
              <span className="text-xs text-[var(--ink-soft)] font-mono">
                reddit, search, direct, social
              </span>
            </div>

            {/* Categories Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
              {s.referrersCategorized.map((cat) => (
                <div key={cat.category} className="p-2 rounded-lg border border-[var(--line)] text-center">
                  <span className="text-[10px] text-[var(--ink-soft)] block uppercase tracking-wider">
                    {cat.category}
                  </span>
                  <span className="text-sm font-serif font-medium text-[var(--highlight-ink)]">
                    {cat.count}
                  </span>
                  <span className="text-[9px] text-[var(--ink-mute)] block">
                    {cat.percentage}%
                  </span>
                </div>
              ))}
            </div>

            {/* Detailed Referrer Domains */}
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {s.topReferrers.length === 0 ? (
                <p className="text-xs text-[var(--ink-soft)] lowercase">все визиты были прямыми (direct)</p>
              ) : (
                s.topReferrers.map((ref) => (
                  <div
                    key={ref.referrer}
                    className="flex items-center justify-between text-xs py-1 border-b border-[var(--line)]/40 last:border-none"
                  >
                    <span className="text-[var(--highlight-ink)] font-mono text-[11px] truncate max-w-[240px]">
                      {ref.referrer}
                    </span>
                    <span className="text-[var(--ink-soft)] font-mono text-[11px]">
                      {ref.count} виз.
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Bots & Crawlers Section */}
          <section className="p-5 rounded-2xl border border-[var(--line)] bg-[var(--bg)] mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Bot size={16} className="text-rose-500" />
                <h3 className="font-serif text-base font-medium text-[var(--highlight-ink)] lowercase">
                  боты и краулеры ({s.humansVsBots.botVisits} запросов · {s.humansVsBots.botPercentage}% трафика)
                </h3>
              </div>
              <span className="text-[11px] text-[var(--ink-mute)] lowercase">
                исключены из человеческой статистики
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {s.botBreakdown.length === 0 ? (
                <p className="text-xs text-[var(--ink-soft)] lowercase col-span-full">
                  ботов в выбранный период не зафиксировано
                </p>
              ) : (
                s.botBreakdown.map((b) => (
                  <div
                    key={b.name}
                    className="p-2.5 rounded-xl border border-[var(--line)] bg-rose-500/5 dark:bg-rose-500/10 flex flex-col justify-between"
                  >
                    <span className="text-[11px] font-medium text-[var(--highlight-ink)] truncate" title={b.name}>
                      {b.name}
                    </span>
                    <span className="text-xs font-mono text-rose-600 dark:text-rose-400 font-semibold mt-1">
                      {b.count} hits
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Live Recent Events Stream */}
          <section className="p-5 rounded-2xl border border-[var(--line)] bg-[var(--bg)]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-emerald-500" />
                <h3 className="font-serif text-base font-medium text-[var(--highlight-ink)] lowercase">
                  live stream · последние события платформы
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`text-[11px] px-2 py-0.5 rounded cursor-pointer transition-colors ${
                    autoRefresh ? 'bg-emerald-500/10 text-emerald-600' : 'text-[var(--ink-mute)]'
                  }`}
                >
                  {autoRefresh ? 'auto-refresh on' : 'auto-refresh off'}
                </button>
                {lastRefreshedAt && (
                  <span className="text-[10px] text-[var(--ink-mute)]">обновлено {lastRefreshedAt}</span>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--line)] text-[var(--ink-soft)] uppercase text-[10px] tracking-wider">
                    <th className="py-2 px-2">время</th>
                    <th className="py-2 px-2">тип / таргет</th>
                    <th className="py-2 px-2">посетитель</th>
                    <th className="py-2 px-2">страна</th>
                    <th className="py-2 px-2">устройство / браузер</th>
                    <th className="py-2 px-2">свойства</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]/50">
                  {s.recentEvents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-[var(--ink-mute)] lowercase">
                        событий пока нет · они появятся в реальном времени при действиях пользователей
                      </td>
                    </tr>
                  ) : (
                    s.recentEvents.slice(0, 30).map((ev) => {
                    const timeAgoSec = Math.round((Date.now() - ev.timestamp) / 1000);
                    const timeStr =
                      timeAgoSec < 60
                        ? `${timeAgoSec}s ago`
                        : timeAgoSec < 3600
                        ? `${Math.round(timeAgoSec / 60)}m ago`
                        : `${Math.round(timeAgoSec / 3600)}h ago`;

                    return (
                      <tr key={ev.id} className="hover:bg-[var(--line)]/20 transition-colors">
                        <td className="py-2 px-2 text-[var(--ink-mute)] font-mono whitespace-nowrap">
                          {timeStr}
                        </td>
                        <td className="py-2 px-2">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-1.5 py-0.2 rounded text-[9px] uppercase font-mono font-medium ${
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
                              {ev.target}
                            </span>
                          </div>
                        </td>
                        <td className="py-2 px-2 font-mono text-[11px] text-[var(--ink-soft)]">
                          {ev.isBot ? (
                            <span className="text-rose-500 font-semibold">{ev.botName || 'Bot'}</span>
                          ) : (
                            <span title={ev.visitorId}>
                              {ev.visitorId.slice(0, 10)}… {ev.isReturning && '(возвр)'}
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-2 whitespace-nowrap">
                          <span className="mr-1">{ev.country ? countryCodeToFlag(ev.country) : '🌐'}</span>
                          <span className="text-[var(--highlight-ink)]">{ev.countryName || ev.country}</span>
                        </td>
                        <td className="py-2 px-2 text-[var(--ink-soft)] whitespace-nowrap">
                          {ev.device} · {ev.browser}
                        </td>
                        <td className="py-2 px-2 text-[10px] font-mono text-[var(--ink-mute)] truncate max-w-[200px]">
                          {ev.metadata ? JSON.stringify(ev.metadata) : '-'}
                        </td>
                      </tr>
                    );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
