'use client';

import React from 'react';
import { AlertCircle, RefreshCw, Plus, Bot } from 'lucide-react';
import { RoomJoinError } from '@/types/game';
import { useTranslation } from '@/i18n/LanguageContext';

interface OnlineRoomErrorCardProps {
  error: RoomJoinError;
  onTryAgain: () => void;
  onCreateRoom: () => void;
  onPlayVsAi: () => void;
}

export const OnlineRoomErrorCard: React.FC<OnlineRoomErrorCardProps> = ({
  error,
  onTryAgain,
  onCreateRoom,
  onPlayVsAi,
}) => {
  const { t } = useTranslation();

  if (!error) return null;

  const errorMessage =
    error === 'timeout'
      ? t.onlineModal.errorTimeout
      : error === 'not_found'
      ? t.onlineModal.errorNotFound
      : error === 'room_full'
      ? t.onlineModal.errorRoomFull
      : t.onlineModal.errorConnectionFailed;

  return (
    <div
      role="alert"
      className="w-full max-w-[460px] mx-auto my-3 p-4 rounded-xl border border-[var(--line-strong)] bg-[var(--bg)] shadow-sm animate-fade-up"
    >
      <div className="flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-sans text-[var(--highlight-ink)] font-medium lowercase mb-3">
            {errorMessage}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={onTryAgain}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--highlight-ink)] text-[var(--bg)] text-xs font-sans font-medium lowercase hover:opacity-90 transition-opacity cursor-pointer min-h-[40px]"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{t.onlineModal.tryAgain}</span>
            </button>
            <button
              type="button"
              onClick={onCreateRoom}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--line-strong)] text-[var(--ink)] text-xs font-sans lowercase hover:border-[var(--highlight-ink)] transition-colors cursor-pointer min-h-[40px]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.onlineModal.createMyOwnRoom}</span>
            </button>
            <button
              type="button"
              onClick={onPlayVsAi}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--line)] text-[var(--ink-soft)] text-xs font-sans lowercase hover:text-[var(--highlight-ink)] hover:border-[var(--line-strong)] transition-colors cursor-pointer min-h-[40px]"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>{t.onlineModal.playVsAi}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
