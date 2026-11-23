'use client';

import React from 'react';
import { X, Sliders, EyeOff, Sparkles, Zap } from 'lucide-react';
import { GameModifiers } from '@/types/game';

interface SettingsModalProps {
  isOpen: boolean;
  modifiers: GameModifiers;
  onToggleModifier: (key: keyof GameModifiers) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  modifiers,
  onToggleModifier,
  onClose,
}) => {
  if (!isOpen) return null;

  const items: {
    key: keyof GameModifiers;
    title: string;
    enTitle: string;
    desc: string;
    icon: React.ReactNode;
  }[] = [
    {
      key: 'fogOfWar',
      title: 'туман войны',
      enTitle: 'fog of war',
      desc: 'виден только активный сектор и секторы с ходами. остальные скрыты полупрозрачной дымкой.',
      icon: <EyeOff size={16} />,
    },
    {
      key: 'fadingInk',
      title: 'исчезающие чернила',
      enTitle: 'fading ink',
      desc: 'знаки живут на доске только последние 4 хода каждого игрока, затем исчезают.',
      icon: <Sparkles size={16} />,
    },
    {
      key: 'speedBlitz',
      title: 'блиц-паника',
      enTitle: '5s speed blitz',
      desc: 'ровно 5 секунд на каждый ход. не успел — случайный ход в допустимый сектор.',
      icon: <Zap size={16} />,
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-up"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[440px] p-6 rounded-2xl bg-[var(--bg)] border border-[var(--line-strong)] shadow-2xl text-[var(--ink)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 mb-5 border-b border-[var(--line)]">
          <div className="flex items-center gap-2">
            <Sliders size={17} className="text-[var(--highlight-ink)]" />
            <h2 className="text-base font-normal lowercase tracking-tight">
              аркадные модификаторы
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

        {/* Modifiers List */}
        <div className="space-y-3.5">
          {items.map((item) => {
            const isActive = modifiers[item.key];
            return (
              <div
                key={item.key}
                onClick={() => onToggleModifier(item.key)}
                className={`flex items-start justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[var(--line)]/25 border-[var(--line-strong)] shadow-xs'
                    : 'bg-transparent border-[var(--line)] hover:border-[var(--line-strong)]/60'
                }`}
              >
                <div className="flex items-start gap-3 pr-3">
                  <div
                    className={`p-2 rounded-lg mt-0.5 transition-colors ${
                      isActive
                        ? 'bg-[var(--highlight-ink)] text-[var(--bg)]'
                        : 'bg-[var(--line)]/40 text-[var(--ink-soft)]'
                    }`}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[var(--highlight-ink)] lowercase">
                        {item.title}
                      </span>
                      <span className="text-[10px] text-[var(--ink-mute)] font-light lowercase">
                        · {item.enTitle}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--ink-soft)] font-light lowercase mt-1 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>

                {/* Switch pill */}
                <div className="pt-1 shrink-0">
                  <div
                    className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out ${
                      isActive ? 'bg-[var(--highlight-ink)]' : 'bg-[var(--line)]'
                    }`}
                  >
                    <div
                      className={`bg-[var(--bg)] w-4 h-4 rounded-full shadow-xs transform transition-transform duration-200 ease-in-out ${
                        isActive ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info note */}
        <div className="mt-5 pt-3 border-t border-[var(--line)] text-center">
          <p className="text-[11px] text-[var(--ink-mute)] font-light lowercase">
            модификаторы действуют на локальные режимы и синхронизируются в игре
          </p>
        </div>
      </div>
    </div>
  );
};
