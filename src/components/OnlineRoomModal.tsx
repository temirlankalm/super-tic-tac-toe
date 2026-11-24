'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  PencilArrowRight,
  PencilCheck,
  PencilClose,
  PencilCopy,
  PencilGlobe,
  PencilQr,
} from './hand-drawn/PencilIcons';
import { ConnectionStatus, OnlineRole, Player, RoomJoinError, SideChoice } from '@/types/game';
import { useTranslation } from '@/i18n/LanguageContext';
import { analytics } from '@/lib/analytics/client';

interface OnlineRoomModalProps {
  isOpen: boolean;
  roomId: string | null;
  role: OnlineRole;
  myPlayer?: Player | null;
  opponentPlayer?: Player | null;
  creatorSidePreference?: SideChoice;
  status: ConnectionStatus;
  peerJoinError?: RoomJoinError;
  theme: 'light' | 'dark';
  myNickname?: string;
  opponentNickname?: string | null;
  onClose: () => void;
  onLeaveRoom: () => void;
  onCreateRoom: (assignedPlayer?: Player) => void;
  onJoinRoom: (targetRoomId: string) => void;
  onSelectCreatorSide?: (choice: SideChoice) => void;
}

export const OnlineRoomModal: React.FC<OnlineRoomModalProps> = ({
  isOpen,
  roomId,
  role,
  myPlayer,
  opponentPlayer,
  creatorSidePreference = 'X',
  status,
  peerJoinError,
  theme,
  myNickname = 'Player',
  opponentNickname,
  onClose,
  onLeaveRoom,
  onCreateRoom,
  onJoinRoom,
  onSelectCreatorSide,
}) => {
  const { t, language } = useTranslation();
  const [activeTab, setActiveTab] = useState<'share' | 'join'>('share');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  const roomUrl =
    typeof window !== 'undefined' && roomId
      ? `${window.location.origin}/?room=${roomId}`
      : '';

  // Generate QR code matching the active theme dynamically
  useEffect(() => {
    if (!roomUrl) return;

    const darkColor = theme === 'dark' ? '#d2d6db' : '#4e545a';
    const lightColor = '#00000000'; // transparent background

    import('qrcode')
      .then((mod) => {
        const QRCode = mod.default || mod;
        QRCode.toDataURL(roomUrl, {
          margin: 1,
          width: 140,
          color: {
            dark: darkColor,
            light: lightColor,
          },
        })
          .then((url: string) => setQrDataUrl(url))
          .catch((err: unknown) => console.error('Failed to generate QR code', err));
      })
      .catch((err: unknown) => console.error('Failed to import qrcode', err));
  }, [roomUrl, theme]);

  // Focus trap, Escape key, and restore focus on close
  useEffect(() => {
    if (!isOpen) return;

    previousActiveElement.current = document.activeElement as HTMLElement;

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

  const handleCopyLink = async () => {
    if (!roomUrl) return;

    // Use Web Share API if on mobile device
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Tic³ - Ultimate Tic-Tac-Toe',
          text:
            language === 'ru'
              ? `${myNickname} приглашает сыграть в super tic-tac-toe!`
              : `${myNickname} challenges you to Ultimate Tic-Tac-Toe!`,
          url: roomUrl,
        });
        analytics.roomLinkShared('share', roomId || undefined);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
        return;
      } catch {
        // user cancelled or failed, fallback to copy
      }
    }

    try {
      await navigator.clipboard.writeText(roomUrl);
      analytics.roomLinkShared('copy', roomId || undefined);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleCopyCode = async () => {
    if (!roomId) return;
    try {
      await navigator.clipboard.writeText(roomId);
      analytics.buttonClick('copy_room_code', { roomId });
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inputCode.trim();
    if (!clean) {
      setJoinError(t.onlineModal.emptyCodeError);
      return;
    }
    setJoinError(null);
    onJoinRoom(clean);
    setInputCode('');
    setActiveTab('share');
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--scrim)] backdrop-blur-xs animate-fade-up"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="online-room-modal-title"
        className="pencil-sheet relative w-full max-w-[calc(100vw-2rem)] sm:max-w-[440px] max-h-[90dvh] overflow-y-auto p-4 sm:p-6 text-[var(--ink)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-dashed border-[var(--line-strong)]">
          <div className="flex items-center gap-2">
            <PencilGlobe className="w-4 h-4 text-[var(--highlight-ink)]" />
            <h2
              id="online-room-modal-title"
              className="font-hand text-2xl font-semibold text-[var(--highlight-ink)] lowercase leading-none"
            >
              {t.onlineModal.title}
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

        {/* Navigation Tabs (Share Room / Join by Code) */}
        <div className="pencil-card flex items-center gap-1 p-1 mb-4 text-xs font-sans">
          <button
            type="button"
            onClick={() => setActiveTab('share')}
            className={`flex-1 py-1.5 px-3 rounded-[5px_3px_6px_4px] transition-all cursor-pointer lowercase flex items-center justify-center gap-1.5 ${
              activeTab === 'share'
                ? 'bg-[var(--accent-wash-strong)] text-[var(--highlight-ink)] font-semibold border border-[var(--accent-border)]'
                : 'text-[var(--ink-soft)] hover:text-[var(--highlight-ink)] border border-transparent'
            }`}
          >
            <PencilGlobe className="w-3.5 h-3.5" />
            <span>
              {language === 'ru' ? 'комната' : 'room'} {roomId ? `#${roomId}` : ''}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('join')}
            className={`flex-1 py-1.5 px-3 rounded-[5px_3px_6px_4px] transition-all cursor-pointer lowercase flex items-center justify-center gap-1.5 ${
              activeTab === 'join'
                ? 'bg-[var(--accent-wash-strong)] text-[var(--highlight-ink)] font-semibold border border-[var(--accent-border)]'
                : 'text-[var(--ink-soft)] hover:text-[var(--highlight-ink)] border border-transparent'
            }`}
          >
            <PencilArrowRight className="w-3.5 h-3.5" />
            <span>{language === 'ru' ? 'войти по коду' : 'join by code'}</span>
          </button>
        </div>

        {activeTab === 'share' ? (
          <>
            {/* Status Indicator */}
            <div className="pencil-card flex items-center gap-2.5 px-3 py-2 mb-3 text-xs font-sans bg-[var(--bg)]">
              <div className="relative flex items-center justify-center">
                {status === 'connected' ? (
                  <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent)] border border-[var(--highlight-ink)]" />
                ) : status === 'waiting' || status === 'connecting' ? (
                  <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent-wash-strong)] border border-[var(--highlight-ink)] animate-pulse" />
                ) : status === 'error' ? (
                  <span className="w-2.5 h-2.5 rounded-full bg-[var(--highlight-ink)]" />
                ) : (
                  <span className="w-2.5 h-2.5 rounded-full border border-[var(--line-strong)]" />
                )}
              </div>
              <div className="flex-1 flex items-center justify-between">
                <span className="text-[var(--highlight-ink)] font-medium lowercase">
                  {status === 'connected'
                    ? t.onlineModal.statusConnected
                    : status === 'waiting'
                    ? t.onlineModal.statusWaiting
                    : status === 'connecting'
                    ? t.onlineModal.statusConnecting
                    : status === 'reconnecting'
                    ? t.onlineModal.reconnecting
                    : status === 'error'
                    ? peerJoinError === 'timeout'
                      ? t.onlineModal.errorTimeout
                      : peerJoinError === 'not_found'
                      ? t.onlineModal.errorNotFound
                      : peerJoinError === 'room_full'
                      ? t.onlineModal.errorRoomFull
                      : t.onlineModal.errorConnectionFailed
                    : language === 'ru' ? 'комната создана' : 'room ready'}
                </span>
                <span className="text-[11px] text-[var(--ink-soft)] font-sans lowercase">
                  {myPlayer === 'X' ? t.sideSelection.youAreX : t.sideSelection.youAreO}
                </span>
              </div>
            </div>

            {/* Creator Side Selector (Host only) */}
            {role === 'host' && onSelectCreatorSide && (
              <div className="pencil-card flex items-center justify-between p-2.5 bg-[var(--bg)] mb-3 text-xs animate-fade-up">
                <span className="text-[11px] text-[var(--ink-soft)] lowercase font-medium">
                  {t.sideSelection.side}:
                </span>
                <div className="pencil-chip flex items-center p-0.5 font-sans lowercase text-xs">
                  {(['X', 'O', 'random'] as const).map((side) => {
                    const isSelected = creatorSidePreference === side;
                    return (
                      <button
                        key={side}
                        type="button"
                        onClick={() => onSelectCreatorSide(side)}
                        className={`px-2.5 py-0.5 rounded-[4px] transition-all cursor-pointer font-medium ${
                          isSelected
                            ? 'bg-[var(--accent-wash-strong)] text-[var(--highlight-ink)] border border-[var(--accent-border)]'
                            : 'text-[var(--ink-mute)] hover:text-[var(--ink-soft)] border border-transparent'
                        }`}
                      >
                        {side === 'random' ? t.sideSelection.random : side}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Joiner Notice (Guest only) */}
            {role === 'guest' && (
              <div className="pencil-card p-2 bg-[var(--bg)] mb-3 text-[11px] text-[var(--ink-soft)] lowercase text-center">
                {`${t.sideSelection.creatorPlays} ${opponentPlayer || 'X'}, ${t.sideSelection.joinerPlays} ${myPlayer || 'O'}`}
              </div>
            )}

            {/* Players in Room */}
            <div className="pencil-card grid grid-cols-2 gap-2 p-2.5 bg-[var(--bg)] mb-3 text-xs">
              <div>
                <span className="text-[10px] text-[var(--ink-mute)] uppercase tracking-wider block font-medium">
                  {t.onlineModal.youLabel} ({myPlayer || (role === 'host' ? 'X' : 'O')})
                </span>
                <span className="font-medium text-[var(--highlight-ink)] truncate block" title={myNickname}>
                  {myNickname}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--ink-mute)] uppercase tracking-wider block font-medium">
                  {t.onlineModal.opponentLabel} ({opponentPlayer || (role === 'host' ? (myPlayer === 'X' ? 'O' : 'X') : (myPlayer === 'X' ? 'O' : 'X'))})
                </span>
                <span className="font-medium text-[var(--highlight-ink)] truncate block">
                  {opponentNickname ||
                    (status === 'connected'
                      ? language === 'ru'
                        ? 'подключен'
                        : 'connected'
                      : language === 'ru'
                      ? 'ожидание…'
                      : 'waiting…')}
                </span>
              </div>
            </div>

            {/* Big Prominent Room Code Box */}
            {roomId && (
              <div className="pencil-card flex items-center justify-between p-3 bg-[var(--bg)] mb-3">
                <div>
                  <span className="text-[10px] text-[var(--ink-mute)] uppercase tracking-wider block font-medium">
                    {language === 'ru' ? 'код комнаты' : 'room code'}
                  </span>
                  <span className="text-xl font-mono font-semibold tracking-widest text-[var(--highlight-ink)] select-all highlighter-mark px-1">
                    {roomId}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="pencil-btn-secondary flex items-center gap-1.5 px-3 py-1.5 text-xs font-sans lowercase font-medium cursor-pointer"
                  title={language === 'ru' ? 'Скопировать код комнаты' : 'Copy room code'}
                >
                  {copiedCode ? (
                    <>
                      <PencilCheck className="w-3.5 h-3.5" />
                      <span>{language === 'ru' ? 'скопирован' : 'copied'}</span>
                    </>
                  ) : (
                    <>
                      <PencilCopy className="w-3.5 h-3.5" />
                      <span>{language === 'ru' ? 'скопировать код' : 'copy code'}</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Link Share Box */}
            <div className="space-y-1.5 mb-3.5">
              <span className="text-[11px] text-[var(--ink-soft)] lowercase block">
                {language === 'ru' ? 'или отправь ссылку напрямую:' : 'or send direct link:'}
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={roomUrl}
                  className="flex-1 px-3 py-2 text-xs font-mono rounded-[7px_4px_8px_5px] border border-[var(--line-strong)] bg-[var(--bg)] text-[var(--ink)] focus:outline-none select-all"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="pencil-btn-primary flex items-center gap-1.5 px-3 py-2 text-xs font-sans lowercase font-medium cursor-pointer shrink-0"
                  title={t.onlineModal.copyLink}
                >
                  {copiedLink ? (
                    <>
                      <PencilCheck className="w-3.5 h-3.5" />
                      <span>{t.common.linkCopied}</span>
                    </>
                  ) : (
                    <>
                      <PencilCopy className="w-3.5 h-3.5" />
                      <span>{t.onlineModal.copyLink}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* QR Code Section */}
            {qrDataUrl && (
              <div className="pencil-card flex flex-col items-center justify-center p-2.5 bg-[var(--bg)] mb-4">
                <div className="flex items-center gap-1.5 text-[11px] text-[var(--ink-mute)] mb-1.5 lowercase">
                  <PencilQr className="w-3.5 h-3.5" />
                  <span>{language === 'ru' ? 'или отсканируй камерой телефона' : 'or scan with mobile camera'}</span>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrDataUrl}
                  alt="QR Code"
                  width={130}
                  height={130}
                  className="rounded-[6px_4px_7px_5px]"
                />
              </div>
            )}
          </>
        ) : (
          /* Join by Code Form */
          <form onSubmit={handleJoinSubmit} className="space-y-4 my-2">
            <div>
              <label className="block text-xs text-[var(--ink-soft)] lowercase mb-1.5">
                {language === 'ru' ? 'введи код комнаты соперника:' : "enter opponent's room code:"}
              </label>
              <input
                type="text"
                value={inputCode}
                onChange={(e) => {
                  setInputCode(e.target.value.toLowerCase());
                  if (joinError) setJoinError(null);
                }}
                placeholder={language === 'ru' ? 'например, 7xk2q9' : 'e.g. 7xk2q9'}
                autoFocus
                maxLength={32}
                className="w-full px-3.5 py-2.5 text-base font-mono tracking-widest rounded-[8px_5px_9px_6px] border border-[var(--line-strong)] bg-[var(--bg)] text-[var(--highlight-ink)] focus:outline-none focus:border-[var(--highlight-ink)]"
              />
              {(joinError || (status === 'error' && peerJoinError)) && (
                <span className="text-xs text-[var(--highlight-ink)] highlighter-mark px-1.5 py-0.5 mt-1 inline-block lowercase">
                  {joinError ||
                    (peerJoinError === 'timeout'
                      ? t.onlineModal.errorTimeout
                      : peerJoinError === 'not_found'
                      ? t.onlineModal.errorNotFound
                      : peerJoinError === 'room_full'
                      ? t.onlineModal.errorRoomFull
                      : t.onlineModal.errorConnectionFailed)}
                </span>
              )}
              <p className="text-[11px] text-[var(--ink-mute)] font-light lowercase mt-2">
                {language === 'ru'
                  ? 'введи код комнаты, который отображается на экране твоего соперника.'
                  : 'enter the room code shown on your opponent’s screen.'}
              </p>
            </div>

            <button
              type="submit"
              className="pencil-btn-primary w-full py-2.5 px-4 font-medium text-xs font-sans lowercase cursor-pointer flex items-center justify-center gap-1.5"
            >
              <PencilArrowRight className="w-3.5 h-3.5" />
              <span>{t.onlineModal.joinButton}</span>
            </button>
          </form>
        )}

        {/* Actions Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-dashed border-[var(--line-strong)] text-xs font-sans">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onLeaveRoom}
              className="text-[var(--ink-soft)] hover:text-[var(--highlight-ink)] hairline-link cursor-pointer lowercase"
            >
              {t.onlineModal.leaveRoom}
            </button>
            <span className="text-[var(--line-strong)]">·</span>
            <button
              type="button"
              onClick={() => {
                onCreateRoom();
                setActiveTab('share');
              }}
              className="text-[var(--ink-soft)] hover:text-[var(--highlight-ink)] hairline-link cursor-pointer lowercase"
            >
              {t.onlineModal.createNewRoom}
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="pencil-btn-secondary px-4 py-1.5 font-medium lowercase cursor-pointer"
          >
            {language === 'ru' ? 'к доске' : 'to board'}
          </button>
        </div>
      </div>
    </div>
  );
};
