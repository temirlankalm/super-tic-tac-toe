'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  HelpCircle,
  Bot,
  Users,
  Sun,
  Moon,
  Clock,
  Volume2,
  VolumeX,
  Globe,
  Flame,
  Sliders,
  ChevronDown,
  User,
} from 'lucide-react';
import {
  AiDifficulty,
  ConnectionStatus,
  GameMode,
  GameState,
  OnlineRole,
  Player,
  RoomJoinError,
  TimeControl,
} from '@/types/game';
import { HandDrawnLogo } from './hand-drawn/HandDrawnLogo';
import { HandDrawnO, HandDrawnX } from './hand-drawn/HandDrawnMarks';
import { useTranslation } from '@/i18n/LanguageContext';

interface GameStatusProps {
  gameState: GameState;
  theme: 'light' | 'dark';
  timeControl: TimeControl;
  isSoundEnabled: boolean;
  onlineRole?: OnlineRole;
  onlinePlayer?: Player | null;
  connectionStatus?: ConnectionStatus;
  joinError?: RoomJoinError;
  roomId?: string | null;
  drawOfferedByOpponent?: boolean;
  myDrawOffered?: boolean;
  drawDeclinedNotice?: boolean;
  dailyStreak?: number;
  activeModifiersCount?: number;
  disconnectGraceSeconds?: number | null;
  nickname?: string;
  opponentNickname?: string | null;
  onSelectMode: (mode: GameMode) => void;
  onToggleMode?: () => void;
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
  onOpenNicknameModal?: () => void;
}

const sectorKeys = [
  'topLeft',
  'topCenter',
  'topRight',
  'centerLeft',
  'center',
  'centerRight',
  'bottomLeft',
  'bottomCenter',
  'bottomRight',
] as const;

export const GameStatus: React.FC<GameStatusProps> = ({
  gameState,
  theme,
  timeControl,
  isSoundEnabled,
  onlineRole,
  onlinePlayer,
  connectionStatus,
  joinError,
  roomId,
  drawOfferedByOpponent,
  myDrawOffered,
  drawDeclinedNotice,
  dailyStreak,
  activeModifiersCount,
  disconnectGraceSeconds,
  nickname,
  opponentNickname,
  onSelectMode,
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
  onOpenNicknameModal,
}) => {
  const { t, language, toggleLanguage } = useTranslation();
  const {
    currentPlayer,
    winner,
    activeBoard,
    gameMode,
    difficulty,
    isAiThinking,
  } = gameState;

  const [isTimeMenuOpen, setIsTimeMenuOpen] = useState(false);
  const [isModeMenuOpen, setIsModeMenuOpen] = useState(false);
  const timeMenuRef = useRef<HTMLDivElement>(null);
  const modeMenuRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (timeMenuRef.current && !timeMenuRef.current.contains(e.target as Node)) {
        setIsTimeMenuOpen(false);
      }
      if (modeMenuRef.current && !modeMenuRef.current.contains(e.target as Node)) {
        setIsModeMenuOpen(false);
      }
    };
    if (isTimeMenuOpen || isModeMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isTimeMenuOpen, isModeMenuOpen]);

  const activeSectorName =
    activeBoard !== null && activeBoard >= 0 && activeBoard < 9
      ? t.sectors[sectorKeys[activeBoard]]
      : '';

  return (
    <div className="w-full max-w-[460px] sm:max-w-[480px] mx-auto mb-3">
      {/* Row 1: Brand Logo & Global App Utilities */}
      <div className="flex items-center justify-between pb-2 border-b border-[var(--line)] gap-2">
        {/* Left: Brand, Daily Streak & Modifiers */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <h1 className="flex items-center gap-1.5 font-normal">
              <HandDrawnLogo className="h-6 w-auto text-[var(--highlight-ink)]" />
              <span className="sr-only">Tic³</span>
              <span className="text-[11px] text-[var(--ink-mute)] font-light tracking-widest lowercase">
                {t.common.brandTag}
              </span>
            </h1>
          </div>

          {onOpenDailyModal && (
            <button
              type="button"
              onClick={onOpenDailyModal}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded-md border border-[var(--line)] hover:border-[var(--line-strong)] text-[var(--ink-soft)] hover:text-[var(--highlight-ink)] transition-all cursor-pointer font-sans lowercase text-[11px]"
              title={t.header.dailyTitle}
            >
              <Flame
                size={12}
                className={dailyStreak && dailyStreak > 0 ? 'fill-amber-500 text-amber-500' : ''}
              />
              <span>
                {dailyStreak && dailyStreak > 0
                  ? `${dailyStreak}${t.common.daysShort}`
                  : t.header.dailyButton}
              </span>
            </button>
          )}

          {/* Nickname Button */}
          {onOpenNicknameModal && (
            <button
              type="button"
              onClick={onOpenNicknameModal}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded-md border border-[var(--line)] hover:border-[var(--line-strong)] text-[var(--ink-soft)] hover:text-[var(--highlight-ink)] transition-all cursor-pointer font-sans lowercase text-[11px] max-w-[85px] sm:max-w-[120px] truncate"
              title={t.header.nicknameTitle}
              aria-label={t.header.nicknameTitle}
            >
              <User size={12} className="shrink-0 text-[var(--ink-soft)]" />
              <span className="truncate">{nickname || 'player'}</span>
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
              title={t.header.modifiersTitle}
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

        {/* Right: Clock, Language Switch, Sound, Theme, Rules */}
        <div className="flex items-center gap-1.5 text-xs">
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
              title={t.header.clockTitle}
              aria-label={t.header.clockTitle}
            >
              <Clock size={13} />
              <span>{t.header.timeLabels[timeControl]}</span>
            </button>

            {isTimeMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 z-40 py-1 px-1 min-w-[145px] rounded-lg bg-[var(--bg)] border border-[var(--line-strong)] shadow-lg animate-fade-up text-xs font-sans">
                <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-[var(--ink-mute)] font-medium border-b border-[var(--line)] mb-1">
                  {t.header.clockMenuHeader}
                </div>
                {(
                  [
                    { value: 'off', label: t.header.timeOptions.off },
                    { value: 60, label: t.header.timeOptions[60] },
                    { value: 120, label: t.header.timeOptions[120] },
                    { value: 180, label: t.header.timeOptions[180] },
                    { value: 300, label: t.header.timeOptions[300] },
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

          {/* Language Switcher (RU / EN) */}
          <button
            type="button"
            onClick={toggleLanguage}
            className="px-1.5 py-1 rounded-md border border-[var(--line)] hover:border-[var(--line-strong)] text-[var(--ink-soft)] hover:text-[var(--highlight-ink)] transition-all cursor-pointer font-mono font-medium text-[11px] uppercase tracking-wider"
            title={language === 'ru' ? 'Switch to English' : 'Переключить на русский'}
            aria-label={t.header.langToggle}
          >
            {language === 'ru' ? 'EN' : 'RU'}
          </button>

          {/* Sound toggle (Paper ASMR) */}
          <button
            type="button"
            onClick={onToggleSound}
            className="p-1.5 rounded-md border border-[var(--line)] hover:border-[var(--line-strong)] text-[var(--ink-soft)] hover:text-[var(--highlight-ink)] transition-all cursor-pointer"
            title={isSoundEnabled ? t.header.soundOn : t.header.soundOff}
            aria-label={isSoundEnabled ? t.header.soundOn : t.header.soundOff}
          >
            {isSoundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
          </button>

          {/* Theme toggle (Light / Dark) */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="p-1.5 rounded-md border border-[var(--line)] hover:border-[var(--line-strong)] text-[var(--ink-soft)] hover:text-[var(--highlight-ink)] transition-all cursor-pointer"
            title={theme === 'dark' ? t.header.lightTheme : t.header.darkTheme}
            aria-label={theme === 'dark' ? t.header.lightTheme : t.header.darkTheme}
          >
            {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
          </button>

          {/* Rules button */}
          <button
            type="button"
            onClick={onOpenRules}
            aria-label={t.header.rulesTitle}
            className="p-1.5 rounded-md border border-[var(--line)] hover:border-[var(--line-strong)] text-[var(--ink-soft)] hover:text-[var(--highlight-ink)] transition-colors cursor-pointer"
            title={t.header.rulesTitle}
          >
            <HelpCircle size={13} />
          </button>
        </div>
      </div>

      {/* Row 2: Mode Navigation & Active Mode Controls */}
      <div className="flex items-center justify-between pt-2 pb-1 gap-2 text-xs">
        {/* Mode Selector Dropdown */}
        <div className="relative" ref={modeMenuRef}>
          <button
            type="button"
            onClick={() => setIsModeMenuOpen((prev) => !prev)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border transition-all cursor-pointer font-sans lowercase text-xs ${
              isModeMenuOpen
                ? 'border-[var(--line-strong)] text-[var(--highlight-ink)] bg-[var(--active-board-bg)] font-medium shadow-xs'
                : gameMode === 'daily'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 font-medium'
                : 'border-[var(--line)] hover:border-[var(--line-strong)] text-[var(--ink-soft)] hover:text-[var(--highlight-ink)]'
            }`}
            title={t.modes.chooseMode}
            aria-label={t.modes.chooseMode}
          >
            {gameMode === 'ai' ? (
              <>
                <Bot size={13} />
                <span>{t.modes.ai.label}</span>
              </>
            ) : gameMode === 'pvp' ? (
              <>
                <Users size={13} />
                <span>{t.modes.pvp.label}</span>
              </>
            ) : gameMode === 'daily' ? (
              <>
                <Flame size={13} className="fill-amber-500 text-amber-500" />
                <span>{t.modes.daily.label}</span>
              </>
            ) : (
              <>
                <Globe size={13} />
                <span>{t.modes.online.label}</span>
              </>
            )}
            <ChevronDown
              size={11}
              className={`transition-transform duration-200 opacity-60 ${
                isModeMenuOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {isModeMenuOpen && (
            <div className="absolute left-0 top-full mt-1.5 z-40 py-1 px-1 min-w-[210px] rounded-lg bg-[var(--bg)] border border-[var(--line-strong)] shadow-lg animate-fade-up text-xs font-sans">
              <div className="px-2.5 py-1 text-[10px] uppercase tracking-wider text-[var(--ink-mute)] font-medium border-b border-[var(--line)] mb-1">
                {t.modes.chooseMode}
              </div>
              {[
                {
                  mode: 'ai' as const,
                  label: t.modes.ai.label,
                  desc: t.modes.ai.desc,
                  icon: Bot,
                },
                {
                  mode: 'pvp' as const,
                  label: t.modes.pvp.label,
                  desc: t.modes.pvp.desc,
                  icon: Users,
                },
                {
                  mode: 'online' as const,
                  label: t.modes.online.label,
                  desc: t.modes.online.desc,
                  icon: Globe,
                },
              ].map(({ mode, label, desc, icon: Icon }) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    onSelectMode(mode);
                    setIsModeMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded text-left transition-colors cursor-pointer ${
                    gameMode === mode
                      ? 'bg-[var(--line)] text-[var(--highlight-ink)] font-medium'
                      : 'text-[var(--ink-soft)] hover:text-[var(--highlight-ink)] hover:bg-[var(--line)]/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon size={14} className="shrink-0" />
                    <div className="flex flex-col">
                      <span className="lowercase font-medium">{label}</span>
                      <span className="text-[10px] text-[var(--ink-mute)] font-normal leading-tight">
                        {desc}
                      </span>
                    </div>
                  </div>
                  {gameMode === mode && (
                    <span className="text-[11px] font-semibold text-[var(--highlight-ink)] ml-2">
                      ✓
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right side: Controls for current active mode */}
        <div className="flex items-center gap-1.5 text-xs">
          {/* Difficulty selector (when in vs ai mode) */}
          {gameMode === 'ai' && (
            <div className="flex items-center rounded-md border border-[var(--line)] p-0.5 text-[11px] font-sans lowercase">
              {(
                [
                  { lvl: 'easy', label: t.difficulties.easy },
                  { lvl: 'medium', label: t.difficulties.medium },
                  { lvl: 'hard', label: t.difficulties.hard },
                  { lvl: 'qnet', label: t.difficulties.qnet },
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

          {/* Room Trigger (when in online mode) */}
          {gameMode === 'online' && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onOpenOnlineModal}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-[var(--line)] hover:border-[var(--line-strong)] text-[var(--ink-soft)] hover:text-[var(--highlight-ink)] transition-all cursor-pointer font-sans lowercase text-xs"
                title={language === 'ru' ? 'открыть комнату / пригласить друга' : 'open room / invite friend'}
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
                    ? language === 'ru' ? 'в сети' : 'online'
                    : connectionStatus === 'waiting'
                    ? language === 'ru' ? 'ожидание…' : 'waiting…'
                    : connectionStatus === 'connecting'
                    ? language === 'ru' ? 'вход…' : 'joining…'
                    : roomId
                    ? `#${roomId}`
                    : language === 'ru' ? 'код комнаты' : 'room code'}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Disconnect Grace Period Countdown Banner */}
      {typeof disconnectGraceSeconds === 'number' && disconnectGraceSeconds > 0 && (
        <div className="pt-2">
          <div className="flex items-center justify-between p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs w-full text-rose-500 animate-fade-up">
            <span className="lowercase">
              {t.status.opponentDisconnected.replace('{seconds}', String(disconnectGraceSeconds))}
            </span>
            <span className="text-[11px] text-[var(--ink-mute)] lowercase">
              {language === 'ru' ? 'иначе тех. победа' : 'forfeit countdown'}
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
                {t.actions.drawOfferedBanner}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={onAcceptDraw}
                  className="px-2.5 py-1 rounded bg-[var(--highlight-ink)] text-[var(--bg)] font-medium lowercase hover:opacity-90 transition-opacity cursor-pointer"
                >
                  {t.actions.acceptDraw}
                </button>
                <button
                  type="button"
                  onClick={onDeclineDraw}
                  className="px-2 py-1 rounded border border-[var(--line-strong)] text-[var(--ink-soft)] hover:text-[var(--highlight-ink)] lowercase transition-colors cursor-pointer"
                >
                  {t.actions.declineDraw}
                </button>
              </div>
            </div>
          ) : myDrawOffered ? (
            <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--line)]/20 border border-[var(--line)] text-xs text-[var(--ink-soft)] lowercase animate-fade-up">
              <span>{t.actions.offered}</span>
            </div>
          ) : drawDeclinedNotice ? (
            <div className="flex items-center justify-between p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-500 lowercase animate-fade-up">
              <span>{t.actions.declined}</span>
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
                    {language === 'ru' ? 'ожидание соперника… (отправьте ссылку)' : 'waiting for opponent… (send link)'}
                  </button>
                )}
                {connectionStatus === 'connecting' && (
                  <span className="text-xs text-[var(--ink-mute)] lowercase animate-pulse">
                    {t.onlineModal.statusConnecting}
                  </span>
                )}
                {connectionStatus === 'disconnected' && (
                  <span className="text-xs text-rose-500 lowercase">
                    {language === 'ru' ? 'соперник отключился' : 'opponent disconnected'}
                  </span>
                )}
                {connectionStatus === 'error' && (
                  <span className="text-xs text-rose-500 lowercase">
                    {joinError === 'timeout'
                      ? t.onlineModal.errorTimeout
                      : joinError === 'not_found'
                      ? t.onlineModal.errorNotFound
                      : t.onlineModal.errorConnectionFailed}
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-[var(--ink-soft)] lowercase">
                  {language === 'ru' ? 'ход:' : 'turn:'}
                </span>
                <span className="inline-flex items-center gap-1.5 font-medium text-[var(--highlight-ink)]">
                  {currentPlayer === 'X' ? (
                    <HandDrawnX variant={0} className="w-3.5 h-3.5 text-[var(--highlight-ink)]" />
                  ) : (
                    <HandDrawnO variant={0} className="w-3.5 h-3.5 text-[var(--highlight-ink)]" />
                  )}
                  {gameMode === 'ai' && currentPlayer !== gameState.humanPlayer && (
                    <span className="text-xs text-[var(--ink-mute)] font-normal">
                      {isAiThinking
                        ? `(${difficulty === 'qnet' ? t.status.qnetThinking : t.status.aiThinking})`
                        : `(${language === 'ru' ? 'ии' : 'ai'})`}
                    </span>
                  )}
                  {gameMode === 'online' && (
                    <span className="text-xs text-[var(--ink-soft)] font-normal lowercase">
                      {(onlinePlayer
                        ? currentPlayer === onlinePlayer
                        : (onlineRole === 'host' && currentPlayer === 'X') ||
                          (onlineRole === 'guest' && currentPlayer === 'O'))
                        ? `· ${nickname ? `${nickname} (${t.status.yourTurn})` : t.status.yourTurn}`
                        : `· ${opponentNickname ? `${opponentNickname} (${t.status.opponentTurn})` : t.status.opponentTurn}`}
                    </span>
                  )}
                </span>
              </div>
            )
          ) : (
            <span className="text-xs text-[var(--ink-mute)] lowercase">
              {language === 'ru' ? 'партия завершена' : 'game finished'}
            </span>
          )}
        </div>

        {/* Sector Target Guidance with Mini-Grid Locator & Free Play badge */}
        {winner === null && (
          <div className="flex items-center gap-2 text-xs text-[var(--ink-soft)] lowercase">
            {activeBoard === null ? (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--line)] text-[var(--highlight-ink)] font-medium text-[11px] animate-pulse lowercase"
                title={t.status.freeMoveTooltip}
              >
                ✦ {t.status.freeMove}
              </span>
            ) : (
              <div className="flex items-center gap-1.5">
                <span>{language === 'ru' ? 'цель:' : 'target:'} {activeSectorName}</span>
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
