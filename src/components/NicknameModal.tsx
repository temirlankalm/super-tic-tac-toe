'use client';

import React, { useState, useEffect, useRef } from 'react';
import { PencilClose, PencilSparkles, PencilUser } from './hand-drawn/PencilIcons';
import { useTranslation } from '@/i18n/LanguageContext';
import { generateRandomNickname, validateNickname } from '@/lib/nickname';

interface NicknameModalProps {
  isOpen: boolean;
  isFirstVisit?: boolean;
  currentNickname: string;
  onSave: (newNickname: string) => { ok: boolean; errorKey?: string } | Promise<{ ok: boolean; errorKey?: string }>;
  onSkip: () => void;
  onClose: () => void;
}

export const NicknameModal: React.FC<NicknameModalProps> = ({
  isOpen,
  isFirstVisit = false,
  currentNickname,
  onSave,
  onSkip,
  onClose,
}) => {
  const { t } = useTranslation();
  const [name, setName] = useState(currentNickname);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      setName(currentNickname);
      setError(null);
      setTimeout(() => inputRef.current?.select(), 50);
    }
  }, [isOpen, currentNickname]);

  // Focus trap, Escape key, and restore focus on close
  useEffect(() => {
    if (!isOpen) return;

    const modal = modalRef.current;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFirstVisit) onSkip();
        else onClose();
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
  }, [isOpen, isFirstVisit, onSkip, onClose]);

  if (!isOpen) return null;

  const handleRandomize = () => {
    const next = generateRandomNickname();
    setName(next);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();

    const validation = validateNickname(trimmed);
    if (!validation.valid) {
      if (validation.errorKey === 'tooShort') {
        setError(t.nicknameModal.tooShort);
      } else if (validation.errorKey === 'tooLong') {
        setError(t.nicknameModal.tooLong);
      } else if (validation.errorKey === 'invalidChars') {
        setError(t.nicknameModal.invalidChars);
      } else if (validation.errorKey === 'profanityError') {
        setError(t.nicknameModal.profanityError);
      } else {
        setError(t.nicknameModal.invalidChars);
      }
      return;
    }

    const result = await onSave(validation.sanitized);
    if (!result.ok) {
      if (result.errorKey === 'profanityError') {
        setError(t.nicknameModal.profanityError);
      } else if (result.errorKey === 'nicknameTaken') {
        setError(t.nicknameModal.nicknameTaken);
      } else {
        setError(t.nicknameModal.invalidChars);
      }
      return;
    }

    setError(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--scrim)] backdrop-blur-xs animate-fade-up"
      onClick={isFirstVisit ? onSkip : onClose}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="nickname-modal-title"
        className="pencil-sheet relative w-full max-w-[calc(100vw-2rem)] sm:max-w-[390px] max-h-[90dvh] overflow-y-auto p-5 sm:p-6 text-[var(--ink)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-dashed border-[var(--line-strong)]">
          <div className="flex items-center gap-2">
            <PencilUser className="w-4 h-4 text-[var(--highlight-ink)]" />
            <h2
              id="nickname-modal-title"
              className="font-hand text-2xl font-semibold text-[var(--highlight-ink)] lowercase leading-none"
            >
              {isFirstVisit ? t.nicknameModal.chooseTitle : t.nicknameModal.changeTitle}
            </h2>
          </div>
          {!isFirstVisit && (
            <button
              type="button"
              onClick={onClose}
              className="pencil-chip p-1.5 min-h-[36px] min-w-[36px] flex items-center justify-center text-[var(--ink-soft)] cursor-pointer"
              aria-label={t.common.close}
            >
              <PencilClose className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Description */}
        <p className="text-xs text-[var(--ink-soft)] mt-3 mb-4 lowercase leading-relaxed">
          {t.nicknameModal.subtitle}
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={name}
              maxLength={16}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              placeholder={t.nicknameModal.placeholder}
              aria-label={t.nicknameModal.placeholder}
              className="w-full px-3 py-2 pr-16 text-xs rounded-[7px_4px_8px_5px] border border-[var(--line-strong)] bg-[var(--bg)] text-[var(--highlight-ink)] focus:outline-none focus:border-[var(--highlight-ink)] transition-colors font-medium font-sans"
              autoFocus
            />

            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-[var(--ink-mute)]">
                {name.length}/16
              </span>
              <button
                type="button"
                onClick={handleRandomize}
                className="p-1 rounded-[4px] text-[var(--ink-soft)] hover:text-[var(--highlight-ink)] hover:bg-[var(--accent-wash)] transition-colors cursor-pointer"
                title={t.nicknameModal.randomizeTooltip}
                aria-label={t.nicknameModal.randomizeTooltip}
              >
                <PencilSparkles className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {error && (
            <p className="text-[11px] text-[var(--highlight-ink)] highlighter-mark px-2 py-1 font-medium lowercase">
              {error}
            </p>
          )}

          <div className="text-[10px] text-[var(--ink-mute)] lowercase">
            {t.nicknameModal.rulesHint}
          </div>

          <div className="pt-2 text-[10px] text-[var(--ink-mute)] font-light lowercase border-t border-dashed border-[var(--line-strong)] leading-relaxed">
            {t.nicknameModal.eloNote}
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 text-xs">
            {isFirstVisit ? (
              <>
                <button
                  type="button"
                  onClick={onSkip}
                  className="pencil-btn-secondary px-3.5 py-1.5 lowercase cursor-pointer"
                >
                  {t.nicknameModal.skip}
                </button>
                <button
                  type="submit"
                  className="pencil-btn-primary px-4 py-1.5 font-medium lowercase cursor-pointer"
                >
                  {t.nicknameModal.save}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="pencil-btn-secondary px-3.5 py-1.5 lowercase cursor-pointer"
                >
                  {t.nicknameModal.cancel}
                </button>
                <button
                  type="submit"
                  className="pencil-btn-primary px-4 py-1.5 font-medium lowercase cursor-pointer"
                >
                  {t.nicknameModal.save}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
