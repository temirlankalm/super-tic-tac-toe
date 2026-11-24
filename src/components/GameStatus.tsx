'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  PencilBot,
  PencilCheck,
  PencilChevronDown,
  PencilClock,
  PencilFlame,
  PencilGlobe,
  PencilHelp,
  PencilMoon,
  PencilSliders,
  PencilSun,
  PencilTrophy,
  PencilUser,
  PencilUsers,
  PencilVolumeOff,
  PencilVolumeOn,
} from './hand-drawn/PencilIcons';
import {
  AiDifficulty,
  ConnectionStatus,
  GameMode,
  GameState,
  OnlineRole,
  Player,
  RoomJoinError,
  SideChoice,
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
  rematchSwappedNotice?: boolean;
  dailyStreak?: number;
  activeModifiersCount?: number;
  disconnectGraceSeconds?: number | null;
  nickname?: string;
  opponentNickname?: string | null;
  rating?: number;
  isProvisional?: boolean;
  aiSidePreference?: SideChoice;
  humanPlayer?: Player;
  onSelectAiSide?: (side: SideChoice) => void;
  pvpFirstPlayer?: 'p1' | 'p2';
  onTogglePvpFirstPlayer?: () => void;
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
  onLeaveRoom?: () => void;
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
  rematchSwappedNotice,
  dailyStreak,
  activeModifiersCount,
  disconnectGraceSeconds,
  nickname,
  opponentNickname,
  rating,
  isProvisional,
  aiSidePreference = 'X',
  humanPlayer = 'X',
  onSelectAiSide,
  pvpFirstPlayer = 'p1',
  onTogglePvpFirstPlayer,
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
  onLeaveRoom,
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
    <div className="w-full max-w-[430px] sm:max-w-[540px] mx-auto mb-3">
      {/* Row 1: Brand Logo & Global App Utilities */}
      <div className="flex flex-wrap items-center justify-between pb-2.5 border-b border-dashed border-[var(--line-strong)] gap-y-2 gap-x-2">
        {/* Left: Brand, Daily Streak, Nickname, Elo, & Modifiers */}
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          <div className="flex items-center gap-1.5 mr-0.5">
            <h1 className="flex items-center gap-1.5 font-normal">
              <HandDrawnLogo className="h-6 w-auto text-[var(--highlight-ink)]" />
              <span className="sr-only">Tic³</span>
              <span className="font-hand text-[15px] leading-none text-[var(--ink-soft)] tracking-wide lowercase">
                {t.common.brandTag}
              </span>
            </h1>
          </div>

          {onOpenDailyModal && (
            <button
              type="button"
              onClick={onOpenDailyModal}
              className={`pencil-chip flex items-center gap-1 px-2 py-0.5 text-[var(--ink-soft)] cursor-pointer font-sans lowercase text-[11px] min-h-[34px] sm:min-h-[28px] ${
                dailyStreak && dailyStreak > 0 ? 'pencil-chip-active' : ''
              }`}
              title={t.header.dailyTitle}
            >
              <PencilFlame className="w-3.5 h-3.5 shrink-0" />
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
              className="pencil-chip flex items-center gap-1 px-2 py-0.5 text-[var(--ink-soft)] cursor-pointer font-sans text-[11px] max-w-[100px] sm:max-w-[140px] truncate min-h-[34px] sm:min-h-[28px]"
              title={t.header.nicknameTitle}
              aria-label={t.header.nicknameTitle}
            >
              <PencilUser className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{nickname || 'Player'}</span>
            </button>
          )}

          {/* Elo Rating & Global Leaderboard Link */}
          <Link
            href="/leaderboard"
            className="pencil-chip flex items-center gap-1 px-2 py-0.5 text-[var(--ink-soft)] cursor-pointer font-sans lowercase text-[11px] min-h-[34px] sm:min-h-[28px]"
            title={t.header.leaderboardTitle}
          >
            <PencilTrophy className="w-3.5 h-3.5 shrink-0 text-[var(--highlight-ink)]" />
            <span className="font-mono font-medium text-[var(--highlight-ink)]">
              {rating ?? 1000}
            </span>
            {isProvisional && (
              <span className="text-[9px] px-1 rounded-[3px] bg-[var(--accent-wash-strong)] text-[var(--highlight-ink)] font-mono font-semibold">
                ?
              </span>
            )}
          </Link>

          {onOpenSettingsModal && (
            <button
              type="button"
              onClick={onOpenSettingsModal}
              className={`pencil-chip flex items-center gap-1 px-2 py-0.5 cursor-pointer font-sans lowercase text-[11px] min-h-[34px] sm:min-h-[28px] ${
                activeModifiersCount && activeModifiersCount > 0
                  ? 'pencil-chip-active font-medium'
                  : 'text-[var(--ink-soft)]'
              }`}
              title={t.header.modifiersTitle}
              aria-label={t.header.modifiersTitle}
            >
              <PencilSliders className="w-3.5 h-3.5 shrink-0" />
              <span>{t.header.modifiersButton}</span>
              {activeModifiersCount && activeModifiersCount > 0 && (
                <span className="text-[9px] px-1 rounded-[3px] bg-[var(--highlight-ink)] text-[var(--bg)] font-mono font-medium">
                  {activeModifiersCount}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Right: Clock, Language Switch, Sound, Theme, Rules */}
        <div className="flex items-center gap-1 text-xs shrink-0">
          {/* Chess Clock Timer Selector */}
          <div className="relative" ref={timeMenuRef}>
            <button
              type="button"
              onClick={() => setIsTimeMenuOpen((prev) => !prev)}
              aria-haspopup="menu"
              aria-expanded={isTimeMenuOpen}
              className={`pencil-chip flex items-center gap-1 px-2 py-0.5 cursor-pointer font-sans lowercase text-[11px] min-h-[34px] sm:min-h-[28px] ${
                timeControl !== 'off'
                  ? 'pencil-chip-active font-medium'
                  : 'text-[var(--ink-soft)]'
              }`}
              title={t.header.clockTitle}
              aria-label={t.header.clockTitle}
            >
              <PencilClock className="w-3.5 h-3.5 shrink-0" />
              <span>{t.header.timeLabels[timeControl]}</span>
            </button>

            {isTimeMenuOpen && (
              <div
                role="menu"
                aria-label={t.header.clockMenuHeader}
                className="pencil-card absolute right-0 top-full mt-1.5 z-40 py-1.5 px-1.5 min-w-[155px] animate-fade-up text-xs font-sans"
              >
                <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-[var(--ink-mute)] font-medium border-b border-dashed border-[var(--line)] mb-1">
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
                    role="menuitem"
                    onClick={() => {
                      onSetTimeControl(opt.value);
                      setIsTimeMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2 py-1.5 rounded-[5px_3px_6px_4px] text-left transition-colors cursor-pointer ${
                      timeControl === opt.value
                        ? 'bg-[var(--accent-wash)] text-[var(--highlight-ink)] font-medium'
                        : 'text-[var(--ink-soft)] hover:text-[var(--highlight-ink)] hover:bg-[var(--surface-hover)]'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {timeControl === opt.value && <PencilCheck className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Language Switcher (RU / EN) */}
          <button
            type="button"
            onClick={toggleLanguage}
            className="pencil-chip px-2 py-0.5 text-[var(--ink-soft)] cursor-pointer font-mono font-medium text-[11px] uppercase tracking-wider min-h-[34px] sm:min-h-[28px] flex items-center justify-center"
            title={language === 'ru' ? 'Switch to English' : 'Переключить на русский'}
            aria-label={t.header.langToggle}
          >
            {language === 'ru' ? 'EN' : 'RU'}
          </button>

          {/* Sound toggle (Paper ASMR) */}
          <button
            type="button"
            onClick={onToggleSound}
            className="pencil-chip p-1 text-[var(--ink-soft)] cursor-pointer min-h-[34px] min-w-[34px] sm:min-h-[28px] sm:min-w-[28px] flex items-center justify-center"
            title={isSoundEnabled ? t.header.soundOn : t.header.soundOff}
            aria-label={isSoundEnabled ? t.header.soundOn : t.header.soundOff}
          >
            {isSoundEnabled ? (
              <PencilVolumeOn className="w-3.5 h-3.5" />
            ) : (
              <PencilVolumeOff className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Theme toggle (Light / Dark) */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="pencil-chip p-1 text-[var(--ink-soft)] cursor-pointer min-h-[34px] min-w-[34px] sm:min-h-[28px] sm:min-w-[28px] flex items-center justify-center"
            title={theme === 'dark' ? t.header.lightTheme : t.header.darkTheme}
            aria-label={theme === 'dark' ? t.header.lightTheme : t.header.darkTheme}
          >
            {theme === 'dark' ? (
              <PencilSun className="w-3.5 h-3.5" />
            ) : (
              <PencilMoon className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Rules button */}
          <button
            type="button"
            onClick={onOpenRules}
            aria-label={t.header.rulesTitle}
            className="pencil-chip p-1 text-[var(--ink-soft)] cursor-pointer min-h-[34px] min-w-[34px] sm:min-h-[28px] sm:min-w-[28px] flex items-center justify-center"
            title={t.header.rulesTitle}
          >
            <PencilHelp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Row 2: Mode Navigation & Active Mode Controls */}
      <div className="flex flex-wrap items-center justify-between pt-2.5 pb-1 gap-2 text-xs">
        {/* Mode Selector Dropdown */}
        <div className="relative flex items-center gap-1.5" ref={modeMenuRef}>
          <button
            type="button"
            onClick={() => setIsModeMenuOpen((prev) => !prev)}
            aria-haspopup="menu"
            aria-expanded={isModeMenuOpen}
            className={`pencil-chip flex items-center gap-1.5 px-2.5 py-0.5 cursor-pointer font-sans lowercase text-xs min-h-[34px] sm:min-h-[28px] ${
              isModeMenuOpen || gameMode === 'daily'
                ? 'pencil-chip-active font-medium'
                : 'text-[var(--ink-soft)]'
            }`}
            title={t.modes.chooseMode}
            aria-label={t.modes.chooseMode}
          >
            {gameMode === 'ai' ? (
              <>
                <PencilBot className="w-3.5 h-3.5" />
                <span>{t.modes.ai.label}</span>
              </>
            ) : gameMode === 'pvp' ? (
              <>
                <PencilUsers className="w-3.5 h-3.5" />
                <span>{t.modes.pvp.label}</span>
              </>
            ) : gameMode === 'daily' ? (
              <>
                <PencilFlame className="w-3.5 h-3.5" />
                <span>{t.modes.daily.label}</span>
              </>
            ) : (
              <>
                <PencilGlobe className="w-3.5 h-3.5" />
                <span>{t.modes.online.label}</span>
              </>
            )}
            <PencilChevronDown
              className={`w-3 h-3 transition-transform duration-200 opacity-70 ${
                isModeMenuOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          <span
            className={`text-[10px] font-mono px-1.5 py-0.5 rounded-[4px_3px_5px_3px] border lowercase inline-flex ${
              gameMode === 'ai' || gameMode === 'online'
                ? 'highlighter-mark text-[var(--highlight-ink)] border-[var(--accent-border)] font-medium'
                : 'bg-[var(--surface)] text-[var(--ink-mute)] border-[var(--line)]'
            }`}
          >
            {gameMode === 'ai' || gameMode === 'online' ? t.modes.rated : t.modes.notRated}
          </span>

          {isModeMenuOpen && (
            <div
              role="menu"
              aria-label={t.modes.chooseMode}
              className="pencil-card absolute left-0 top-full mt-1.5 z-40 py-1.5 px-1.5 min-w-[220px] animate-fade-up text-xs font-sans"
            >
              <div className="px-2.5 py-1 text-[10px] uppercase tracking-wider text-[var(--ink-mute)] font-medium border-b border-dashed border-[var(--line)] mb-1">
                {t.modes.chooseMode}
              </div>
              {[
                {
                  mode: 'ai' as const,
                  label: t.modes.ai.label,
                  desc: t.modes.ai.desc,
                  icon: PencilBot,
                  isRated: true,
                },
                {
                  mode: 'pvp' as const,
                  label: t.modes.pvp.label,
                  desc: t.modes.pvp.desc,
                  icon: PencilUsers,
                  isRated: false,
                },
                {
                  mode: 'online' as const,
                  label: t.modes.online.label,
                  desc: t.modes.online.desc,
                  icon: PencilGlobe,
                  isRated: true,
                },
              ].map(({ mode, label, desc, icon: Icon, isRated }) => (
                <button
                  key={mode}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onSelectMode(mode);
                    setIsModeMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-[6px_4px_7px_5px] text-left transition-colors cursor-pointer ${
                    gameMode === mode
                      ? 'bg-[var(--accent-wash)] text-[var(--highlight-ink)] font-medium'
                      : 'text-[var(--ink-soft)] hover:text-[var(--highlight-ink)] hover:bg-[var(--surface-hover)]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="lowercase font-medium">{label}</span>
                        <span
                          className={`text-[9px] font-mono px-1 py-0.2 rounded-[3px] uppercase ${
                            isRated
                              ? 'highlighter-mark text-[var(--highlight-ink)] border border-[var(--accent-border)]'
                              : 'bg-[var(--line)]/40 text-[var(--ink-mute)]'
                          }`}
                        >
                          {isRated ? t.modes.rated : t.modes.notRated}
                        </span>
                      </div>
                      <span className="text-[10px] text-[var(--ink-mute)] font-normal leading-tight">
                        {desc}
                      </span>
                    </div>
                  </div>
                  {gameMode === mode && (
                    <PencilCheck className="w-3.5 h-3.5 text-[var(--highlight-ink)] ml-2 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right side: Controls for current active mode */}
        <div className="flex items-center gap-1.5 text-xs flex-wrap justify-end">
          {/* AI Side Selector: X | O | Random */}
          {gameMode === 'ai' && onSelectAiSide && (
            <div
              className="pencil-chip flex items-center p-0.5 text-[11px] font-sans lowercase min-h-[34px] sm:min-h-[28px]"
              title={t.sideSelection.chooseSide}
            >
              {(['X', 'O', 'random'] as const).map((side) => {
                const isSelected = aiSidePreference === side;
                const canChange =
                  gameState.history.length === 0 ||
                  (gameState.history.length === 1 && humanPlayer === 'O' && !gameState.isAiThinking);
                return (
                  <button
                    key={side}
                    type="button"
                    disabled={!canChange}
                    onClick={() => onSelectAiSide(side)}
                    className={`px-1.5 py-0.5 rounded-[4px_3px_5px_3px] transition-all ${
                      isSelected
                        ? 'bg-[var(--accent-wash-strong)] text-[var(--highlight-ink)] font-semibold border border-[var(--accent-border)]'
                        : 'text-[var(--ink-mute)] hover:text-[var(--ink-soft)] border border-transparent'
                    } ${!canChange ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                    title={
                      side === 'random'
                        ? t.sideSelection.random
                        : `${t.sideSelection.side} ${side}`
                    }
                  >
                    {side === 'random' ? '?' : side}
                  </button>
                );
              })}
            </div>
          )}

          {/* Difficulty selector (when in vs ai mode) */}
          {gameMode === 'ai' && (
            <div className="pencil-chip flex items-center p-0.5 text-[11px] font-sans lowercase min-h-[34px] sm:min-h-[28px]">
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
                  className={`px-1.5 py-0.5 rounded-[4px_3px_5px_3px] transition-all cursor-pointer ${
                    difficulty === lvl
                      ? 'bg-[var(--accent-wash-strong)] text-[var(--highlight-ink)] font-semibold border border-[var(--accent-border)]'
                      : 'text-[var(--ink-mute)] hover:text-[var(--ink-soft)] border border-transparent'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* PvP X First toggle */}
          {gameMode === 'pvp' && onTogglePvpFirstPlayer && (
            <button
              type="button"
              disabled={gameState.history.length > 0}
              onClick={onTogglePvpFirstPlayer}
              className={`pencil-chip px-2 py-0.5 text-[11px] font-sans lowercase min-h-[34px] sm:min-h-[28px] ${
                gameState.history.length > 0
                  ? 'opacity-40 cursor-not-allowed'
                  : 'text-[var(--ink-soft)] cursor-pointer'
              }`}
              title={t.sideSelection.pvpXFirst.replace(
                '{player}',
                pvpFirstPlayer === 'p1' ? t.sideSelection.player1 : t.sideSelection.player2
              )}
            >
              <span>
                X: {pvpFirstPlayer === 'p1' ? t.sideSelection.player1 : t.sideSelection.player2}
              </span>
            </button>
          )}

          {/* Room Trigger (when in online mode) */}
          {gameMode === 'online' && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onOpenOnlineModal}
                className={`pencil-chip flex items-center gap-1.5 px-2.5 py-0.5 cursor-pointer font-sans lowercase text-xs min-h-[34px] sm:min-h-[28px] ${
                  connectionStatus === 'connected' ? 'pencil-chip-active' : 'text-[var(--ink-soft)]'
                }`}
                title={language === 'ru' ? 'открыть комнату / пригласить друга' : 'open room / invite friend'}
              >
                <span
                  className={`w-2 h-2 rounded-full border border-[var(--highlight-ink)] ${
                    connectionStatus === 'connected'
                      ? 'bg-[var(--accent)]'
                      : connectionStatus === 'waiting' ||
                        connectionStatus === 'connecting' ||
                        connectionStatus === 'reconnecting'
                      ? 'bg-[var(--accent-wash-strong)] animate-pulse'
                      : connectionStatus === 'disconnected' || connectionStatus === 'error'
                      ? 'bg-[var(--highlight-ink)]'
                      : 'bg-transparent'
                  }`}
                />
                <span>
                  {connectionStatus === 'connected'
                    ? language === 'ru' ? 'в сети' : 'online'
                    : connectionStatus === 'waiting'
                    ? language === 'ru' ? 'ожидание…' : 'waiting…'
                    : connectionStatus === 'connecting'
                    ? language === 'ru' ? 'вход…' : 'joining…'
                    : connectionStatus === 'reconnecting'
                    ? t.onlineModal.reconnecting
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
          <div className="pencil-card flex items-center justify-between p-2.5 text-xs w-full text-[var(--highlight-ink)] animate-fade-up">
            <span className="lowercase font-medium">
              {t.status.opponentDisconnected.replace('{seconds}', String(disconnectGraceSeconds))}
            </span>
            <span className="text-[11px] text-[var(--ink-soft)] lowercase">
              {language === 'ru' ? 'иначе тех. победа' : 'forfeit countdown'}
            </span>
          </div>
        </div>
      )}

      {/* Online Draw Offer Negotiation Banner */}
      {gameMode === 'online' && winner === null && (
        <div className="pt-2">
          {drawOfferedByOpponent ? (
            <div className="pencil-card flex items-center justify-between p-2.5 text-xs animate-fade-up">
              <span className="text-[var(--highlight-ink)] lowercase font-medium">
                {t.actions.drawOfferedBanner}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={onAcceptDraw}
                  className="pencil-btn-primary px-2.5 py-1 font-medium lowercase cursor-pointer"
                >
                  {t.actions.acceptDraw}
                </button>
                <button
                  type="button"
                  onClick={onDeclineDraw}
                  className="pencil-btn-secondary px-2 py-1 lowercase cursor-pointer"
                >
                  {t.actions.declineDraw}
                </button>
              </div>
            </div>
          ) : myDrawOffered ? (
            <div className="pencil-card flex items-center justify-between p-2 text-xs text-[var(--ink-soft)] lowercase animate-fade-up">
              <span>{t.actions.offered}</span>
            </div>
          ) : drawDeclinedNotice ? (
            <div className="pencil-card flex items-center justify-between p-2 text-xs text-[var(--highlight-ink)] lowercase animate-fade-up">
              <span>{t.actions.declined}</span>
            </div>
          ) : null}
        </div>
      )}

      {/* Online Rematch Sides Swapped Notice Banner */}
      {gameMode === 'online' && rematchSwappedNotice && (
        <div className="pt-2">
          <div className="pencil-card highlighter-mark flex items-center justify-between p-2 text-xs text-[var(--highlight-ink)] lowercase animate-fade-up">
            <span>{t.sideSelection.swappedNotice}</span>
            <span className="text-[11px] text-[var(--ink-soft)]">
              ({(onlinePlayer || 'X') === 'O' ? t.sideSelection.youAreO : t.sideSelection.youAreX})
            </span>
          </div>
        </div>
      )}

      {/* Live Status Bar (Turn Indicator & Target Sector Guidance) */}
      <div className="flex items-center justify-between pt-2.5 text-xs min-h-[30px]">
        {/* Game State Message */}
        <div className="flex items-center gap-2">
          {winner === null ? (
            gameMode === 'online' && connectionStatus !== 'connected' ? (
              <div className="flex items-center gap-2 flex-wrap animate-fade-up">
                {connectionStatus === 'waiting' && (
                  <button
                    type="button"
                    onClick={onOpenOnlineModal}
                    className="hairline-link text-xs text-[var(--ink-soft)] hover:text-[var(--highlight-ink)] lowercase cursor-pointer"
                  >
                    {language === 'ru' ? 'ожидание соперника… (отправьте ссылку)' : 'waiting for opponent… (send link)'}
                  </button>
                )}
                {connectionStatus === 'connecting' && (
                  <span className="text-xs text-[var(--ink-soft)] lowercase animate-pulse">
                    {t.onlineModal.statusConnecting}
                  </span>
                )}
                {connectionStatus === 'disconnected' && (
                  <span className="text-xs text-[var(--highlight-ink)] font-medium lowercase">
                    {language === 'ru' ? 'соперник отключился' : 'opponent disconnected'}
                  </span>
                )}
                {connectionStatus === 'reconnecting' && (
                  <span className="text-xs text-[var(--highlight-ink)] lowercase animate-pulse">
                    {t.onlineModal.reconnecting}
                  </span>
                )}
                {connectionStatus === 'error' && (
                  <span className="text-xs text-[var(--highlight-ink)] font-medium lowercase">
                    {joinError === 'timeout'
                      ? t.onlineModal.errorTimeout
                      : joinError === 'not_found'
                      ? t.onlineModal.errorNotFound
                      : joinError === 'room_full'
                      ? t.onlineModal.errorRoomFull
                      : t.onlineModal.errorConnectionFailed}
                  </span>
                )}
                {onLeaveRoom && (
                  <button
                    type="button"
                    onClick={onLeaveRoom}
                    className="pencil-chip px-2 py-0.5 text-[11px] text-[var(--ink-soft)] cursor-pointer lowercase"
                  >
                    {t.common.cancel}
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                {/* Visual Mark of Current Player */}
                <div className="flex items-center gap-1.5 font-medium text-[var(--highlight-ink)]">
                  {currentPlayer === 'X' ? (
                    <HandDrawnX variant={0} className="w-3.5 h-3.5 text-[var(--highlight-ink)]" />
                  ) : (
                    <HandDrawnO variant={0} className="w-3.5 h-3.5 text-[var(--highlight-ink)]" />
                  )}
                </div>

                {/* VS AI Mode Status */}
                {gameMode === 'ai' && (
                  <div className="flex items-center gap-1.5">
                    {currentPlayer === humanPlayer ? (
                      <span className="px-2.5 py-0.5 rounded-[6px_3px_7px_4px] bg-[var(--highlight-ink)] text-[var(--bg)] shadow-[1.5px_1.5px_0_var(--accent)] font-medium text-[11px] lowercase animate-fade-up">
                        {t.sideSelection.yourTurn} ({humanPlayer})
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-[5px_3px_6px_4px] border border-[var(--line)] bg-[var(--surface)] text-[var(--ink-soft)] text-[11px] lowercase">
                        {isAiThinking
                          ? (difficulty === 'qnet' ? t.status.qnetThinking : t.status.aiThinking)
                          : t.sideSelection.aiTurn}
                      </span>
                    )}
                    <span className="text-[10px] text-[var(--ink-mute)] font-sans lowercase">
                      ({humanPlayer === 'X' ? t.sideSelection.youAreX : t.sideSelection.youAreO})
                    </span>
                  </div>
                )}

                {/* Online Room Mode Status */}
                {gameMode === 'online' && (
                  <div className="flex items-center gap-1.5">
                    {(onlinePlayer
                      ? currentPlayer === onlinePlayer
                      : (onlineRole === 'host' && currentPlayer === 'X') ||
                        (onlineRole === 'guest' && currentPlayer === 'O')) ? (
                      <span className="px-2.5 py-0.5 rounded-[6px_3px_7px_4px] bg-[var(--highlight-ink)] text-[var(--bg)] shadow-[1.5px_1.5px_0_var(--accent)] font-medium text-[11px] lowercase animate-fade-up">
                        {t.status.yourTurn}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-[5px_3px_6px_4px] border border-[var(--line)] bg-[var(--surface)] text-[var(--ink-soft)] text-[11px]">
                        {opponentNickname ? (
                          <>
                            <span>{opponentNickname}</span>{' '}
                            <span className="lowercase">({t.status.opponentTurn})</span>
                          </>
                        ) : (
                          <span className="lowercase">{t.status.opponentTurn}</span>
                        )}
                      </span>
                    )}
                    <span className="text-[10px] text-[var(--ink-mute)] font-sans lowercase">
                      ({(onlinePlayer || 'X') === 'O' ? t.sideSelection.youAreO : t.sideSelection.youAreX})
                    </span>
                  </div>
                )}

                {/* Local PvP Mode Status */}
                {gameMode === 'pvp' && (
                  <span className="px-2 py-0.5 rounded-[5px_3px_6px_4px] border border-[var(--line-strong)] bg-[var(--accent-wash)] text-[var(--highlight-ink)] font-medium text-[11px] lowercase">
                    {currentPlayer === 'X'
                      ? `${language === 'ru' ? 'ход' : 'turn'}: ${
                          pvpFirstPlayer === 'p1' ? t.sideSelection.player1 : t.sideSelection.player2
                        } (X)`
                      : `${language === 'ru' ? 'ход' : 'turn'}: ${
                          pvpFirstPlayer === 'p1' ? t.sideSelection.player2 : t.sideSelection.player1
                        } (O)`}
                  </span>
                )}

                {/* Daily Challenge Mode Status */}
                {gameMode === 'daily' && (
                  <div className="flex items-center gap-1.5">
                    {currentPlayer === humanPlayer ? (
                      <span className="px-2.5 py-0.5 rounded-[6px_3px_7px_4px] bg-[var(--highlight-ink)] text-[var(--bg)] shadow-[1.5px_1.5px_0_var(--accent)] font-medium text-[11px] lowercase">
                        {t.sideSelection.yourTurn}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-[5px_3px_6px_4px] border border-[var(--line)] bg-[var(--surface)] text-[var(--ink-soft)] text-[11px] lowercase">
                        {isAiThinking ? t.status.aiThinking : t.sideSelection.aiTurn}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )
          ) : (
            <span className="font-hand text-base leading-none text-[var(--ink-soft)] lowercase">
              {language === 'ru' ? 'партия завершена' : 'game finished'}
            </span>
          )}
        </div>

        {/* Sector Target Guidance with Mini-Grid Locator & Free Play badge */}
        {winner === null && (
          <div className="flex items-center gap-2 text-xs text-[var(--ink-soft)] lowercase">
            {activeBoard === null ? (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[5px_3px_6px_4px] highlighter-mark border border-[var(--accent-border)] text-[var(--highlight-ink)] font-medium text-[11px] animate-pulse lowercase"
                title={t.status.freeMoveTooltip}
              >
                ✦ {t.status.freeMove}
              </span>
            ) : (
              <div className="flex items-center gap-1.5">
                <span>{language === 'ru' ? 'цель:' : 'target:'} {activeSectorName}</span>
                {/* Visual 3x3 Mini Sector Locator */}
                <div className="grid grid-cols-3 gap-0.5 w-4 h-4 border border-[var(--line-strong)] bg-[var(--surface)] p-0.5 rounded-[3px]">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-full h-full rounded-[0.5px] ${
                        i === activeBoard
                          ? 'bg-[var(--highlight-ink)] ring-1 ring-[var(--accent)]'
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
