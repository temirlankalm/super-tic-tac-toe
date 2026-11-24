'use client';

import React, { useEffect, useRef } from 'react';
import { PencilClose } from './hand-drawn/PencilIcons';
import { useTranslation } from '@/i18n/LanguageContext';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

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
        aria-labelledby="rules-modal-title"
        className="pencil-sheet relative w-full max-w-[calc(100vw-2rem)] sm:max-w-[480px] max-h-[90dvh] overflow-y-auto p-5 md:p-7 text-[var(--ink)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-dashed border-[var(--line-strong)]">
          <h2 id="rules-modal-title" className="font-hand text-2xl sm:text-3xl font-semibold text-[var(--highlight-ink)] lowercase leading-none">
            {t.rulesModal.title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="pencil-chip p-2 min-h-[40px] min-w-[40px] flex items-center justify-center text-[var(--ink-soft)] cursor-pointer"
            aria-label={t.common.close}
          >
            <PencilClose className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 text-sm leading-relaxed text-[var(--ink)]">
          <div>
            <h3 className="font-medium text-[var(--highlight-ink)] lowercase mb-1">
              {t.rulesModal.rule1Title}
            </h3>
            <p className="text-[var(--ink-soft)] font-light">
              {t.rulesModal.rule1Desc}
            </p>
          </div>

          <div>
            <h3 className="font-medium text-[var(--highlight-ink)] lowercase mb-1">
              {t.rulesModal.rule2Title}
            </h3>
            <p className="text-[var(--ink-soft)] font-light">
              {t.rulesModal.rule2Desc}
            </p>
          </div>

          <div>
            <h3 className="font-medium text-[var(--highlight-ink)] lowercase mb-1">
              {t.rulesModal.rule3Title}
            </h3>
            <p className="text-[var(--ink-soft)] font-light">
              {t.rulesModal.rule3Desc}
            </p>
          </div>

          <div>
            <h3 className="font-medium text-[var(--highlight-ink)] lowercase mb-1">
              {t.rulesModal.rule4Title}
            </h3>
            <p className="text-[var(--ink-soft)] font-light">
              {t.rulesModal.rule4Desc}
            </p>
          </div>

          <div>
            <h3 className="font-medium text-[var(--highlight-ink)] lowercase mb-1">
              {t.rulesModal.rule5Title}
            </h3>
            <p className="text-[var(--ink-soft)] font-light">
              {t.rulesModal.rule5Desc}
            </p>
          </div>

          <div>
            <h3 className="font-medium text-[var(--highlight-ink)] lowercase mb-1">
              {t.rulesModal.rule6Title}
            </h3>
            <p className="text-[var(--ink-soft)] font-light">
              {t.rulesModal.rule6Desc}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-dashed border-[var(--line-strong)] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="pencil-btn-primary px-5 py-2 min-h-[40px] text-xs tracking-wider lowercase cursor-pointer font-medium"
          >
            {t.rulesModal.button}
          </button>
        </div>
      </div>
    </div>
  );
};
