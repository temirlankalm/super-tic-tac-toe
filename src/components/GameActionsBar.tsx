'use client';

import React, { useState } from 'react';
import { Undo2, RotateCcw, Flag, Handshake, Zap } from 'lucide-react';
import { BoardWinner, GameMode, OnlineRole, Player, WinReason } from '@/types/game';
import { HandDrawnO, HandDrawnX } from './hand-drawn/HandDrawnMarks';

interface GameActionsBarProps {
  gameMode: GameMode;
  winner: BoardWinner;
  winReason?: WinReason;
  /** false when the game was decided by counting boards (every board closed, no line). */
  wonByLine?: boolean;
  onlineRole?: OnlineRole;
  onlinePlayer?: Player | null;
  historyLength: number;
  isAiThinking: boolean;
  canUndo: boolean;
  speedBlitzTime?: number | null;
  myDrawOffered?: boolean;
  rematchRequestedByOpponent?: boolean;
  myRematchSent?: boolean;
  aiDrawNotice?: string | null;
  onUndo: () => void;
  onReset: () => void;
  onResign: () => void;
  onOfferDraw: () => void;
  onRequestRematch?: () => void;
  onAcceptRematch?: () => void;
}

export const GameActionsBar: React.FC<GameActionsBarProps> = ({
  gameMode,
  winner,
  winReason,
  wonByLine = true,
  onlineRole,
  onlinePlayer,
  historyLength,
  canUndo,
  speedBlitzTime,
  myDrawOffered,
  rematchRequestedByOpponent,
  myRematchSent,
  aiDrawNotice,
  onUndo,
  onReset,
  onResign,
  onOfferDraw,
  onRequestRematch,
  onAcceptRematch,
}) => {
  const [isResignConfirmOpen, setIsResignConfirmOpen] = useState(false);

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
      title = winReason === 'agreement' ? 'ничья по соглашению' : 'ничья';
    } else if (isOnline) {
      title = isMeWinner ? 'вы победили!' : 'соперник победил';
    } else {
      title = winner === 'X' ? 'крестики победили' : 'нолики победили';
    }

    let subtitle = '';
    if (winReason === 'resignation') {
      subtitle = 'соперник сдался';
    } else if (winReason === 'timeout') {
      subtitle = 'победа по времени (флаг)';
    } else if (winReason === 'agreement') {
      subtitle = 'взаимное согласие игроков';
    } else if (winner !== 'TIE') {
      subtitle = wonByLine ? '3 захваченных сектора в ряд' : 'больше захваченных секторов';
    }

    return (
      <div className="w-full max-w-[460px] sm:max-w-[480px] mx-auto mt-4 p-4 rounded-xl border border-[var(--line-strong)] bg-[var(--active-board-bg)] animate-fade-up text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          {winner === 'X' ? (
            <HandDrawnX variant={0} className="w-6 h-6 text-[var(--highlight-ink)]" />
          ) : winner === 'O' ? (
            <HandDrawnO variant={0} className="w-6 h-6 text-[var(--highlight-ink)]" />
          ) : null}
          <span className="text-base font-medium text-[var(--highlight-ink)] lowercase tracking-tight">
            {title}
          </span>
        </div>

        {subtitle && (
          <p className="text-xs text-[var(--ink-mute)] font-light lowercase mb-3">
            {subtitle}
          </p>
        )}

        <div className="flex items-center justify-center gap-2 pt-1">
          {isOnline ? (
            rematchRequestedByOpponent ? (
              <button
                type="button"
                onClick={onAcceptRematch}
                className="px-4 py-2 rounded-lg bg-[var(--highlight-ink)] text-[var(--bg)] text-xs font-sans font-medium lowercase hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
              >
                принять реванш
              </button>
            ) : myRematchSent ? (
              <span className="px-3 py-1.5 text-xs text-[var(--ink-soft)] lowercase">
                запрос на реванш отправлен…
              </span>
            ) : (
              <button
                type="button"
                onClick={onRequestRematch}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[var(--line-strong)] hover:bg-[var(--line)]/40 text-[var(--highlight-ink)] text-xs font-sans font-medium lowercase transition-colors cursor-pointer"
              >
                <RotateCcw size={13} />
                <span>предложить реванш</span>
              </button>
            )
          ) : (
            <button
              type="button"
              onClick={onReset}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--highlight-ink)] text-[var(--bg)] text-xs font-sans font-medium lowercase hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
            >
              <RotateCcw size={13} />
              <span>сыграть снова</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // 2. IN-GAME ACTIONS BAR
  return (
    <div className="w-full max-w-[460px] sm:max-w-[480px] mx-auto mt-3.5">
      {/* AI Draw Notice or Status feedback */}
      {aiDrawNotice && (
        <div className="mb-2 p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-center text-xs text-rose-500 lowercase animate-fade-up">
          {aiDrawNotice}
        </div>
      )}

      <div className="flex items-center justify-between px-2 py-1.5 rounded-xl border border-[var(--line)] bg-[var(--bg-subtle)] text-xs text-[var(--ink-soft)]">
        {/* Undo button (disabled in online or when no moves) */}
        {gameMode !== 'online' ? (
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-colors lowercase font-sans ${
              canUndo
                ? 'hover:bg-[var(--line)] hover:text-[var(--highlight-ink)] cursor-pointer'
                : 'opacity-30 cursor-not-allowed'
            }`}
            title="Отменить последний ход"
          >
            <Undo2 size={13} />
            <span className="hidden sm:inline">ход назад</span>
          </button>
        ) : (
          <div className="w-8" />
        )}

        {/* Center Group: Speed Blitz Timer, Resign & Offer Draw */}
        <div className="flex items-center gap-2">
          {/* Speed Blitz 5s Countdown Badge */}
          {speedBlitzTime !== undefined && speedBlitzTime !== null && (
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-mono font-medium transition-colors ${
                speedBlitzTime <= 2.0
                  ? 'bg-rose-500/15 text-rose-500 animate-pulse'
                  : 'bg-[var(--line)]/40 text-[var(--highlight-ink)]'
              }`}
              title="осталось времени на текущий ход"
            >
              <Zap size={11} className={speedBlitzTime <= 2.0 ? 'fill-rose-500' : ''} />
              <span>{speedBlitzTime.toFixed(1)}с</span>
            </div>
          )}

          {/* Resign Button */}
          {historyLength > 0 && (
            isResignConfirmOpen ? (
              <div className="flex items-center gap-1 bg-rose-500/10 border border-rose-500/30 px-2 py-1 rounded-lg text-xs animate-fade-up">
                <span className="text-rose-500 lowercase">сдаться?</span>
                <button
                  type="button"
                  onClick={() => {
                    setIsResignConfirmOpen(false);
                    onResign();
                  }}
                  className="text-rose-600 dark:text-rose-400 font-medium hover:underline px-1 cursor-pointer lowercase"
                >
                  да
                </button>
                <button
                  type="button"
                  onClick={() => setIsResignConfirmOpen(false)}
                  className="text-[var(--ink-mute)] hover:text-[var(--ink-soft)] px-1 cursor-pointer lowercase"
                >
                  нет
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsResignConfirmOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-rose-500/10 hover:text-rose-500 transition-colors cursor-pointer lowercase font-sans"
                title="Сдаться в этой партии"
              >
                <Flag size={13} />
                <span>сдаться</span>
              </button>
            )
          )}

          {/* Offer Draw Button */}
          {historyLength > 0 && (
            <button
              type="button"
              onClick={onOfferDraw}
              disabled={myDrawOffered}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-colors lowercase font-sans ${
                myDrawOffered
                  ? 'opacity-40 cursor-not-allowed'
                  : 'hover:bg-[var(--line)] hover:text-[var(--highlight-ink)] cursor-pointer'
              }`}
              title={myDrawOffered ? 'Предложение ничьей отправлено' : 'Предложить ничью'}
            >
              <Handshake size={13} />
              <span>{myDrawOffered ? 'ничья…' : 'ничья'}</span>
            </button>
          )}
        </div>

        {/* Restart Button */}
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-[var(--line)] hover:text-[var(--highlight-ink)] transition-colors cursor-pointer lowercase font-sans"
          title={gameMode === 'online' ? 'Предложить начать заново' : 'Начать партию заново'}
        >
          <RotateCcw size={13} />
          <span className="hidden sm:inline">заново</span>
        </button>
      </div>
    </div>
  );
};
