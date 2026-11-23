'use client';

import React, { useState } from 'react';
import { X, Flame, Trophy, Share2, Check, Play, Calendar } from 'lucide-react';
import {
  DailyStats,
  generateShareText,
  getChallengeNumber,
  getTodayDateString,
  getTodayResult,
} from '@/lib/daily';
import { BoardWinner } from '@/types/game';

interface DailyChallengeModalProps {
  isOpen: boolean;
  dailyStats: DailyStats;
  currentBoardWinners?: BoardWinner[];
  movesCount?: number;
  winner?: BoardWinner;
  onClose: () => void;
  onStartDailyMatch: () => void;
}

export const DailyChallengeModal: React.FC<DailyChallengeModalProps> = ({
  isOpen,
  dailyStats,
  currentBoardWinners,
  onClose,
  onStartDailyMatch,
}) => {
  const [copied, setCopied] = useState(false);
  const [challengeNum, setChallengeNum] = useState(1);
  const [todayResult, setTodayResult] = useState<ReturnType<typeof getTodayResult>>(null);

  React.useEffect(() => {
    if (isOpen) {
      const today = getTodayDateString();
      setChallengeNum(getChallengeNumber(today));
      setTodayResult(getTodayResult());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const hasCompletedToday = Boolean(todayResult);

  const handleShare = async () => {
    const winners = todayResult?.boardWinners || currentBoardWinners || Array(9).fill(null);
    const won = todayResult ? todayResult.won : false;
    const moves = todayResult ? todayResult.movesCount : 0;
    const streak = dailyStats.currentStreak;

    const shareText = generateShareText(challengeNum, won, moves, streak, winners);

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-up"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[420px] p-6 rounded-2xl bg-[var(--bg)] border border-[var(--line-strong)] shadow-2xl text-[var(--ink)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-[var(--line)]">
          <div className="flex items-center gap-2">
            <Calendar size={17} className="text-[var(--highlight-ink)]" />
            <h2 className="text-base font-normal lowercase tracking-tight">
              челлендж дня · #{challengeNum}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-[var(--ink-soft)] hover:text-[var(--highlight-ink)] transition-colors cursor-pointer"
            aria-label="Закрыть"
          >
            <X size={17} />
          </button>
        </div>

        {/* Streak Stats Cards */}
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-[var(--line)]/20 border border-[var(--line)] text-center">
            <div className="flex items-center gap-1.5 text-amber-500 font-medium text-lg">
              <Flame size={18} className="fill-amber-500" />
              <span>{dailyStats.currentStreak}</span>
            </div>
            <span className="text-[11px] text-[var(--ink-mute)] lowercase">текущий стрик</span>
          </div>

          <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-[var(--line)]/20 border border-[var(--line)] text-center">
            <div className="flex items-center gap-1.5 text-[var(--highlight-ink)] font-medium text-lg">
              <Trophy size={16} />
              <span>{dailyStats.maxStreak}</span>
            </div>
            <span className="text-[11px] text-[var(--ink-mute)] lowercase">рекордный стрик</span>
          </div>
        </div>

        {/* Content depending on whether today's challenge was completed */}
        {hasCompletedToday && todayResult ? (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-[var(--active-board-bg)] border border-[var(--line-strong)] text-center">
              <div className="text-sm font-medium text-[var(--highlight-ink)] lowercase mb-1">
                {todayResult.won ? 'испытание дня пройдено!' : 'испытание завершено'}
              </div>
              <p className="text-xs text-[var(--ink-soft)] lowercase mb-3">
                {todayResult.won
                  ? `победа за ${todayResult.movesCount} ходов · возвращайся завтра!`
                  : `партия сыграна (${todayResult.movesCount} ходов) · завтра новый шанс`}
              </p>

              {/* 3x3 Mini Sector Emoji Grid Preview */}
              <div className="grid grid-cols-3 gap-1.5 w-24 h-24 mx-auto p-1.5 rounded-lg border border-[var(--line)] bg-[var(--bg-subtle)] mb-3">
                {todayResult.boardWinners.map((w, idx) => (
                  <div
                    key={idx}
                    className={`w-full h-full rounded-[2px] flex items-center justify-center text-[10px] font-bold ${
                      w === 'X'
                        ? 'bg-emerald-500/80 text-white'
                        : w === 'O'
                        ? 'bg-zinc-400 text-white dark:bg-zinc-600'
                        : 'bg-[var(--line)]'
                    }`}
                  >
                    {w === 'X' ? '✓' : w === 'O' ? '✕' : ''}
                  </div>
                ))}
              </div>

              {/* Share button */}
              <button
                type="button"
                onClick={handleShare}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-[var(--highlight-ink)] text-[var(--bg)] text-xs font-sans font-medium lowercase hover:opacity-90 transition-all cursor-pointer shadow-xs"
              >
                {copied ? (
                  <>
                    <Check size={14} />
                    <span>карточка скопирована в буфер</span>
                  </>
                ) : (
                  <>
                    <Share2 size={14} />
                    <span>поделиться результатом (Wordle style)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3.5">
            <div className="p-3.5 rounded-xl bg-[var(--line)]/15 border border-[var(--line)]">
              <h3 className="text-xs font-medium text-[var(--highlight-ink)] lowercase mb-1">
                правила ежедневного матча
              </h3>
              <p className="text-xs text-[var(--ink-soft)] font-light leading-relaxed lowercase">
                каждый день в 00:00 создаётся уникальный матч дня, одинаковый для всех игроков мира.
                одержи победу, чтобы защитить и приумножить свой стрик!
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                onStartDailyMatch();
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[var(--highlight-ink)] text-[var(--bg)] text-xs font-sans font-medium lowercase hover:opacity-90 transition-all cursor-pointer shadow-xs"
            >
              <Play size={14} className="fill-current" />
              <span>играть челлендж дня</span>
            </button>
          </div>
        )}

        {/* History Dots (Last 14 days) */}
        {dailyStats.history.length > 0 && (
          <div className="mt-4 pt-3 border-t border-[var(--line)]">
            <span className="text-[10px] text-[var(--ink-mute)] uppercase tracking-wider block mb-1.5 font-medium">
              последние матчи
            </span>
            <div className="flex items-center gap-1 flex-wrap">
              {dailyStats.history.slice(0, 14).map((entry, i) => (
                <div
                  key={i}
                  title={`${entry.date}: ${entry.won ? 'победа' : 'поражение'} (${entry.movesCount} ходов)`}
                  className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] ${
                    entry.won
                      ? 'bg-emerald-500 text-white'
                      : 'bg-zinc-400 dark:bg-zinc-600 text-zinc-200'
                  }`}
                >
                  {entry.won ? '✓' : '•'}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
