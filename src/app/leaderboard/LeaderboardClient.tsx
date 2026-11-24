'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Trophy,
  RefreshCw,
  Sun,
  Moon,
  Globe,
  Award,
  Sparkles,
  HelpCircle,
  ShieldAlert,
} from 'lucide-react';
import { LeaderboardEntry, LeaderboardResponse } from '@/lib/elo/types';
import { getOrCreatePlayerId } from '@/hooks/useElo';
import { generateRandomNickname, sanitizeNickname } from '@/lib/nickname';
import { useTranslation } from '@/i18n/LanguageContext';

export function LeaderboardClient() {
  const { t, language, setLanguage } = useTranslation();
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'top' | 'provisional'>('top');
  const [playerId, setPlayerId] = useState<string>('');

  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem('ttt_theme', next ? 'dark' : 'light');
    } catch {}
  };

  const toggleLanguage = () => {
    setLanguage(language === 'ru' ? 'en' : 'ru');
  };

  const isRu = language === 'ru';

  const fetchLeaderboard = useCallback(async (pid?: string) => {
    setIsLoading(true);
    try {
      const idParam = pid || getOrCreatePlayerId();
      const res = await fetch(
        `/api/elo/leaderboard?limit=100&playerId=${encodeURIComponent(idParam)}`,
        { cache: 'no-store' }
      );
      if (res.ok) {
        const json: LeaderboardResponse = await res.json();
        setData(json);
      }
    } catch (err) {
      console.warn('Failed to load leaderboard:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const pid = getOrCreatePlayerId();
    setPlayerId(pid);

    let localNick = '';
    try {
      const stored = localStorage.getItem('ttt_nickname');
      if (stored) {
        localNick = sanitizeNickname(stored);
      } else {
        localNick = generateRandomNickname();
        localStorage.setItem('ttt_nickname', localNick);
      }
    } catch {
      localNick = generateRandomNickname();
    }

    // Ensure profile exists and matches client nickname before reading leaderboard
    fetch(
      `/api/elo/profile?playerId=${encodeURIComponent(pid)}&nickname=${encodeURIComponent(localNick)}`,
      { cache: 'no-store' }
    )
      .then((res) => (res.ok ? res.json() : null))
      .then(async (prof) => {
        if (prof && prof.nickname !== localNick) {
          const syncRes = await fetch('/api/elo/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playerId: pid, nickname: localNick }),
            cache: 'no-store',
          });
          const syncJson = await syncRes.json().catch(() => ({ ok: false }));
          if (!syncJson?.ok && prof.nickname) {
            try {
              localStorage.setItem('ttt_nickname', prof.nickname);
            } catch {}
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        fetchLeaderboard(pid);
      });
  }, [fetchLeaderboard]);

  const currentPlayer = data?.currentPlayer;

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--ink)] font-sans antialiased p-4 sm:p-6 md:p-12 selection:bg-[var(--selection-bg)]">
      <div className="max-w-[720px] mx-auto animate-fade-up">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-[var(--line)]">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-[var(--ink-soft)] hover:text-[var(--highlight-ink)] transition-colors lowercase border-b border-[var(--underline)] pb-0.5 cursor-pointer"
          >
            <ArrowLeft size={13} />
            <span>{isRu ? 'вернуться к игре' : 'play Tic³'}</span>
          </Link>

          <div className="flex items-center gap-2 text-xs">
            {/* Refresh */}
            <button
              type="button"
              onClick={() => fetchLeaderboard(playerId)}
              disabled={isLoading}
              className="p-1.5 rounded-md border border-[var(--line)] hover:border-[var(--line-strong)] text-[var(--ink-soft)] hover:text-[var(--highlight-ink)] transition-colors cursor-pointer"
              title={isRu ? 'обновить рейтинг' : 'refresh rankings'}
              aria-label="refresh"
            >
              <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            </button>

            {/* Language */}
            <button
              type="button"
              onClick={toggleLanguage}
              className="px-1.5 py-1 rounded-md border border-[var(--line)] hover:border-[var(--line-strong)] text-[var(--ink-soft)] hover:text-[var(--highlight-ink)] font-mono text-[11px] uppercase transition-colors cursor-pointer"
              title={isRu ? 'Switch to English' : 'Переключить на русский'}
            >
              {isRu ? 'EN' : 'RU'}
            </button>

            {/* Theme */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-1.5 rounded-md border border-[var(--line)] hover:border-[var(--line-strong)] text-[var(--ink-soft)] hover:text-[var(--highlight-ink)] transition-colors cursor-pointer"
              title={isDark ? (isRu ? 'светлая тема' : 'light theme') : isRu ? 'тёмная тема' : 'dark theme'}
            >
              {isDark ? <Sun size={13} /> : <Moon size={13} />}
            </button>
          </div>
        </div>

        {/* Header */}
        <header className="mb-6">
          <div className="flex items-center gap-2 mb-1.5 text-[var(--ink-mute)]">
            <Trophy size={16} className="text-amber-500" />
            <span className="text-[11px] uppercase tracking-widest font-mono">
              {isRu ? 'глобальный рейтинг' : 'global rankings'}
            </span>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-medium tracking-tight text-[var(--highlight-ink)] lowercase">
            {isRu ? 'таблица лидеров' : 'leaderboard'}
          </h1>
          <p className="text-xs sm:text-sm text-[var(--ink-soft)] mt-1.5 font-light lowercase">
            {isRu
              ? 'топ игроков Tic³ по системе Elo · K=32/40 · партии против ИИ и друзей'
              : 'top Tic³ players ranked by Elo · K=32/40 · rated vs AI and online friends'}
          </p>
        </header>

        {/* Current Player Status Banner */}
        {currentPlayer && (
          <div className="mb-6 p-4 rounded-xl border border-[var(--line-strong)] bg-[var(--active-board-bg)] shadow-xs animate-fade-up">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border border-[var(--line-strong)] bg-[var(--bg)] flex items-center justify-center font-serif text-base font-medium text-[var(--highlight-ink)] shrink-0">
                  {currentPlayer.rank ? `#${currentPlayer.rank}` : '?'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[var(--highlight-ink)]">
                      {currentPlayer.nickname}
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] uppercase font-mono font-medium bg-[var(--highlight-ink)] text-[var(--bg)]">
                      {isRu ? 'вы' : 'you'}
                    </span>
                    {currentPlayer.isProvisional && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] lowercase font-mono bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        {isRu ? 'калибровка' : 'provisional'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--ink-soft)] mt-0.5 lowercase font-mono">
                    {currentPlayer.games > 0
                      ? isRu
                        ? `${currentPlayer.wins} побед из ${currentPlayer.games} игр (${currentPlayer.winRate}%)`
                        : `${currentPlayer.wins} wins in ${currentPlayer.games} games (${currentPlayer.winRate}%)`
                      : isRu
                      ? 'сыграйте партию с ИИ или другом для первого рейтинга'
                      : 'play against AI or a friend to earn your first rating'}
                  </p>
                </div>
              </div>

              {/* Rating Big Stat */}
              <div className="sm:text-right shrink-0">
                <div className="text-2xl font-serif font-medium text-[var(--highlight-ink)]">
                  {currentPlayer.rating}{' '}
                  <span className="text-xs font-mono font-normal text-[var(--ink-mute)]">ELO</span>
                </div>
                <div className="text-[11px] text-[var(--ink-mute)] lowercase">
                  {currentPlayer.isProvisional
                    ? isRu
                      ? `осталось ${Math.max(0, 5 - currentPlayer.games)} игр до ранга`
                      : `${Math.max(0, 5 - currentPlayer.games)} games to official rank`
                    : isRu
                    ? `ранг #${currentPlayer.rank || '-'}`
                    : `rank #${currentPlayer.rank || '-'}`}
                </div>
              </div>
            </div>

            {/* Note on browser storage */}
            <div className="mt-3 pt-2.5 border-t border-[var(--line)]/50 flex items-center gap-1.5 text-[11px] text-[var(--ink-mute)] font-light lowercase">
              <ShieldAlert size={12} className="shrink-0 opacity-70" />
              <span>
                {isRu
                  ? 'рейтинг привязан к текущему устройству и браузеру. при очистке cookie доступ к профилю сбрасывается.'
                  : 'rating is tied to your browser. clearing browser cache or cookies resets this player rating.'}
              </span>
            </div>
          </div>
        )}

        {/* Tab Navigation (Top 100 vs Provisional) */}
        <div className="flex items-center justify-between mb-3 text-xs">
          <div className="flex items-center gap-1 p-0.5 rounded-lg border border-[var(--line)] bg-[var(--bg)]">
            <button
              type="button"
              onClick={() => setActiveTab('top')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer lowercase ${
                activeTab === 'top'
                  ? 'bg-[var(--highlight-ink)] text-[var(--bg)] font-medium shadow-xs'
                  : 'text-[var(--ink-soft)] hover:text-[var(--highlight-ink)]'
              }`}
            >
              {isRu ? 'топ-100' : 'top 100'} ({data?.topEntries.length || 0})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('provisional')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer lowercase ${
                activeTab === 'provisional'
                  ? 'bg-[var(--highlight-ink)] text-[var(--bg)] font-medium shadow-xs'
                  : 'text-[var(--ink-soft)] hover:text-[var(--highlight-ink)]'
              }`}
            >
              {isRu ? 'калибровка (< 5 игр)' : 'provisional (< 5)'} ({data?.provisionalEntries.length || 0})
            </button>
          </div>

          <span className="text-[11px] text-[var(--ink-mute)] font-mono hidden sm:inline lowercase">
            {data ? (isRu ? `${data.totalPlayers} игроков всего` : `${data.totalPlayers} total players`) : ''}
          </span>
        </div>

        {/* Table Container */}
        <div className="rounded-xl border border-[var(--line)] overflow-hidden bg-[var(--bg)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--line)] text-[var(--ink-soft)] uppercase text-[10px] tracking-wider bg-[var(--line)]/10 font-mono">
                  <th className="py-2.5 px-3 w-12 text-center">#</th>
                  <th className="py-2.5 px-3">{isRu ? 'игрок' : 'player'}</th>
                  <th className="py-2.5 px-3 text-right">{isRu ? 'рейтинг' : 'elo'}</th>
                  <th className="py-2.5 px-3 text-right hidden xs:table-cell">{isRu ? 'побед' : 'wins'}</th>
                  <th className="py-2.5 px-3 text-right hidden sm:table-cell">{isRu ? 'всего' : 'games'}</th>
                  <th className="py-2.5 px-3 text-right">{isRu ? 'винрейт' : 'win%'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]/40 font-sans">
                {activeTab === 'top' ? (
                  data?.topEntries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-xs text-[var(--ink-mute)] lowercase">
                        {isRu
                          ? 'пока нет игроков с 5+ сыгранными рейтинговыми партиями. будьте первым!'
                          : 'no players with 5+ rated games yet. be the first!'}
                      </td>
                    </tr>
                  ) : (
                    data?.topEntries.map((entry) => {
                      const isMe = entry.id === playerId;
                      return (
                        <tr
                          key={entry.id}
                          className={`transition-colors ${
                            isMe
                              ? 'bg-[var(--line)]/30 font-medium'
                              : 'hover:bg-[var(--line)]/15'
                          }`}
                        >
                          <td className="py-2.5 px-3 text-center font-mono text-[var(--highlight-ink)] whitespace-nowrap">
                            {entry.rank === 1 ? (
                              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-[11px]">
                                1
                              </span>
                            ) : entry.rank === 2 ? (
                              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-300/40 text-slate-700 dark:text-slate-300 font-bold text-[11px]">
                                2
                              </span>
                            ) : entry.rank === 3 ? (
                              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-700/20 text-amber-800 dark:text-amber-300 font-bold text-[11px]">
                                3
                              </span>
                            ) : (
                              <span className="text-[var(--ink-mute)]">{entry.rank}</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span className="text-[var(--highlight-ink)] font-medium">
                              {entry.nickname}
                            </span>
                            {isMe && (
                              <span className="ml-1.5 px-1.5 py-0.2 rounded text-[9px] uppercase font-mono bg-[var(--highlight-ink)] text-[var(--bg)]">
                                {isRu ? 'вы' : 'you'}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-medium text-[var(--highlight-ink)] whitespace-nowrap">
                            {entry.rating}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-[var(--ink-soft)] hidden xs:table-cell whitespace-nowrap">
                            {entry.wins}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-[var(--ink-mute)] hidden sm:table-cell whitespace-nowrap">
                            {entry.games}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-[var(--highlight-ink)] whitespace-nowrap">
                            {entry.winRate}%
                          </td>
                        </tr>
                      );
                    })
                  )
                ) : data?.provisionalEntries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-xs text-[var(--ink-mute)] lowercase">
                      {isRu ? 'нет игроков на калибровке' : 'no provisional players right now'}
                    </td>
                  </tr>
                ) : (
                  data?.provisionalEntries.map((entry) => {
                    const isMe = entry.id === playerId;
                    return (
                      <tr
                        key={entry.id}
                        className={`transition-colors ${
                          isMe
                            ? 'bg-[var(--line)]/30 font-medium'
                            : 'hover:bg-[var(--line)]/15'
                        }`}
                      >
                        <td className="py-2.5 px-3 text-center font-mono text-[var(--ink-mute)] whitespace-nowrap">
                          ~
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className="text-[var(--highlight-ink)] font-medium">
                            {entry.nickname}
                          </span>
                          {isMe && (
                            <span className="ml-1.5 px-1.5 py-0.2 rounded text-[9px] uppercase font-mono bg-[var(--highlight-ink)] text-[var(--bg)]">
                              {isRu ? 'вы' : 'you'}
                            </span>
                          )}
                          <span className="ml-1.5 text-[10px] text-amber-600 dark:text-amber-400 font-mono">
                            ({entry.games}/5)
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-[var(--highlight-ink)] whitespace-nowrap">
                          {entry.rating}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-[var(--ink-soft)] hidden xs:table-cell whitespace-nowrap">
                          {entry.wins}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-[var(--ink-mute)] hidden sm:table-cell whitespace-nowrap">
                          {entry.games}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-[var(--highlight-ink)] whitespace-nowrap">
                          {entry.winRate}%
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Rules note on Elo */}
        <div className="mt-8 pt-6 border-t border-[var(--line)] text-xs text-[var(--ink-soft)] lowercase leading-relaxed space-y-2">
          <p className="font-serif text-sm font-medium text-[var(--highlight-ink)]">
            {isRu ? 'как начисляется рейтинг Elo' : 'how Elo is calculated'}
          </p>
          <p>
            {isRu
              ? '• Начальный рейтинг каждого игрока — 1000. Нижний порог — 100.'
              : '• Every player starts at 1000 Elo. The minimum floor is 100.'}
          </p>
          <p>
            {isRu
              ? '• Коэффициент K=40 для первых 20 партий (быстрая калибровка), затем K=32. Официальный ранг присваивается после 5 сыгранных партий.'
              : '• K=40 for the first 20 rated games (fast calibration), then K=32. Official leaderboard rank is unlocked after 5 games.'}
          </p>
          <p>
            {isRu
              ? '• В играх с ИИ: лёгкий (800), средний (1100), сложный и qnet (1400). Победа над лёгким даёт мало очков.'
              : '• In games vs AI: easy is rated 800, medium 1100, hard and qnet 1400. Beating easy awards fewer points.'}
          </p>
          <p>
            {isRu
              ? '• Локальная игра на одном устройстве не влияет на рейтинг. Игры с одним другом ограничены 5 рейтинговыми матчами в сутки.'
              : '• Local pass & play on one device is unrated. Rated games between the same two friends are capped at 5 per day.'}
          </p>
        </div>
      </div>
    </main>
  );
}
