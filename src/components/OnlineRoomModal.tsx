'use client';

import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { X, Copy, Check, QrCode, Globe, Users } from 'lucide-react';
import { ConnectionStatus, OnlineRole } from '@/types/game';

interface OnlineRoomModalProps {
  isOpen: boolean;
  roomId: string | null;
  role: OnlineRole;
  status: ConnectionStatus;
  theme: 'light' | 'dark';
  onClose: () => void;
  onLeaveRoom: () => void;
}

export const OnlineRoomModal: React.FC<OnlineRoomModalProps> = ({
  isOpen,
  roomId,
  role,
  status,
  theme,
  onClose,
  onLeaveRoom,
}) => {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(true);

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
      width: 170,
      color: {
        dark: darkColor,
        light: lightColor,
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Failed to generate QR code', err));
  }, [roomUrl, theme]);

  const handleCopy = async () => {
    if (!roomUrl) return;
    try {
      await navigator.clipboard.writeText(roomUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = roomUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
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
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-[var(--line)]">
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

        {/* Status Indicator */}
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-[var(--line)]/30 border border-[var(--line)] mb-4 text-xs font-sans">
          <div className="relative flex items-center justify-center">
            {status === 'connected' ? (
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500/50" />
            ) : status === 'waiting' || status === 'connecting' ? (
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
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
                : 'комната создана'}
            </span>
            <span className="text-[11px] text-[var(--ink-mute)] font-mono">
              код: {roomId}
            </span>
          </div>
        </div>

        {/* Link Share Box */}
        <div className="space-y-3 mb-5">
          <div className="flex items-center justify-between text-xs text-[var(--ink-soft)] lowercase">
            <span>отправь ссылку другу для игры:</span>
            <span className="text-[11px] font-medium text-[var(--highlight-ink)]">
              {role === 'host' ? 'вы ходите за X' : 'вы ходите за O'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={roomUrl}
              className="flex-1 px-3 py-2 text-xs font-mono rounded-lg border border-[var(--line)] bg-[var(--bg-subtle)] text-[var(--ink)] focus:outline-none select-all"
            />
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-sans lowercase font-medium bg-[var(--highlight-ink)] text-[var(--bg)] hover:opacity-90 transition-all cursor-pointer shrink-0"
              title="Скопировать ссылку"
            >
              {copied ? (
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
          <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-[var(--line)]/15 border border-[var(--line)] mb-5">
            <div className="flex items-center gap-1.5 text-xs text-[var(--ink-mute)] mb-2 lowercase">
              <QrCode size={13} />
              <span>или отсканируй камерой телефона</span>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrDataUrl}
              alt="QR Code для комнаты"
              width={150}
              height={150}
              className="rounded-lg"
            />
          </div>
        )}

        {/* Actions Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-[var(--line)] text-xs font-sans">
          <button
            type="button"
            onClick={onLeaveRoom}
            className="text-[var(--ink-mute)] hover:text-rose-500 transition-colors cursor-pointer lowercase"
          >
            покинуть комнату
          </button>

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
