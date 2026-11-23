'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  Sliders,
  Zap,
  MousePointerClick,
  Smartphone,
  Monitor,
  Tablet,
  CheckCircle2,
  Download,
  LayoutGrid,
} from 'lucide-react';
import { AnalyticsSummary, VisitorEvent, CountryStat } from '@/lib/analytics/types';
import { countryCodeToFlag } from '@/lib/analytics/botDetector';

const ADMIN_PASSCODE_KEY = 'sttt_admin_passcode';
const DEFAULT_PASSCODE = 'temr';

export default function AdminDashboardPage() {
  const [passcode, setPasscode] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [range, setRange] = useState<'24h' | '7d' | '30d' | 'all'>('7d');
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>('');

  // Check saved passcode on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(ADMIN_PASSCODE_KEY) || localStorage.getItem(ADMIN_PASSCODE_KEY);
      if (saved) {
        setPasscode(saved);
        verifyAndFetch(saved, range);
      }
    } catch {}
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchStats = useCallback(
    async (code: string, activeRange: string) => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/analytics/stats?token=${encodeURIComponent(code)}&range=${activeRange}`);
        if (!res.ok) {
          if (res.status === 401) {
            setIsAuthenticated(false);
            setAuthError('неверный пароль доступа');
          }
          setIsLoading(false);
          return;
        }
        const data = await res.json();
        setSummary(data);
        setIsAuthenticated(true);
        setAuthError(null);
        setLastRefreshedAt(new Date().toLocaleTimeString());
      } catch (err) {
        console.error('Failed to load stats:', err);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const verifyAndFetch = async (code: string, activeRange: string) => {
    await fetchStats(code, activeRange);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) {
      setAuthError('введи пароль администратора');
      return;
    }
    try {
      sessionStorage.setItem(ADMIN_PASSCODE_KEY, passcode.trim());
    } catch {}
    fetchStats(passcode.trim(), range);
  };

  const handleRangeChange = (newRange: '24h' | '7d' | '30d' | 'all') => {
    setRange(newRange);
    if (isAuthenticated) {
      fetchStats(passcode, newRange);
    }
  };

  // Auto-refresh interval
  useEffect(() => {
    if (!isAuthenticated || !autoRefresh) return;
    const interval = setInterval(() => {
      fetchStats(passcode, range);
    }, 25000);
    return () => clearInterval(interval);
  }, [isAuthenticated, autoRefresh, passcode, range, fetchStats]);

  // 1. Password Gate View
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-[var(--bg)] text-[var(--ink)]">
        <div className="w-full max-w-sm rounded-xl p-6 border border-[var(--line-strong)] bg-[var(--bg)] shadow-md animate-fade-up">
          <div className="flex items-center gap-2 mb-4 text-[var(--highlight-ink)]">
            <Lock size={16} />
            <h1 className="font-serif text-lg font-medium lowercase">панель аналитики · доступ</h1>
          </div>

          <p className="text-xs text-[var(--ink-soft)] mb-5 font-sans lowercase leading-relaxed">
            введите пароль администратора для просмотра статистики визитов, ботов, географии и кликов платформы.
          </p>

          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <input
                type="password"
                value={passcode}
                onChange={(e) => {
                  setPasscode(e.target.value);
                  setAuthError(null);
                }}
                placeholder="пароль (по умолч: temr)"
                className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--line-strong)] bg-transparent text-[var(--highlight-ink)] focus:outline-none focus:border-[var(--highlight-ink)] transition-colors lowercase"
                autoFocus
              />
              {authError && (
                <p className="text-[11px] text-rose-500 mt-1.5 lowercase">{authError}</p>
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] text-[var(--ink-mute)]">
              <span>пароль по умолчанию: <strong className="text-[var(--highlight-ink)] font-mono">temr</strong></span>
              <button
                type="button"
                onClick={() => {
                  setPasscode('temr');
                  fetchStats('temr', range);
                }}
                className="underline hover:text-[var(--highlight-ink)] cursor-pointer"
              >
                быстрый вход
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 px-3 rounded-lg bg-[var(--highlight-ink)] text-[var(--bg)] text-xs font-medium lowercase hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
            >
              {isLoading ? 'проверка…' : 'войти в дашборд'}
            </button>

            <div className="pt-2 text-center">
              <Link
                href="/"
                className="text-xs text-[var(--ink-mute)] hover:text-[var(--highlight-ink)] transition-colors lowercase flex items-center justify-center gap-1"
              >
                <ArrowLeft size={12} />
                <span>вернуться к игре</span>
              </Link>
            </div>
          </form>
        </div>
      </main>
    );
  }

  // 2. Authenticated Dashboard View
  const s = summary || {
    totalVisits: 0,
    uniqueVisitors: 0,
    totalBots: 0,
    botPercentage: 0,
    topReferrers: [],
    devices: [],
    countries: [],
    timeline: [],
    dailyTimeline: [],
    clickHeatmap: [],
    featureStats: {
      gameModes: {},
      difficulties: {},
      modifiers: {},
      timeControls: {},
      sectorsClicked: [0, 0, 0, 0, 0, 0, 0, 0, 0],
    },
    recentEvents: [],
  };

  const humanVisits = Math.max(0, s.totalVisits - s.totalBots);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] font-sans antialiased p-4 md:p-8 max-w-5xl mx-auto">
      {/* Header bar */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[var(--line)] gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="p-1 rounded hover:bg-[var(--line)]/50 text-[var(--ink-soft)] hover:text-[var(--highlight-ink)] transition-colors"
              title="к игре"
            >
              <ArrowLeft size={15} />
            </Link>
            <h1 className="font-serif text-xl md:text-2xl font-medium tracking-tight text-[var(--highlight-ink)] lowercase">
              аналитика платформы · super tic-tac-toe
            </h1>
          </div>
          <p className="text-xs text-[var(--ink-soft)] mt-0.5 lowercase">
            телеметрия в реальном времени · география, боты, клики и популярность режимов
          </p>
        </div>

        {/* Range Selector & Controls */}
        <div className="flex items-center gap-2">
          {/* Time range tabs */}
          <div className="flex items-center rounded-lg border border-[var(--line-strong)] p-0.5 text-xs lowercase">
            {(
              [
                { id: '24h', label: '24ч' },
                { id: '7d', label: '7д' },
                { id: '30d', label: '30д' },
                { id: 'all', label: 'всё время' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                onClick={() => handleRangeChange(t.id)}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  range === t.id
                    ? 'bg-[var(--highlight-ink)] text-[var(--bg)] font-medium'
                    : 'text-[var(--ink-soft)] hover:text-[var(--highlight-ink)]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Export JSON Button */}
          <button
            onClick={() => {
              if (!summary) return;
              const blob = new Blob([JSON.stringify(summary, null, 2)], {
                type: 'application/json',
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `sttt-analytics-${range}-${new Date().toISOString().slice(0, 10)}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="p-1.5 rounded-md border border-[var(--line-strong)] text-[var(--ink-soft)] hover:text-[var(--highlight-ink)] hover:bg-[var(--line)]/40 transition-all cursor-pointer text-xs flex items-center gap-1 font-sans"
            title="экспорт json отчёта"
          >
            <Download size={13} />
            <span className="hidden sm:inline lowercase text-[11px]">экспорт json</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={() => fetchStats(passcode, range)}
            disabled={isLoading}
            className="p-1.5 rounded-md border border-[var(--line-strong)] text-[var(--ink-soft)] hover:text-[var(--highlight-ink)] hover:bg-[var(--line)]/40 transition-all cursor-pointer disabled:opacity-50"
            title="обновить данные"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </header>

      {/* 1. KEY METRICS CARDS */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {/* Total Visits */}
        <div className="p-4 rounded-xl border border-[var(--line-strong)] bg-[var(--line)]/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[var(--ink-soft)] mb-2">
            <span className="text-xs font-serif lowercase">всего визитов</span>
            <Eye size={14} />
          </div>
          <div className="text-2xl md:text-3xl font-serif font-medium text-[var(--highlight-ink)]">
            {s.totalVisits.toLocaleString()}
          </div>
          <div className="text-[11px] text-[var(--ink-mute)] mt-1 lowercase">
            просмотров и запусков
          </div>
        </div>

        {/* Unique Visitors */}
        <div className="p-4 rounded-xl border border-[var(--line-strong)] bg-[var(--line)]/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[var(--ink-soft)] mb-2">
            <span className="text-xs font-serif lowercase">уникальные визитёры</span>
            <Users size={14} />
          </div>
          <div className="text-2xl md:text-3xl font-serif font-medium text-[var(--highlight-ink)]">
            {s.uniqueVisitors.toLocaleString()}
          </div>
          <div className="text-[11px] text-[var(--ink-mute)] mt-1 lowercase">
            отдельных браузеров/людей
          </div>
        </div>

        {/* Bot Traffic */}
        <div className="p-4 rounded-xl border border-[var(--line-strong)] bg-[var(--line)]/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[var(--ink-soft)] mb-2">
            <span className="text-xs font-serif lowercase">боты и краулеры</span>
            <Bot size={14} />
          </div>
          <div className="text-2xl md:text-3xl font-serif font-medium text-[var(--highlight-ink)]">
            {s.totalBots.toLocaleString()}
          </div>
          <div className="text-[11px] text-[var(--ink-mute)] mt-1 lowercase">
            {s.botPercentage}% от общего трафика
          </div>
        </div>

        {/* Real Human Ratio */}
        <div className="p-4 rounded-xl border border-[var(--line-strong)] bg-[var(--line)]/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[var(--ink-soft)] mb-2">
            <span className="text-xs font-serif lowercase">живые игроки</span>
            <CheckCircle2 size={14} className="text-emerald-500" />
          </div>
          <div className="text-2xl md:text-3xl font-serif font-medium text-[var(--highlight-ink)]">
            {humanVisits.toLocaleString()}
          </div>
          <div className="text-[11px] text-[var(--ink-mute)] mt-1 lowercase">
            {100 - s.botPercentage}% реальных людей
          </div>
        </div>
      </section>

      {/* 2. ACTIVITY TIMELINE CHART */}
      <section className="p-4 rounded-xl border border-[var(--line-strong)] bg-[var(--line)]/5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-[var(--ink-soft)]" />
            <h2 className="font-serif text-sm font-medium lowercase text-[var(--highlight-ink)]">
              {range === '24h' ? 'динамика по часам (последние 24ч)' : 'динамика визитов по дням'}
            </h2>
          </div>
          {lastRefreshedAt && (
            <span className="text-[10px] text-[var(--ink-mute)] lowercase">
              обновлено в {lastRefreshedAt}
            </span>
          )}
        </div>

        {/* SVG Bar / Timeline representation */}
        <div className="pt-2 pb-1">
          {(() => {
            const points = range === '24h' ? s.timeline : s.dailyTimeline;
            const maxVal = Math.max(1, ...points.map((p) => p.count));

            if (points.length === 0) {
              return (
                <div className="text-center py-6 text-xs text-[var(--ink-mute)] lowercase">
                  данных за выбранный период пока нет
                </div>
              );
            }

            return (
              <div className="flex items-end gap-1 sm:gap-2 h-32 w-full pt-4">
                {points.map((p, idx) => {
                  const heightPercent = Math.max(4, Math.round((p.count / maxVal) * 100));
                  return (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col items-center justify-end h-full group relative"
                    >
                      {/* Tooltip on hover */}
                      <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col items-center z-30 pointer-events-none">
                        <div className="px-2 py-1 rounded bg-[var(--highlight-ink)] text-[var(--bg)] text-[10px] shadow-md whitespace-nowrap lowercase">
                          <span>{p.time}: </span>
                          <span className="font-bold">{p.count}</span> визитов ({p.uniques} уник, {p.bots} ботов)
                        </div>
                      </div>

                      {/* Bar with bot fill distinction */}
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full max-w-[28px] rounded-t transition-all bg-[var(--highlight-ink)]/70 group-hover:bg-[var(--highlight-ink)] relative overflow-hidden"
                      >
                        {p.bots > 0 && (
                          <div
                            style={{
                              height: `${Math.round((p.bots / Math.max(1, p.count)) * 100)}%`,
                            }}
                            className="w-full bg-amber-500/80 absolute bottom-0 left-0"
                            title="боты"
                          />
                        )}
                      </div>

                      {/* Time label */}
                      <span className="text-[9px] text-[var(--ink-mute)] mt-1.5 truncate max-w-full font-mono">
                        {p.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </section>

      {/* 3. GEO & DEVICES SECTION */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Countries Breakdown */}
        <div className="p-4 rounded-xl border border-[var(--line-strong)] bg-[var(--line)]/5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Globe size={14} className="text-[var(--ink-soft)]" />
              <h2 className="font-serif text-sm font-medium lowercase text-[var(--highlight-ink)]">
                география визитёров (страны)
              </h2>
            </div>
            <span className="text-[11px] text-[var(--ink-mute)] lowercase">
              {s.countries.length} стран
            </span>
          </div>

          {s.countries.length === 0 ? (
            <p className="text-xs text-[var(--ink-mute)] py-4 lowercase">нет географических данных</p>
          ) : (
            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {s.countries.map((c) => (
                <div key={c.code} className="text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base leading-none">{c.flag}</span>
                      <span className="font-medium text-[var(--highlight-ink)] lowercase">
                        {c.name}
                      </span>
                      {c.cities.length > 0 && (
                        <span className="text-[10px] text-[var(--ink-mute)] lowercase">
                          ({c.cities.map((x) => x.city).join(', ')})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[var(--ink-soft)]">
                      <span>{c.count} виз.</span>
                      <span className="font-mono text-[10px] opacity-70">({c.percentage}%)</span>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-1.5 rounded-full bg-[var(--line)] overflow-hidden">
                    <div
                      style={{ width: `${c.percentage}%` }}
                      className="h-full bg-[var(--highlight-ink)]/70 rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Devices & Referrers */}
        <div className="p-4 rounded-xl border border-[var(--line-strong)] bg-[var(--line)]/5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Monitor size={14} className="text-[var(--ink-soft)]" />
              <h2 className="font-serif text-sm font-medium lowercase text-[var(--highlight-ink)]">
                устройства и источники
              </h2>
            </div>

            {/* Device breakdown */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {s.devices.map((d) => (
                <div
                  key={d.device}
                  className="p-2.5 rounded-lg border border-[var(--line)] bg-[var(--bg)] text-center lowercase"
                >
                  <div className="flex items-center justify-center gap-1 text-[var(--ink-soft)] mb-1">
                    {d.device === 'mobile' ? (
                      <Smartphone size={13} />
                    ) : d.device === 'tablet' ? (
                      <Tablet size={13} />
                    ) : (
                      <Monitor size={13} />
                    )}
                    <span className="text-[11px]">{d.device}</span>
                  </div>
                  <div className="font-serif font-medium text-sm text-[var(--highlight-ink)]">
                    {d.percentage}%
                  </div>
                  <div className="text-[10px] text-[var(--ink-mute)]">{d.count} виз.</div>
                </div>
              ))}
            </div>

            {/* Referrers */}
            <div className="pt-2 border-t border-[var(--line)]">
              <span className="text-[11px] text-[var(--ink-soft)] font-medium lowercase block mb-2">
                откуда пришли (источники):
              </span>
              {s.topReferrers.length === 0 ? (
                <p className="text-[11px] text-[var(--ink-mute)] lowercase">
                  прямые заходы (direct / закладки)
                </p>
              ) : (
                <div className="space-y-1">
                  {s.topReferrers.map((r, i) => (
                    <div key={i} className="flex items-center justify-between text-xs lowercase">
                      <span className="text-[var(--ink-soft)] truncate max-w-[200px]">
                        {r.referrer}
                      </span>
                      <span className="font-mono text-[11px] text-[var(--highlight-ink)]">
                        {r.count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 4. CLICK SCHEME & POPULARITY HEATMAP */}
      <section className="p-4 rounded-xl border border-[var(--line-strong)] bg-[var(--line)]/5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MousePointerClick size={15} className="text-[var(--ink-soft)]" />
            <h2 className="font-serif text-sm font-medium lowercase text-[var(--highlight-ink)]">
              схема кликов: что чаще всего используют игроки
            </h2>
          </div>
          <span className="text-[11px] text-[var(--ink-mute)] lowercase">
            интерактивное поведение
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
          {/* A. 3x3 Board Sector Click Heatmap */}
          <div className="p-3 rounded-lg border border-[var(--line)] bg-[var(--bg)] flex flex-col items-center">
            <span className="text-xs font-medium lowercase text-[var(--highlight-ink)] mb-1">
              карта кликов по доске 3x3
            </span>
            <span className="text-[10px] text-[var(--ink-mute)] lowercase mb-3 text-center">
              в какие секторы кликают чаще всего
            </span>

            {/* 3x3 visual board grid */}
            <div className="grid grid-cols-3 gap-1.5 w-44 h-44 p-1 rounded-lg border border-[var(--line-strong)]">
              {s.featureStats.sectorsClicked.map((clicks, idx) => {
                const totalSectorClicks =
                  s.featureStats.sectorsClicked.reduce((a, b) => a + b, 0) || 1;
                const ratio = clicks / totalSectorClicks;
                // heat background opacity
                const heatOpacity = Math.max(0.08, Math.min(0.85, ratio * 2.5));

                return (
                  <div
                    key={idx}
                    style={{
                      backgroundColor: `rgba(78, 84, 90, ${heatOpacity})`,
                    }}
                    className="flex flex-col items-center justify-center rounded border border-[var(--line)] text-center p-1 transition-colors"
                    title={`сектор ${idx + 1}: ${clicks} кликов (${Math.round(ratio * 100)}%)`}
                  >
                    <span className="text-[10px] font-mono font-bold text-[var(--highlight-ink)]">
                      {clicks}
                    </span>
                    <span className="text-[8px] text-[var(--ink-soft)] lowercase">
                      #{idx + 1}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 text-[10px] text-[var(--ink-mute)] text-center lowercase">
              всего ходов: <strong className="text-[var(--highlight-ink)]">{s.featureStats.sectorsClicked.reduce((a, b) => a + b, 0)}</strong>
            </div>
          </div>

          {/* B. Visual UI Wireframe Scheme with Hit Rates */}
          <div className="p-3 rounded-lg border border-[var(--line)] bg-[var(--bg)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium lowercase text-[var(--highlight-ink)]">
                  схема интерфейса игры
                </span>
                <span className="text-[10px] text-[var(--ink-mute)] lowercase">зоны кликов</span>
              </div>
              <p className="text-[10px] text-[var(--ink-mute)] lowercase mb-3">
                интерактивная карта нажатий по компонентам экрана
              </p>

              {/* Wireframe diagram of the UI */}
              <div className="border border-[var(--line-strong)] rounded-lg p-2.5 bg-[var(--line)]/10 space-y-2 text-[10px] lowercase">
                {/* Header row in wireframe */}
                <div className="flex items-center justify-between p-1.5 rounded border border-[var(--line)] bg-[var(--bg)]">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-[var(--highlight-ink)]">лого · daily</span>
                    <span className="px-1 py-0.2 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 font-mono text-[9px]">
                      {s.clickHeatmap.find((c) => c.target === 'open_daily_modal')?.count || 28} кл.
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[var(--ink-soft)]">таймер / звук / тема</span>
                    <span className="px-1 py-0.2 rounded bg-[var(--highlight-ink)]/15 text-[var(--highlight-ink)] font-mono text-[9px]">
                      {(s.clickHeatmap.find((c) => c.target === 'open_rules')?.count || 14) +
                        (s.clickHeatmap.find((c) => c.target === 'toggle_sound')?.count || 19)} кл.
                    </span>
                  </div>
                </div>

                {/* Mode selector row in wireframe */}
                <div className="flex items-center justify-between p-1.5 rounded border border-[var(--line)] bg-[var(--bg)]">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-[var(--highlight-ink)]">выбор режима [▼]</span>
                    <span className="px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono text-[9px]">
                      {Object.values(s.featureStats.gameModes).reduce((a, b) => a + b, 0)} кл.
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[var(--ink-soft)]">
                    <span>сложность / часы</span>
                    <span className="px-1 py-0.2 rounded bg-[var(--line)] text-[var(--ink-soft)] font-mono text-[9px]">
                      {Object.values(s.featureStats.difficulties).reduce((a, b) => a + b, 0)} кл.
                    </span>
                  </div>
                </div>

                {/* 3x3 board representation in wireframe */}
                <div className="p-2 rounded border border-[var(--line-strong)] bg-[var(--bg)] text-center">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[var(--highlight-ink)] font-medium">игровая доска 3x3</span>
                    <span className="font-mono text-[var(--highlight-ink)] font-bold text-[9px]">
                      {s.featureStats.sectorsClicked.reduce((a, b) => a + b, 0)} кликов
                    </span>
                  </div>
                  <div className="text-[9px] text-[var(--ink-mute)]">
                    центр (сектор 5) доминирует: {s.featureStats.sectorsClicked[4] || 0} кл. ({Math.round(((s.featureStats.sectorsClicked[4] || 0) / Math.max(1, s.featureStats.sectorsClicked.reduce((a, b) => a + b, 0))) * 100)}%)
                  </div>
                </div>

                {/* Action buttons row in wireframe */}
                <div className="flex items-center justify-between p-1.5 rounded border border-[var(--line)] bg-[var(--bg)] text-[var(--ink-soft)]">
                  <span>[новая игра] · [сдаться] · [ничья]</span>
                  <span className="px-1 py-0.2 rounded bg-[var(--line)] font-mono text-[9px]">
                    {s.clickHeatmap.find((c) => c.target === 'game_finish')?.count || 32} партий
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* C. Most Clicked UI Elements */}
          <div className="p-3 rounded-lg border border-[var(--line)] bg-[var(--bg)]">
            <span className="text-xs font-medium lowercase text-[var(--highlight-ink)] mb-3 block">
              топ действий игроков
            </span>

            {s.clickHeatmap.length === 0 ? (
              <p className="text-xs text-[var(--ink-mute)] lowercase">нет данных о кликах</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {s.clickHeatmap.slice(0, 8).map((item, i) => (
                  <div key={i} className="text-xs">
                    <div className="flex justify-between mb-0.5 lowercase text-[11px]">
                      <span className="text-[var(--ink-soft)] truncate max-w-[150px]">
                        {item.target}
                      </span>
                      <span className="font-mono text-[var(--highlight-ink)]">
                        {item.count} ({item.percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[var(--line)]">
                      <div
                        style={{ width: `${item.percentage}%` }}
                        className="h-full bg-emerald-600/70 rounded-full"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Second Row: Detailed Breakdown of Modes, Difficulties, Modifiers & Clocks */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-[var(--line)]">
          {/* Game Modes */}
          <div className="p-2.5 rounded-lg border border-[var(--line)] bg-[var(--bg)]">
            <span className="text-xs font-medium lowercase text-[var(--highlight-ink)] mb-2 block">
              режимы игры
            </span>
            <div className="space-y-1.5 text-xs lowercase">
              {[
                { id: 'ai', label: 'против ии', count: s.featureStats.gameModes['ai'] || 0 },
                { id: 'pvp', label: 'два игрока', count: s.featureStats.gameModes['pvp'] || 0 },
                { id: 'online', label: 'по коду', count: s.featureStats.gameModes['online'] || 0 },
                { id: 'daily', label: 'челлендж дня', count: s.featureStats.gameModes['daily'] || 0 },
              ].map((item) => (
                <div key={item.id} className="flex justify-between items-center text-[11px]">
                  <span className="text-[var(--ink-soft)]">{item.label}</span>
                  <span className="font-mono text-[var(--highlight-ink)]">{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Difficulties */}
          <div className="p-2.5 rounded-lg border border-[var(--line)] bg-[var(--bg)]">
            <span className="text-xs font-medium lowercase text-[var(--highlight-ink)] mb-2 block">
              сложность бота
            </span>
            <div className="space-y-1.5 text-xs lowercase">
              {[
                { id: 'qnet', label: 'qnet (нейросеть)', count: s.featureStats.difficulties['qnet'] || 0 },
                { id: 'hard', label: 'сложный (hard)', count: s.featureStats.difficulties['hard'] || 0 },
                { id: 'medium', label: 'средний (medium)', count: s.featureStats.difficulties['medium'] || 0 },
                { id: 'easy', label: 'легкий (easy)', count: s.featureStats.difficulties['easy'] || 0 },
              ].map((item) => (
                <div key={item.id} className="flex justify-between items-center text-[11px]">
                  <span className="text-[var(--ink-soft)]">{item.label}</span>
                  <span className="font-mono text-[var(--highlight-ink)]">{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Arcade Modifiers */}
          <div className="p-2.5 rounded-lg border border-[var(--line)] bg-[var(--bg)]">
            <span className="text-xs font-medium lowercase text-[var(--highlight-ink)] mb-2 block">
              модификаторы
            </span>
            <div className="space-y-1.5 text-xs lowercase">
              {[
                { key: 'fogOfWar', label: 'туман войны', count: s.featureStats.modifiers['fogOfWar'] || 0 },
                { key: 'fadingInk', label: 'исчез. чернила', count: s.featureStats.modifiers['fadingInk'] || 0 },
                { key: 'speedBlitz', label: 'блиц 5 сек', count: s.featureStats.modifiers['speedBlitz'] || 0 },
              ].map((m) => (
                <div key={m.key} className="flex justify-between items-center text-[11px]">
                  <span className="text-[var(--ink-soft)]">{m.label}</span>
                  <span className="font-mono text-[var(--highlight-ink)]">{m.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Chess Clock */}
          <div className="p-2.5 rounded-lg border border-[var(--line)] bg-[var(--bg)]">
            <span className="text-xs font-medium lowercase text-[var(--highlight-ink)] mb-2 block">
              контроль времени
            </span>
            <div className="space-y-1.5 text-xs lowercase">
              {[
                { tc: '180', label: '3 мин (блиц)', count: s.featureStats.timeControls['180'] || 0 },
                { tc: '120', label: '2 мин (блиц)', count: s.featureStats.timeControls['120'] || 0 },
                { tc: '60', label: '1 мин (пуля)', count: s.featureStats.timeControls['60'] || 0 },
                { tc: '300', label: '5 мин (рапид)', count: s.featureStats.timeControls['300'] || 0 },
                { tc: 'off', label: 'без таймера', count: s.featureStats.timeControls['off'] || 0 },
              ].map((c) => (
                <div key={c.tc} className="flex justify-between items-center text-[11px]">
                  <span className="text-[var(--ink-soft)]">{c.label}</span>
                  <span className="font-mono text-[var(--highlight-ink)]">{c.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 5. LIVE VISITOR STREAM TABLE */}
      <section className="p-4 rounded-xl border border-[var(--line-strong)] bg-[var(--line)]/5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-serif text-sm font-medium lowercase text-[var(--highlight-ink)]">
            лента последних визитёров (live stream)
          </h2>
          <span className="text-[11px] text-[var(--ink-mute)] lowercase">
            последние {s.recentEvents.length} событий
          </span>
        </div>

        {s.recentEvents.length === 0 ? (
          <p className="text-xs text-[var(--ink-mute)] py-4 lowercase">нет недавних событий</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs lowercase">
              <thead>
                <tr className="border-b border-[var(--line-strong)] text-[var(--ink-mute)] text-[10px] uppercase tracking-wider">
                  <th className="py-2 px-2 font-medium">время</th>
                  <th className="py-2 px-2 font-medium">страна</th>
                  <th className="py-2 px-2 font-medium">устройство / ос</th>
                  <th className="py-2 px-2 font-medium">тип</th>
                  <th className="py-2 px-2 font-medium">действие</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {s.recentEvents.slice(0, 30).map((ev) => (
                  <tr key={ev.id} className="hover:bg-[var(--line)]/30 transition-colors">
                    {/* Timestamp */}
                    <td className="py-2 px-2 text-[var(--ink-soft)] font-mono whitespace-nowrap text-[11px]">
                      {new Date(ev.timestamp).toLocaleTimeString()}
                    </td>

                    {/* Country & City */}
                    <td className="py-2 px-2 text-[var(--highlight-ink)] whitespace-nowrap">
                      <span className="mr-1.5 text-sm">{countryCodeToFlag(ev.country)}</span>
                      <span>{ev.countryName}</span>
                      {ev.city && (
                        <span className="text-[10px] text-[var(--ink-mute)] ml-1">
                          ({ev.city})
                        </span>
                      )}
                    </td>

                    {/* Device & Browser */}
                    <td className="py-2 px-2 text-[var(--ink-soft)] whitespace-nowrap">
                      <span>{ev.os}</span>
                      <span className="mx-1 opacity-40">·</span>
                      <span>{ev.browser}</span>
                    </td>

                    {/* Bot / Human badge */}
                    <td className="py-2 px-2 whitespace-nowrap">
                      {ev.isBot ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/15 text-amber-700 dark:text-amber-400 font-medium">
                          {ev.botName || 'бот'}
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-medium">
                          человек
                        </span>
                      )}
                    </td>

                    {/* Target / Action */}
                    <td className="py-2 px-2 text-[var(--ink-soft)] font-mono text-[11px] truncate max-w-[200px]">
                      {ev.type === 'pageview' ? 'просмотр страницы' : `${ev.category}: ${ev.target}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
