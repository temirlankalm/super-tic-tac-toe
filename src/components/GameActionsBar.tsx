'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  PencilClock,
  PencilClose,
  PencilFlag,
  PencilHandshake,
  PencilReset,
  PencilShare,
  PencilTrophy,
  PencilUndo,
} from './hand-drawn/PencilIcons';
import { BoardWinner, ConnectionStatus, GameMode, OnlineRole, Player, WinReason } from '@/types/game';
import { HandDrawnO, HandDrawnX } from './hand-drawn/HandDrawnMarks';
import { useTranslation } from '@/i18n/LanguageContext';

interface GameActionsBarProps {
  gameMode: GameMode;
  winner: BoardWinner;
  winReason?: WinReason;
  /** false when the game was decided by counting boards (every board closed, no line). */
  wonByLine?: boolean;
  onlineRole?: OnlineRole;
  onlinePlayer?: Player | null;
  connectionStatus?: ConnectionStatus;
  historyLength: number;
  isAiThinking: boolean;
  canUndo: boolean;
  speedBlitzTime?: number | null;
  myDrawOffered?: boolean;
  rematchRequestedByOpponent?: boolean;
  myRematchSent?: boolean;
  aiDrawNotice?: string | null;
  myNickname?: string;
  opponentNickname?: string | null;
  difficulty?: string;
  humanPlayer?: Player;
  lastDelta?: number | null;
  newRating?: number;
  isRatedGame?: boolean;
  isProvisional?: boolean;
  onUndo: () => void;
  onReset: () => void;
  onResign: () => void;
  onOfferDraw: () => void;
  onRequestRematch?: () => void;
  onAcceptRematch?: () => void;
  onChallengeFriend?: () => void;
  onLeaveRoom?: () => void;
}

export const GameActionsBar: React.FC<GameActionsBarProps> = ({
  gameMode,
  winner,
  winReason,
  wonByLine = true,
  onlineRole,
  onlinePlayer,
  connectionStatus,
  historyLength,
  canUndo,
  speedBlitzTime,
  myDrawOffered,
  rematchRequestedByOpponent,
  myRematchSent,
  aiDrawNotice,
  myNickname,
  opponentNickname,
  difficulty,
  humanPlayer = 'X',
  lastDelta,
  newRating,
  isRatedGame,
  isProvisional,
  onUndo,
  onReset,
  onResign,
  onOfferDraw,
  onRequestRematch,
  onAcceptRematch,
  onChallengeFriend,
  onLeaveRoom,
}) => {
  const { t, language } = useTranslation();
  const [isResignConfirmOpen, setIsResignConfirmOpen] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  // Auto-scroll result panel into view on game end
  useEffect(() => {
    if (winner !== null && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [winner]);

  // 1. GAME OVER VIEW
  if (winner !== null) {
    const isOnline = gameMode === 'online';
    const isMeWinner =
      isOnline &&
      (onlinePlayer
        ? winner === onlinePlayer
        : (onlineRole === 'host' && winner === 'X') ||
          (onlineRole === 'guest' && winner === 'O'));

    let title = '';
    if (winner === 'TIE') {
      title = winReason === 'agreement' ? t.results.drawAgreement : t.results.drawGeneric;
    } else if (isOnline) {
      if (isMeWinner) {
        title = myNickname ? t.results.playerWon.replace('{name}', myNickname) : t.results.youWon;
      } else {
        title = opponentNickname ? t.results.playerWon.replace('{name}', opponentNickname) : t.results.opponentWon;
      }
    } else if (gameMode === 'ai' || gameMode === 'daily') {
      const isHumanWinner = winner === humanPlayer;
      if (isHumanWinner) {
        title = myNickname ? t.results.playerBeatAi.replace('{name}', myNickname) : t.results.youWon;
      } else {
        title = myNickname ? t.results.aiBeatPlayer.replace('{name}', myNickname) : (winner === 'X' ? t.results.xWon : t.results.oWon);
      }
    } else {
      if (winReason === 'resignation') {
        const loser = winner === 'X' ? 'O' : 'X';
        title = t.results.resignedWins.replace('{loser}', loser).replace('{winner}', winner);
      } else {
        title = winner === 'X' ? t.results.xWon : t.results.oWon;
      }
    }

    let subtitle = '';
    if (winReason === 'resignation') {
      subtitle =
        gameMode === 'pvp'
          ? ''
          : isOnline && isMeWinner
          ? t.results.opponentResigned
          : t.results.youResigned;
    } else if (winReason === 'timeout') {
      subtitle = t.results.timeOut;
    } else if (winReason === 'agreement') {
      subtitle = t.results.agreementSubtitle;
    } else if (winner !== 'TIE') {
      subtitle = wonByLine
        ? t.results.threeInRow
        : t.results.majoritySubtitle;
    }

    return (
      <div
        ref={resultRef}
        role="region"
        aria-live="polite"
        className="pencil-card w-full max-w-[430px] sm:max-w-[540px] mx-auto mt-4 p-4 sm:p-5 animate-fade-up text-center"
      >
        <div className="flex items-center justify-center gap-2 mb-1">
          {winner === 'X' ? (
            <HandDrawnX variant={0} className="w-6 h-6 text-[var(--highlight-ink)]" />
          ) : winner === 'O' ? (
            <HandDrawnO variant={0} className="w-6 h-6 text-[var(--highlight-ink)]" />
          ) : null}
          <span className="font-hand text-2xl sm:text-3xl font-semibold text-[var(--highlight-ink)] leading-tight">
            {title}
          </span>
        </div>

        {subtitle && (
          <p className="text-xs text-[var(--ink-soft)] font-light lowercase mb-3">
            {subtitle}
          </p>
        )}

        {/* Rating Delta Badge */}
        {isRatedGame && typeof newRating === 'number' && (
          <div className="my-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-[7px_4px_8px_5px] border border-[var(--line-strong)] bg-[var(--bg)] text-xs font-mono">
            <PencilTrophy className="w-3.5 h-3.5 text-[var(--highlight-ink)]" />
            <span className="text-[var(--ink-soft)]">{language === 'ru' ? 'рейтинг:' : 'rating:'}</span>
            <span className="font-semibold text-[var(--highlight-ink)]">{newRating} ELO</span>
            {typeof lastDelta === 'number' && (
              <span
                className={`font-semibold ml-0.5 px-1.5 py-0.2 rounded-[3px] ${
                  lastDelta > 0
                    ? 'highlighter-mark text-[var(--highlight-ink)] border border-[var(--accent-border)]'
                    : lastDelta < 0
                    ? 'border border-[var(--line-strong)] text-[var(--ink)]'
                    : 'text-[var(--ink-mute)]'
                }`}
              >
                {lastDelta > 0 ? `+${lastDelta}` : String(lastDelta)}
              </span>
            )}
            {isProvisional && (
              <span className="text-[10px] text-[var(--ink-soft)] lowercase font-sans ml-0.5">
                ({language === 'ru' ? 'калибровка' : 'provisional'})
              </span>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          {/* Challenge a friend button (Growth feature) */}
          {onChallengeFriend && (
            <button
              type="button"
              onClick={onChallengeFriend}
              className="pencil-btn-secondary flex items-center gap-1.5 px-3.5 py-2 text-xs font-sans font-medium lowercase cursor-pointer"
            >
              <PencilShare className="w-3.5 h-3.5" />
              <span>{t.actions.challengeFriend}</span>
            </button>
          )}

          {isOnline ? (
            rematchRequestedByOpponent ? (
              <button
                type="button"
                onClick={onAcceptRematch}
                className="pencil-btn-primary px-4 py-2 text-xs font-sans font-medium lowercase cursor-pointer"
              >
                {t.actions.acceptRematch}
              </button>
            ) : myRematchSent ? (
              <span className="px-3 py-1.5 text-xs text-[var(--ink-soft)] lowercase">
                {t.actions.offered}
              </span>
            ) : (
              <button
                type="button"
                onClick={onRequestRematch}
                className="pencil-btn-primary flex items-center gap-1.5 px-4 py-2 text-xs font-sans font-medium lowercase cursor-pointer"
              >
                <PencilReset className="w-3.5 h-3.5" />
                <span>{t.actions.rematch}</span>
              </button>
            )
          ) : (
            <button
              type="button"
              onClick={onReset}
              className="pencil-btn-primary flex items-center gap-1.5 px-4 py-2 text-xs font-sans font-medium lowercase cursor-pointer"
            >
              <PencilReset className="w-3.5 h-3.5" />
              <span>{t.actions.newGame}</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // 2. IN-GAME ACTIONS BAR
  return (
    <div className="w-full max-w-[430px] sm:max-w-[540px] mx-auto mt-3.5">
      {/* AI Draw Notice or Status feedback */}
      {aiDrawNotice && (
        <div className="pencil-card mb-2 p-2 text-center text-xs text-[var(--highlight-ink)] lowercase animate-fade-up">
          {aiDrawNotice}
        </div>
      )}

      <div className="pencil-card flex items-center justify-between px-2 py-1.5 text-xs text-[var(--ink-soft)]">
        {/* Undo button (disabled in online or when no moves) */}
        {gameMode !== 'online' ? (
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            className={`flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-[6px_4px_7px_5px] transition-colors lowercase font-sans ${
              canUndo
                ? 'hover:bg-[var(--surface-hover)] hover:text-[var(--highlight-ink)] cursor-pointer'
                : 'opacity-30 cursor-not-allowed'
            }`}
            title={language === 'ru' ? 'Отменить последний ход' : 'Undo last move'}
          >
            <PencilUndo className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{language === 'ru' ? 'ход назад' : 'undo'}</span>
          </button>
        ) : (
          <div className="w-8" />
        )}

        {/* Center Group: Speed Blitz Timer, Resign & Offer Draw */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Speed Blitz 5s Countdown Badge */}
          {speedBlitzTime !== undefined && speedBlitzTime !== null && (
            <div
              className={`flex items-center gap-1 px-2.5 py-1.5 min-h-[40px] rounded-[5px_3px_6px_4px] text-xs font-mono font-medium transition-colors ${
                speedBlitzTime <= 2.0
                  ? 'highlighter-mark border border-[var(--accent-border)] text-[var(--highlight-ink)] animate-pulse'
                  : 'bg-[var(--bg-subtle)] text-[var(--highlight-ink)]'
              }`}
              title={language === 'ru' ? 'осталось времени на текущий ход' : 'time left for current turn'}
            >
              <PencilClock className="w-3.5 h-3.5" />
              <span>{speedBlitzTime.toFixed(1)}s</span>
            </div>
          )}

          {/* Leave / Cancel Waiting Room Button */}
          {gameMode === 'online' &&
            connectionStatus !== 'connected' &&
            historyLength === 0 &&
            onLeaveRoom && (
              <button
                type="button"
                onClick={onLeaveRoom}
                className="pencil-chip flex items-center gap-1.5 px-3 py-2 min-h-[40px] text-[var(--ink)] cursor-pointer lowercase font-sans"
              >
                <PencilClose className="w-3.5 h-3.5" />
                <span>{t.onlineModal.leaveRoom}</span>
              </button>
            )}

          {/* Resign Button */}
          {historyLength > 0 && (
            isResignConfirmOpen ? (
              <div className="flex items-center gap-1.5 border border-[var(--highlight-ink)] bg-[var(--accent-wash)] px-3 py-1.5 min-h-[40px] rounded-[6px_4px_7px_5px] text-xs animate-fade-up">
                <span className="text-[var(--highlight-ink)] font-medium lowercase">{language === 'ru' ? 'сдаться?' : 'resign?'}</span>
                <button
                  type="button"
                  onClick={() => {
                    setIsResignConfirmOpen(false);
                    onResign();
                  }}
                  className="text-[var(--highlight-ink)] font-semibold hairline-link px-1.5 py-1 min-h-[36px] flex items-center cursor-pointer lowercase"
                >
                  {language === 'ru' ? 'да' : 'yes'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsResignConfirmOpen(false)}
                  className="text-[var(--ink-soft)] hover:text-[var(--highlight-ink)] px-1.5 py-1 min-h-[36px] flex items-center cursor-pointer lowercase"
                >
                  {language === 'ru' ? 'нет' : 'no'}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsResignConfirmOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-[6px_4px_7px_5px] hover:bg-[var(--surface-hover)] hover:text-[var(--highlight-ink)] transition-colors cursor-pointer lowercase font-sans"
                title={language === 'ru' ? 'Сдаться в этой партии' : 'Resign game'}
              >
                <PencilFlag className="w-3.5 h-3.5" />
                <span>{t.actions.resign}</span>
              </button>
            )
          )}

          {/* Offer Draw Button (vs AI only after at least 10 moves) */}
          {historyLength > 0 && (gameMode === 'online' || historyLength >= 10) && (
            <button
              type="button"
              onClick={onOfferDraw}
              disabled={myDrawOffered}
              className={`flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-[6px_4px_7px_5px] transition-colors lowercase font-sans ${
                myDrawOffered
                  ? 'opacity-40 cursor-not-allowed'
                  : 'hover:bg-[var(--surface-hover)] hover:text-[var(--highlight-ink)] cursor-pointer'
              }`}
              title={myDrawOffered ? t.actions.offered : t.actions.draw}
            >
              <PencilHandshake className="w-3.5 h-3.5" />
              <span>{myDrawOffered ? t.actions.offered : t.actions.draw}</span>
            </button>
          )}
        </div>

        {/* Restart Button */}
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-[6px_4px_7px_5px] hover:bg-[var(--surface-hover)] hover:text-[var(--highlight-ink)] transition-colors cursor-pointer lowercase font-sans"
          title={gameMode === 'online' ? t.actions.rematch : t.actions.newGame}
        >
          <PencilReset className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{language === 'ru' ? 'заново' : 'reset'}</span>
        </button>
      </div>
    </div>
  );
};
