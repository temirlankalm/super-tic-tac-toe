'use client';

import React from 'react';
import { X } from 'lucide-react';
import { useTranslation } from '@/i18n/LanguageContext';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  const { t, language } = useTranslation();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-xs animate-fade-up"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[480px] p-6 md:p-8 rounded-2xl bg-[var(--bg)] border border-[var(--line-strong)] shadow-xl text-[var(--ink)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--line)]">
          <h2 className="text-lg md:text-xl font-normal lowercase tracking-tight">
            {t.rulesModal.title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-[var(--ink-soft)] hover:text-[var(--highlight-ink)] transition-colors cursor-pointer"
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
              {language === 'ru' ? '5. режим шахматных часов' : '5. chess clock mode'}
            </h3>
            <p className="text-[var(--ink-soft)] font-light">
              {language === 'ru'
                ? 'Выберите 1 мин (пуля), 2 мин, 3 мин (блиц) или 5 мин (рапид). Таймер начинает обратный отсчет только после первого хода и переключается при передаче хода. Если время истекает, сопернику присуждается победа.'
                : 'Select 1 min (bullet), 2 min, 3 min (blitz), or 5 min (rapid). The clock counts down after your first move and alternates each turn. Running out of time results in defeat.'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-[var(--line)] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs tracking-wider lowercase bg-[var(--line)] hover:bg-[var(--line-strong)] text-[var(--highlight-ink)] transition-colors cursor-pointer font-medium"
          >
            {t.rulesModal.button}
          </button>
        </div>
      </div>
    </div>
  );
};
