'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { X, Copy, Check, QrCode, Globe, LogIn, Plus } from 'lucide-react';
import { ConnectionStatus, OnlineRole } from '@/types/game';

interface OnlineRoomModalProps {
  isOpen: boolean;
  roomId: string | null;
  role: OnlineRole;
  status: ConnectionStatus;
  theme: 'light' | 'dark';
  onClose: () => void;
  onLeaveRoom: () => void;
  onCreateRoom: () => void;
  onJoinRoom: (targetRoomId: string) => void;
}

export const OnlineRoomModal: React.FC<OnlineRoomModalProps> = ({
  isOpen,
  roomId,
  role,
  status,
  theme,
  onClose,
  onLeaveRoom,
  onCreateRoom,
  onJoinRoom,
}) => {
  const [activeTab, setActiveTab] = useState<'share' | 'join'>('share');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const roomUrl =
    typeof window !== 'undefined' && roomId
      ? `${window.location.origin}/?room=${roomId}`
      : '';

  // Generate QR code matching the active theme
  useEffect(() => {
    if (!roomUrl) return;

    const darkColor = theme === 'dark' ? '#d2d6db' : '#4e545a';
    const lightColor = '#00000000'; // transparent background

    QRCode.toDataURL(roomUrl, {
      margin: 1,
      width: 140,
      color: {
        dark: darkColor,
        light: lightColor,
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Failed to generate QR code', err));
  }, [roomUrl, theme]);

  const handleCopyLink = async () => {
    if (!roomUrl) return;
    try {
      await navigator.clipboard.writeText(roomUrl);
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
      setJoinError('введи код комнаты');
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-up"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[440px] p-6 sm:p-7 rounded-2xl bg-[var(--bg)] border border-[var(--line-strong)] shadow-2xl text-[var(--ink)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-[var(--line)]">
          <div className="flex items-center gap-2">
            <Globe size={18} className="text-[var(--highlight-ink)]" />
            <h2 className="text-base sm:text-lg font-normal lowercase tracking-tight">
              онлайн-игра с другом
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

        {/* Navigation Tabs (Share Room / Join by Code) */}
        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[var(--line)]/30 border border-[var(--line)] mb-4 text-xs font-sans">
          <button
            type="button"
            onClick={() => setActiveTab('share')}
            className={`flex-1 py-1.5 px-3 rounded-md transition-all cursor-pointer lowercase flex items-center justify-center gap-1.5 ${
              activeTab === 'share'
                ? 'bg-[var(--line-strong)] text-[var(--highlight-ink)] font-medium shadow-xs'
                : 'text-[var(--ink-mute)] hover:text-[var(--ink-soft)]'
            }`}
          >
            <Globe size={13} />
            <span>комната {roomId ? `#${roomId}` : ''}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('join')}
            className={`flex-1 py-1.5 px-3 rounded-md transition-all cursor-pointer lowercase flex items-center justify-center gap-1.5 ${
              activeTab === 'join'
                ? 'bg-[var(--line-strong)] text-[var(--highlight-ink)] font-medium shadow-xs'
                : 'text-[var(--ink-mute)] hover:text-[var(--ink-soft)]'
            }`}
          >
            <LogIn size={13} />
            <span>войти по коду</span>
          </button>
        </div>

        {activeTab === 'share' ? (
          <>
            {/* Status Indicator */}
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-[var(--line)]/30 border border-[var(--line)] mb-3 text-xs font-sans">
              <div className="relative flex items-center justify-center">
                {status === 'connected' ? (
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500/50" />
                ) : status === 'waiting' || status === 'connecting' ? (
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                ) : status === 'error' ? (
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                ) : (
                  <span className="w-2.5 h-2.5 rounded-full bg-zinc-400" />
                )}
              </div>
              <div className="flex-1 flex items-center justify-between">
                <span className="text-[var(--highlight-ink)] font-medium lowercase">
                  {status === 'connected'
                    ? 'соперник подключен!'
                    : status === 'waiting'
                    ? 'ожидание соперника…'
                    : status === 'connecting'
                    ? 'подключение к комнате…'
                    : status === 'error'
                    ? 'комната не найдена или соперник отключился'
                    : 'комната создана'}
                </span>
                <span className="text-[11px] text-[var(--ink-mute)] font-sans lowercase">
                  {role === 'host' ? 'вы за X' : role === 'guest' ? 'вы за O' : ''}
                </span>
              </div>
            </div>

            {/* Big Prominent Room Code Box */}
            {roomId && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--line)]/20 border border-[var(--line)] mb-3">
                <div>
                  <span className="text-[10px] text-[var(--ink-mute)] uppercase tracking-wider block font-medium">
                    код комнаты
                  </span>
                  <span className="text-xl font-mono font-medium tracking-widest text-[var(--highlight-ink)] select-all">
                    {roomId}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans lowercase font-medium border border-[var(--line-strong)] hover:bg-[var(--line)]/50 text-[var(--highlight-ink)] transition-colors cursor-pointer"
                  title="Скопировать только код комнаты"
                >
                  {copiedCode ? (
                    <>
                      <Check size={13} />
                      <span>скопирован</span>
                    </>
                  ) : (
                    <>
                      <Copy size={13} />
                      <span>скопировать код</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Link Share Box */}
            <div className="space-y-1.5 mb-3.5">
              <span className="text-[11px] text-[var(--ink-soft)] lowercase block">
                или отправь ссылку напрямую:
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={roomUrl}
                  className="flex-1 px-3 py-2 text-xs font-mono rounded-lg border border-[var(--line)] bg-[var(--bg-subtle)] text-[var(--ink)] focus:outline-none select-all"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-sans lowercase font-medium bg-[var(--highlight-ink)] text-[var(--bg)] hover:opacity-90 transition-all cursor-pointer shrink-0"
                  title="Скопировать ссылку"
                >
                  {copiedLink ? (
                    <>
                      <Check size={14} />
                      <span>скопировано</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span>копировать</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* QR Code Section */}
            {qrDataUrl && (
              <div className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-[var(--line)]/15 border border-[var(--line)] mb-4">
                <div className="flex items-center gap-1.5 text-[11px] text-[var(--ink-mute)] mb-1.5 lowercase">
                  <QrCode size={12} />
                  <span>или отсканируй камерой телефона</span>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrDataUrl}
                  alt="QR Code для комнаты"
                  width={130}
                  height={130}
                  className="rounded-lg"
                />
              </div>
            )}
          </>
        ) : (
          /* Join by Code Form */
          <form onSubmit={handleJoinSubmit} className="space-y-4 my-2">
            <div>
              <label className="block text-xs text-[var(--ink-soft)] lowercase mb-1.5">
                введи код комнаты соперника:
              </label>
              <input
                type="text"
                value={inputCode}
                onChange={(e) => {
                  setInputCode(e.target.value.toLowerCase());
                  if (joinError) setJoinError(null);
                }}
                placeholder="например, 7xk2q9"
                autoFocus
                maxLength={32}
                className="w-full px-3.5 py-2.5 text-base font-mono tracking-widest rounded-xl border border-[var(--line-strong)] bg-[var(--bg-subtle)] text-[var(--highlight-ink)] focus:outline-none focus:ring-1 focus:ring-[var(--highlight-ink)]"
              />
              {joinError && (
                <span className="text-xs text-rose-500 mt-1 block lowercase">
                  {joinError}
                </span>
              )}
              <p className="text-[11px] text-[var(--ink-mute)] font-light lowercase mt-2">
                введи 6-значный код комнаты, который отображается на экране твоего соперника.
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl font-medium text-xs font-sans lowercase bg-[var(--highlight-ink)] text-[var(--bg)] hover:opacity-90 transition-opacity cursor-pointer flex items-center justify-center gap-1.5"
            >
              <LogIn size={14} />
              <span>войти в комнату</span>
            </button>
          </form>
        )}

        {/* Actions Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-[var(--line)] text-xs font-sans">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onLeaveRoom}
              className="text-[var(--ink-mute)] hover:text-rose-500 transition-colors cursor-pointer lowercase"
            >
              покинуть комнату
            </button>
            <span className="text-[var(--line)]">·</span>
            <button
              type="button"
              onClick={() => {
                onCreateRoom();
                setActiveTab('share');
              }}
              className="text-[var(--ink-mute)] hover:text-[var(--highlight-ink)] transition-colors cursor-pointer lowercase"
            >
              новая комната
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg font-medium lowercase bg-[var(--line)] hover:bg-[var(--line-strong)] text-[var(--highlight-ink)] transition-colors cursor-pointer"
          >
            к доске
          </button>
        </div>
      </div>
    </div>
  );
};
