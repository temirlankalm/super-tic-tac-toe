'use client';

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-xs animate-fade-up"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="rules-modal-title"
        className="relative w-full max-w-[calc(100vw-2rem)] sm:max-w-[480px] max-h-[90dvh] overflow-y-auto p-5 md:p-8 rounded-2xl bg-[var(--bg)] border border-[var(--line-strong)] shadow-xl text-[var(--ink)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--line)]">
          <h2 id="rules-modal-title" className="text-lg md:text-xl font-normal lowercase tracking-tight">
            {t.rulesModal.title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-md text-[var(--ink-soft)] hover:text-[var(--highlight-ink)] transition-colors cursor-pointer"
            aria-label={t.common.close}
          >
            <X size={18} />
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
        <div className="mt-6 pt-4 border-t border-[var(--line)] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 min-h-[40px] rounded-lg text-xs tracking-wider lowercase bg-[var(--line)] hover:bg-[var(--line-strong)] text-[var(--highlight-ink)] transition-colors cursor-pointer font-medium"
          >
            {t.rulesModal.button}
          </button>
        </div>
      </div>
    </div>
  );
};
