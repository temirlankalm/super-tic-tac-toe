'use client';

import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, Bot, User, Sun, Moon, Clock, Volume2, VolumeX, Globe, Flame, Sliders, Zap } from 'lucide-react';
import { AiDifficulty, ConnectionStatus, GameState, OnlineRole, TimeControl } from '@/types/game';
import { HandDrawnLogo } from './hand-drawn/HandDrawnLogo';
import { HandDrawnO, HandDrawnX } from './hand-drawn/HandDrawnMarks';

interface GameStatusProps {
  gameState: GameState;
  theme: 'light' | 'dark';
  timeControl: TimeControl;
  isSoundEnabled: boolean;
  onlineRole?: OnlineRole;
  connectionStatus?: ConnectionStatus;
  roomId?: string | null;
  drawOfferedByOpponent?: boolean;
  myDrawOffered?: boolean;
  drawDeclinedNotice?: boolean;
  dailyStreak?: number;
  activeModifiersCount?: number;
  disconnectGraceSeconds?: number | null;
  isQuickSearching?: boolean;
  quickSearchElapsed?: number;
  quickSearchTimeoutReached?: boolean;
  onToggleMode: () => void;
  onSetDifficulty: (difficulty: AiDifficulty) => void;
  onSetTimeControl: (tc: TimeControl) => void;
  onToggleTheme: () => void;
  onToggleSound: () => void;
  onOpenRules: () => void;
  onOpenOnlineModal?: () => void;
  onAcceptDraw?: () => void;
  onDeclineDraw?: () => void;
  onOpenDailyModal?: () => void;
  onOpenSettingsModal?: () => void;
  onStartQuickMatch?: () => void;
  onCancelQuickMatch?: () => void;
  onQuickMatchPlayAi?: () => void;
}

const timeLabels: Record<TimeControl, string> = {
  off: 'off',
  60: '1m',
  120: '2m',
  180: '3m',
  300: '5m',
};

const sectorNames = [
  'верх-лево',
  'верх-центр',
  'верх-право',
  'центр-лево',
  'центр',
  'центр-право',
  'низ-лево',
  'низ-центр',
  'низ-право',
];

export const GameStatus: React.FC<GameStatusProps> = ({
  gameState,
  theme,
  timeControl,
  isSoundEnabled,
  onlineRole,
  connectionStatus,
  roomId,
  drawOfferedByOpponent,
  myDrawOffered,
  drawDeclinedNotice,
  dailyStreak,
  activeModifiersCount,
  disconnectGraceSeconds,
  isQuickSearching,
  quickSearchElapsed = 0,
  quickSearchTimeoutReached = false,
  onToggleMode,
  onSetDifficulty,
  onSetTimeControl,
  onToggleTheme,
  onToggleSound,
  onOpenRules,
  onOpenOnlineModal,
  onAcceptDraw,
  onDeclineDraw,
  onOpenDailyModal,
  onOpenSettingsModal,
  onStartQuickMatch,
  onCancelQuickMatch,
  onQuickMatchPlayAi,
}) => {
  const {
    currentPlayer,
    winner,
    activeBoard,
    gameMode,
    difficulty,
    isAiThinking,
  } = gameState;

  const [isTimeMenuOpen, setIsTimeMenuOpen] = useState(false);
  const timeMenuRef = useRef<HTMLDivElement>(null);

  // Close time menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (timeMenuRef.current && !timeMenuRef.current.contains(e.target as Node)) {
        setIsTimeMenuOpen(false);
      }
    };
    if (isTimeMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isTimeMenuOpen]);

  return (
    <div className="w-full max-w-[460px] sm:max-w-[480px] mx-auto mb-3">
      {/* Top Bar: Brand & Game Configurations */}
      <div className="flex items-center justify-between pb-2.5 border-b border-[var(--line)] gap-2">
        {/* Brand, Rules & Quick Tools */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <HandDrawnLogo className="h-6 w-auto text-[var(--highlight-ink)]" />
            <span className="text-[11px] text-[var(--ink-mute)] font-light tracking-widest lowercase">
              · super
            </span>
          </div>
          <button
            type="button"
            onClick={onOpenRules}
            aria-label="Правила игры"
            className="p-1 text-[var(--ink-soft)] hover:text-[var(--highlight-ink)] transition-colors cursor-pointer"
            title="правила игры"
          >
            <HelpCircle size={15} />
          </button>
          {onOpenDailyModal && (
            <button
              type="button"
              onClick={onOpenDailyModal}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded-md border border-[var(--line)] hover:border-[var(--line-strong)] text-[var(--ink-soft)] hover:text-[var(--highlight-ink)] transition-all cursor-pointer font-sans lowercase text-[11px]"
              title="челлендж дня и стрик"
            >
              <Flame size={12} className={dailyStreak && dailyStreak > 0 ? "fill-amber-500 text-amber-500" : ""} />
              <span>{dailyStreak && dailyStreak > 0 ? `${dailyStreak}` : 'день'}</span>
            </button>
          )}
          {onOpenSettingsModal && (
            <button
              type="button"
              onClick={onOpenSettingsModal}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md border transition-all cursor-pointer font-sans lowercase text-[11px] ${
                activeModifiersCount && activeModifiersCount > 0
                  ? 'border-[var(--line-strong)] text-[var(--highlight-ink)] bg-[var(--line)]/30 font-medium'
                  : 'border-[var(--line)] hover:border-[var(--line-strong)] text-[var(--ink-soft)] hover:text-[var(--highlight-ink)]'
              }`}
              title="аркадные модификаторы"
            >
              <Sliders size={12} />
              {activeModifiersCount && activeModifiersCount > 0 && (
                <span className="text-[9px] px-1 rounded-full bg-[var(--highlight-ink)] text-[var(--bg)] font-medium">
                  {activeModifiersCount}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Configurations Bar */}
        <div className="flex items-center gap-1.5 text-xs">
          {/* Mode toggle */}
          <button
            type="button"
            onClick={onToggleMode}
            className="flex items-center gap-1.5 px-2 py-1 rounded-md border border-[var(--line)] hover:border-[var(--line-strong)] text-[var(--ink-soft)] hover:text-[var(--highlight-ink)] transition-all cursor-pointer font-sans lowercase"
            title="Переключить режим (против ии / вдвоем / онлайн)"
          >
            {gameMode === 'ai' ? (
              <>
                <Bot size={13} />
                <span>ии</span>
              </>
            ) : gameMode === 'pvp' ? (
              <>
                <User size={13} />
                <span>2p</span>
              </>
            ) : (
              <>
                <Globe size={13} />
                <span>онлайн</span>
              </>
            )}
          </button>

          {/* Quick Match Button */}
          {gameMode === 'online' && !isQuickSearching && connectionStatus !== 'connected' && onStartQuickMatch && (
            <button
              type="button"
              onClick={onStartQuickMatch}
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-[var(--highlight-ink)] text-[var(--bg)] hover:opacity-90 transition-all cursor-pointer font-sans lowercase text-xs font-medium"
              title="найти случайного соперника онлайн"
            >
              <Zap size={12} />
              <span>найти игру</span>
            </button>
          )}

          {/* Online Room Trigger Button */}
          {gameMode === 'online' && (
            <button
              type="button"
              onClick={onOpenOnlineModal}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md border border-[var(--line)] hover:border-[var(--line-strong)] text-[var(--ink-soft)] hover:text-[var(--highlight-ink)] transition-all cursor-pointer font-sans lowercase text-xs"
              title="открыть комнату / пригласить друга"
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  connectionStatus === 'connected'
                    ? 'bg-emerald-500 shadow-xs shadow-emerald-500/50'
                    : connectionStatus === 'waiting' || connectionStatus === 'connecting'
                    ? 'bg-amber-500 animate-pulse'
                    : connectionStatus === 'disconnected' || connectionStatus === 'error'
                    ? 'bg-rose-500'
                    : 'bg-zinc-400'
                }`}
              />
              <span>
                {connectionStatus === 'connected'
                  ? 'в сети'
                  : connectionStatus === 'waiting'
                  ? 'ожидание…'
                  : connectionStatus === 'connecting'
                  ? 'вход…'
                  : roomId
                  ? `#${roomId}`
                  : 'комната'}
              </span>
            </button>
          )}

          {/* Difficulty selector (when in vs ai mode) */}
          {gameMode === 'ai' && (
            <div className="flex items-center rounded-md border border-[var(--line)] p-0.5 text-[11px] font-sans lowercase">
              {(
                [
                  { lvl: 'easy', label: 'легк' },
                  { lvl: 'medium', label: 'сред' },
                  { lvl: 'hard', label: 'слож' },
                  { lvl: 'qnet', label: 'qnet' },
                ] as const
              ).map(({ lvl, label }) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => onSetDifficulty(lvl)}
                  className={`px-1.5 py-0.5 rounded-[4px] transition-all cursor-pointer ${
                    difficulty === lvl
                      ? 'bg-[var(--line-strong)] text-[var(--highlight-ink)] font-medium'
                      : 'text-[var(--ink-mute)] hover:text-[var(--ink-soft)]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Chess Clock Timer Selector */}
          <div className="relative" ref={timeMenuRef}>
            <button
              type="button"
              onClick={() => setIsTimeMenuOpen((prev) => !prev)}
              className={`flex items-center gap-1 px-2 py-1 rounded-md border transition-all cursor-pointer font-sans lowercase ${
                timeControl !== 'off'
                  ? 'border-[var(--line-strong)] text-[var(--highlight-ink)] bg-[var(--active-board-bg)] font-medium'
                  : 'border-[var(--line)] hover:border-[var(--line-strong)] text-[var(--ink-soft)] hover:text-[var(--highlight-ink)]'
              }`}
              title="шахматные часы"
              aria-label="Выбрать контроль времени"
            >
              <Clock size={13} />
              <span>{timeLabels[timeControl]}</span>
            </button>

            {isTimeMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 z-40 py-1 px-1 min-w-[145px] rounded-lg bg-[var(--bg)] border border-[var(--line-strong)] shadow-lg animate-fade-up text-xs font-sans">
                <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-[var(--ink-mute)] font-medium border-b border-[var(--line)] mb-1">
                  контроль времени
                </div>
                {(
                  [
                    { value: 'off', label: 'без таймера' },
                    { value: 60, label: '1 мин (пуля)' },
                    { value: 120, label: '2 мин (блиц)' },
                    { value: 180, label: '3 мин (блиц)' },
                    { value: 300, label: '5 мин (рапид)' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onSetTimeControl(opt.value);
                      setIsTimeMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2 py-1 rounded text-left transition-colors cursor-pointer ${
                      timeControl === opt.value
                        ? 'bg-[var(--line)] text-[var(--highlight-ink)] font-medium'
                        : 'text-[var(--ink-soft)] hover:text-[var(--highlight-ink)] hover:bg-[var(--line)]/50'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {timeControl === opt.value && <span className="text-[10px]">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sound toggle (Paper ASMR) */}
          <button
            type="button"
            onClick={onToggleSound}
            className="p-1.5 rounded-md border border-[var(--line)] hover:border-[var(--line-strong)] text-[var(--ink-soft)] hover:text-[var(--highlight-ink)] transition-all cursor-pointer"
            title={isSoundEnabled ? 'выключить звук (paper asmr)' : 'включить звук'}
            aria-label={isSoundEnabled ? 'выключить звук' : 'включить звук'}
          >
            {isSoundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
          </button>

          {/* Theme toggle (Light / Dark) */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="p-1.5 rounded-md border border-[var(--line)] hover:border-[var(--line-strong)] text-[var(--ink-soft)] hover:text-[var(--highlight-ink)] transition-all cursor-pointer"
            title={theme === 'dark' ? 'светлая тема' : 'тёмная тема'}
            aria-label={theme === 'dark' ? 'светлая тема' : 'тёмная тема'}
          >
            {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
          </button>
        </div>
      </div>

      {/* Quick Match Searching Banner */}
      {isQuickSearching && (
        <div className="pt-2">
          <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--line)]/25 border border-[var(--line-strong)] text-xs w-full animate-fade-up">
            <div className="flex items-center gap-2 text-[var(--highlight-ink)] lowercase">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              <span>поиск соперника… ({quickSearchElapsed}с)</span>
            </div>
            <div className="flex items-center gap-1.5">
              {quickSearchTimeoutReached && onQuickMatchPlayAi && (
                <button
                  type="button"
                  onClick={onQuickMatchPlayAi}
                  className="px-2 py-0.5 rounded bg-[var(--highlight-ink)] text-[var(--bg)] font-medium lowercase text-[11px] hover:opacity-90 transition-opacity cursor-pointer"
                >
                  сыграть с ии
                </button>
              )}
              {onCancelQuickMatch && (
                <button
                  type="button"
                  onClick={onCancelQuickMatch}
                  className="px-2 py-0.5 rounded border border-[var(--line-strong)] text-[var(--ink-soft)] hover:text-[var(--highlight-ink)] lowercase text-[11px] transition-colors cursor-pointer"
                >
                  отмена
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Disconnect Grace Period Countdown Banner */}
      {typeof disconnectGraceSeconds === 'number' && disconnectGraceSeconds > 0 && (
        <div className="pt-2">
          <div className="flex items-center justify-between p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs w-full text-rose-500 animate-fade-up">
            <span className="lowercase">
              соперник отключился · ожидание возврата: {disconnectGraceSeconds}с…
            </span>
            <span className="text-[11px] text-[var(--ink-mute)] lowercase">
              иначе тех. победа
            </span>
          </div>
        </div>
      )}

      {/* Online Draw Offer Negotiation Banner */}
      {gameMode === 'online' && winner === null && (
        <div className="pt-2">
          {drawOfferedByOpponent ? (
            <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--line)]/30 border border-[var(--line-strong)] text-xs animate-fade-up">
              <span className="text-[var(--highlight-ink)] lowercase">
                соперник предлагает ничью
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={onAcceptDraw}
                  className="px-2.5 py-1 rounded bg-[var(--highlight-ink)] text-[var(--bg)] font-medium lowercase hover:opacity-90 transition-opacity cursor-pointer"
                >
                  согласиться
                </button>
                <button
                  type="button"
                  onClick={onDeclineDraw}
                  className="px-2 py-1 rounded border border-[var(--line-strong)] text-[var(--ink-soft)] hover:text-[var(--highlight-ink)] lowercase transition-colors cursor-pointer"
                >
                  отклонить
                </button>
              </div>
            </div>
          ) : myDrawOffered ? (
            <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--line)]/20 border border-[var(--line)] text-xs text-[var(--ink-soft)] lowercase animate-fade-up">
              <span>предложение ничьей отправлено сопернику…</span>
            </div>
          ) : drawDeclinedNotice ? (
            <div className="flex items-center justify-between p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-500 lowercase animate-fade-up">
              <span>соперник отклонил предложение ничьей.</span>
            </div>
          ) : null}
        </div>
      )}

      {/* Live Status Bar (Turn Indicator & Target Sector Guidance) */}
      <div className="flex items-center justify-between pt-2.5 text-xs min-h-[30px]">
        {/* Game State Message */}
        <div className="flex items-center gap-2">
          {winner === null ? (
            gameMode === 'online' && connectionStatus !== 'connected' ? (
              <div className="flex items-center gap-2 animate-fade-up">
                {connectionStatus === 'waiting' && (
                  <button
                    type="button"
                    onClick={onOpenOnlineModal}
                    className="text-xs text-[var(--ink-mute)] hover:text-[var(--highlight-ink)] lowercase cursor-pointer underline-offset-2 underline decoration-[var(--underline)]"
                  >
                    ожидание соперника… (отправьте ссылку)
                  </button>
                )}
                {connectionStatus === 'connecting' && (
                  <span className="text-xs text-[var(--ink-mute)] lowercase animate-pulse">
                    подключение к комнате…
                  </span>
                )}
                {connectionStatus === 'disconnected' && (
                  <span className="text-xs text-rose-500 lowercase">
                    соперник отключился
                  </span>
                )}
                {connectionStatus === 'error' && (
                  <span className="text-xs text-rose-500 lowercase">
                    ошибка подключения (комната не найдена)
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-[var(--ink-soft)] lowercase">
                  ход:
                </span>
                <span className="inline-flex items-center gap-1.5 font-medium text-[var(--highlight-ink)]">
                  {currentPlayer === 'X' ? (
                    <HandDrawnX variant={0} className="w-3.5 h-3.5 text-[var(--highlight-ink)]" />
                  ) : (
                    <HandDrawnO variant={0} className="w-3.5 h-3.5 text-[var(--highlight-ink)]" />
                  )}
                  {gameMode === 'ai' && currentPlayer !== gameState.humanPlayer && (
                    <span className="text-xs text-[var(--ink-mute)] font-normal">
                      {isAiThinking ? '(думает…)' : `(ии)`}
                    </span>
                  )}
                  {gameMode === 'online' && (
                    <span className="text-xs text-[var(--ink-soft)] font-normal lowercase">
                      {((onlineRole === 'host' && currentPlayer === 'X') ||
                        (onlineRole === 'guest' && currentPlayer === 'O'))
                        ? '· ваш ход'
                        : '· ход соперника'}
                    </span>
                  )}
                </span>
              </div>
            )
          ) : (
            <span className="text-xs text-[var(--ink-mute)] lowercase">
              партия завершена
            </span>
          )}
        </div>

        {/* Sector Target Guidance with Mini-Grid Locator & Free Play badge */}
        {winner === null && (
          <div className="flex items-center gap-2 text-xs text-[var(--ink-soft)] lowercase">
            {activeBoard === null ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--line)] text-[var(--highlight-ink)] font-medium text-[11px] animate-pulse lowercase">
                ✦ свободный ход
              </span>
            ) : (
              <div className="flex items-center gap-1.5">
                <span>цель: {sectorNames[activeBoard]}</span>
                {/* Visual 3x3 Mini Sector Locator */}
                <div className="grid grid-cols-3 gap-0.5 w-3.5 h-3.5 border border-[var(--line-strong)] p-0.5 rounded-[2px]">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-full h-full rounded-[0.5px] ${
                        i === activeBoard
                          ? 'bg-[var(--highlight-ink)]'
                          : 'bg-[var(--line)]'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
