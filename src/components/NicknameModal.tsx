'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, User, Sparkles } from 'lucide-react';
import { useTranslation } from '@/i18n/LanguageContext';
import { generateRandomNickname, validateNickname } from '@/lib/nickname';

interface NicknameModalProps {
  isOpen: boolean;
  isFirstVisit?: boolean;
  currentNickname: string;
  onSave: (newNickname: string) => { ok: boolean; errorKey?: string };
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

  useEffect(() => {
    if (isOpen) {
      setName(currentNickname);
      setError(null);
      setTimeout(() => inputRef.current?.select(), 50);
    }
  }, [isOpen, currentNickname]);

  if (!isOpen) return null;

  const handleRandomize = () => {
    const next = generateRandomNickname();
    setName(next);
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
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

    const result = onSave(validation.sanitized);
    if (!result.ok) {
      if (result.errorKey === 'profanityError') {
        setError(t.nicknameModal.profanityError);
      } else {
        setError(t.nicknameModal.invalidChars);
      }
      return;
    }

    setError(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-up"
      onClick={isFirstVisit ? onSkip : onClose}
    >
      <div
        className="relative w-full max-w-[380px] p-6 rounded-2xl bg-[var(--bg)] border border-[var(--line-strong)] shadow-2xl text-[var(--ink)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
          <div className="flex items-center gap-2">
            <User size={16} className="text-[var(--highlight-ink)]" />
            <h2 className="font-serif text-base font-medium text-[var(--highlight-ink)] lowercase">
              {isFirstVisit ? t.nicknameModal.chooseTitle : t.nicknameModal.changeTitle}
            </h2>
          </div>
          {!isFirstVisit && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-md text-[var(--ink-mute)] hover:text-[var(--highlight-ink)] hover:bg-[var(--line)]/50 transition-colors cursor-pointer"
              aria-label={t.common.close}
            >
              <X size={15} />
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
              className="w-full px-3 py-2 pr-16 text-xs rounded-lg border border-[var(--line-strong)] bg-transparent text-[var(--highlight-ink)] focus:outline-none focus:border-[var(--highlight-ink)] transition-colors font-medium font-sans"
              autoFocus
            />

            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-[var(--ink-mute)]">
                {name.length}/16
              </span>
              <button
                type="button"
                onClick={handleRandomize}
                className="p-1 rounded text-[var(--ink-soft)] hover:text-[var(--highlight-ink)] hover:bg-[var(--line)]/50 transition-colors cursor-pointer"
                title={t.nicknameModal.randomizeTooltip}
              >
                <Sparkles size={13} />
              </button>
            </div>
          </div>

          {error && (
            <p className="text-[11px] text-rose-500 font-medium lowercase">
              {error}
            </p>
          )}

          <div className="text-[10px] text-[var(--ink-mute)] lowercase">
            {t.nicknameModal.rulesHint}
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 text-xs">
            {isFirstVisit ? (
              <>
                <button
                  type="button"
                  onClick={onSkip}
                  className="px-3 py-1.5 rounded-lg border border-[var(--line)] text-[var(--ink-soft)] hover:text-[var(--highlight-ink)] lowercase transition-colors cursor-pointer"
                >
                  {t.nicknameModal.skip}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[var(--highlight-ink)] text-[var(--bg)] font-medium lowercase hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                >
                  {t.nicknameModal.save}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 rounded-lg border border-[var(--line)] text-[var(--ink-soft)] hover:text-[var(--highlight-ink)] lowercase transition-colors cursor-pointer"
                >
                  {t.nicknameModal.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[var(--highlight-ink)] text-[var(--bg)] font-medium lowercase hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
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
