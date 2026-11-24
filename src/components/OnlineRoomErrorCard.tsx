'use client';

import React from 'react';
import { RoomJoinError } from '@/types/game';
import { useTranslation } from '@/i18n/LanguageContext';
import { PencilAlert, PencilBot, PencilReset } from './hand-drawn/PencilIcons';

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
      className="pencil-card w-full max-w-[430px] sm:max-w-[540px] mx-auto my-3 p-4 animate-fade-up"
    >
      <div className="flex items-start gap-2.5">
        <PencilAlert className="w-4 h-4 text-[var(--highlight-ink)] shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-sans text-[var(--highlight-ink)] font-medium lowercase mb-3">
            {errorMessage}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={onTryAgain}
              className="pencil-btn-primary inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-sans font-medium lowercase cursor-pointer min-h-[40px]"
            >
              <PencilReset className="w-3.5 h-3.5" />
              <span>{t.onlineModal.tryAgain}</span>
            </button>
            <button
              type="button"
              onClick={onCreateRoom}
              className="pencil-btn-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-sans lowercase cursor-pointer min-h-[40px]"
            >
              <span>+ {t.onlineModal.createMyOwnRoom}</span>
            </button>
            <button
              type="button"
              onClick={onPlayVsAi}
              className="pencil-btn-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-sans lowercase cursor-pointer min-h-[40px]"
            >
              <PencilBot className="w-3.5 h-3.5" />
              <span>{t.onlineModal.playVsAi}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
