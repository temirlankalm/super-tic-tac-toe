'use client';

import React, { useState } from 'react';
import {
  PencilArrowRight,
  PencilCalendar,
  PencilCheck,
  PencilClose,
  PencilFlame,
  PencilShare,
  PencilTrophy,
} from './hand-drawn/PencilIcons';
import {
  DailyStats,
  generateShareText,
  getChallengeNumber,
  getTodayDateString,
  getTodayResult,
} from '@/lib/daily';
import { BoardWinner } from '@/types/game';
import { useTranslation } from '@/i18n/LanguageContext';
import { analytics } from '@/lib/analytics/client';

interface DailyChallengeModalProps {
  isOpen: boolean;
  dailyStats: DailyStats;
  currentBoardWinners?: BoardWinner[];
  movesCount?: number;
  winner?: BoardWinner;
  nickname?: string;
  onClose: () => void;
  onStartDailyMatch: () => void;
}

export const DailyChallengeModal: React.FC<DailyChallengeModalProps> = ({
  isOpen,
  dailyStats,
  currentBoardWinners,
  nickname,
  onClose,
  onStartDailyMatch,
}) => {
  const { t, language } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [challengeNum, setChallengeNum] = useState(1);
  const [todayResult, setTodayResult] = useState<ReturnType<typeof getTodayResult>>(null);

  const modalRef = React.useRef<HTMLDivElement>(null);
  const previousActiveElement = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      const today = getTodayDateString();
      setChallengeNum(getChallengeNumber(today));
      setTodayResult(getTodayResult());
    }
  }, [isOpen]);

  // Focus trap, Escape key, and restore focus on close
  React.useEffect(() => {
    if (!isOpen) return;

    const modal = modalRef.current;
    if (modal) {
      const focusable = modal.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length > 0) {
        focusable[0].focus();
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'Tab' && modal) {
        const focusable = modal.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      previousActiveElement.current?.focus?.();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const hasCompletedToday = Boolean(todayResult);

  const handleShare = async () => {
    const winners = todayResult?.boardWinners || currentBoardWinners || Array(9).fill(null);
    const won = todayResult ? todayResult.won : false;
    const moves = todayResult ? todayResult.movesCount : 0;
    const streak = dailyStats.currentStreak;

    const shareText = generateShareText(challengeNum, won, moves, streak, winners, language, nickname);
    analytics.buttonClick('share_daily_result', { won, moves, streak, challengeNum });

    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({
          title: `Tic³ · super #${challengeNum}`,
          text: shareText,
        });
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
        return;
      }
    } catch {
      // fallback to clipboard
    }

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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--scrim)] backdrop-blur-xs animate-fade-up"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="daily-challenge-modal-title"
        className="pencil-sheet relative w-full max-w-[calc(100vw-2rem)] sm:max-w-[420px] max-h-[90dvh] overflow-y-auto p-5 sm:p-6 text-[var(--ink)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-dashed border-[var(--line-strong)]">
          <div className="flex items-center gap-2">
            <PencilCalendar className="w-4 h-4 text-[var(--highlight-ink)]" />
            <h2 id="daily-challenge-modal-title" className="font-hand text-2xl font-semibold text-[var(--highlight-ink)] lowercase leading-none">
              {t.dailyModal.title.replace('{num}', String(challengeNum)).replace('#{num}', `#${challengeNum}`)}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="pencil-chip p-2 min-h-[40px] min-w-[40px] flex items-center justify-center text-[var(--ink-soft)] cursor-pointer"
            aria-label={t.common.close}
          >
            <PencilClose className="w-4 h-4" />
          </button>
        </div>

        {/* Streak Stats Cards */}
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          <div className="pencil-card highlighter-mark flex flex-col items-center justify-center p-3 text-center">
            <div className="flex items-center gap-1.5 text-[var(--highlight-ink)] font-mono font-semibold text-lg">
              <PencilFlame className="w-4 h-4" />
              <span>{dailyStats.currentStreak}</span>
            </div>
            <span className="text-[11px] text-[var(--ink-soft)] lowercase">{t.dailyModal.currentStreak}</span>
          </div>

          <div className="pencil-card bg-[var(--bg)] flex flex-col items-center justify-center p-3 text-center">
            <div className="flex items-center gap-1.5 text-[var(--highlight-ink)] font-mono font-semibold text-lg">
              <PencilTrophy className="w-4 h-4" />
              <span>{dailyStats.maxStreak}</span>
            </div>
            <span className="text-[11px] text-[var(--ink-soft)] lowercase">{t.dailyModal.recordStreak}</span>
          </div>
        </div>

        {/* Content depending on whether today's challenge was completed */}
        {hasCompletedToday && todayResult ? (
          <div className="space-y-4">
            <div className="pencil-card p-3.5 bg-[var(--active-board-bg)] text-center">
              <div className="font-hand text-xl font-semibold text-[var(--highlight-ink)] lowercase mb-1">
                {todayResult.won ? t.dailyModal.statusWon : t.dailyModal.statusLost}
              </div>
              {nickname && (
                <div className="text-[11px] font-mono text-[var(--ink-soft)] mb-1">
                  {nickname}
                </div>
              )}
              <p className="text-xs text-[var(--ink-soft)] lowercase mb-3">
                {todayResult.won
                  ? (language === 'ru'
                      ? `победа за ${todayResult.movesCount} ходов · возвращайся завтра!`
                      : `won in ${todayResult.movesCount} moves · return tomorrow!`)
                  : (language === 'ru'
                      ? `партия сыграна (${todayResult.movesCount} ходов) · завтра новый шанс`
                      : `puzzle completed (${todayResult.movesCount} moves) · new chance tomorrow`)}
              </p>

              {/* 3x3 Mini Sector Grid Preview */}
              <div className="grid grid-cols-3 gap-1.5 w-24 h-24 mx-auto p-1.5 rounded-[7px_4px_8px_5px] border border-[var(--line-strong)] bg-[var(--surface)] mb-3">
                {todayResult.boardWinners.map((w, idx) => (
                  <div
                    key={idx}
                    className={`w-full h-full rounded-[3px] flex items-center justify-center text-[10px] font-mono font-bold border ${
                      w === 'X'
                        ? 'bg-[var(--accent)] text-[var(--accent-ink)] border-[var(--highlight-ink)]'
                        : w === 'O'
                        ? 'bg-[var(--highlight-ink)] text-[var(--bg)] border-[var(--highlight-ink)]'
                        : 'bg-[var(--bg)] border-[var(--line)]'
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
                className="pencil-btn-primary w-full flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-sans font-medium lowercase cursor-pointer"
              >
                {copied ? (
                  <>
                    <PencilCheck className="w-3.5 h-3.5" />
                    <span>{t.dailyModal.shareSuccess}</span>
                  </>
                ) : (
                  <>
                    <PencilShare className="w-3.5 h-3.5" />
                    <span>{t.dailyModal.shareButton}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3.5">
            <div className="pencil-card p-3.5 bg-[var(--bg)]">
              <h3 className="text-xs font-medium text-[var(--highlight-ink)] lowercase mb-1">
                {language === 'ru' ? 'правила ежедневного матча' : 'daily puzzle rules'}
              </h3>
              <p className="text-xs text-[var(--ink-soft)] font-light leading-relaxed lowercase">
                {language === 'ru'
                  ? 'каждый день в 00:00 создаётся уникальный матч дня, одинаковый для всех игроков мира. одержи победу, чтобы защитить и приумножить свой стрик!'
                  : 'a unique tactical puzzle is generated each midnight, identical for all players worldwide. win to grow your streak!'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                onStartDailyMatch();
              }}
              className="pencil-btn-primary w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-sans font-medium lowercase cursor-pointer"
            >
              <PencilArrowRight className="w-3.5 h-3.5" />
              <span>{t.dailyModal.playButton}</span>
            </button>
          </div>
        )}

        {/* History Dots (Last 14 days) */}
        {dailyStats.history.length > 0 && (
          <div className="mt-4 pt-3 border-t border-dashed border-[var(--line-strong)]">
            <span className="text-[10px] text-[var(--ink-mute)] uppercase tracking-wider block mb-1.5 font-medium">
              {language === 'ru' ? 'последние матчи' : 'recent matches'}
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {dailyStats.history.slice(0, 14).map((entry, i) => (
                <div
                  key={i}
                  title={`${entry.date}: ${entry.won ? (language === 'ru' ? 'победа' : 'win') : (language === 'ru' ? 'поражение' : 'loss')} (${entry.movesCount} ${t.common.daysShort})`}
                  className={`w-4 h-4 rounded-full border flex items-center justify-center text-[9px] font-mono ${
                    entry.won
                      ? 'bg-[var(--accent)] border-[var(--highlight-ink)] text-[var(--accent-ink)] font-bold'
                      : 'bg-[var(--bg)] border-[var(--line-strong)] text-[var(--ink-soft)]'
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
