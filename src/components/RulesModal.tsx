'use client';

import React from 'react';
import { X } from 'lucide-react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
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
            правила super tic-tac-toe
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-[var(--ink-soft)] hover:text-[var(--highlight-ink)] transition-colors cursor-pointer"
            aria-label="Закрыть правила"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 text-sm leading-relaxed text-[var(--ink)]">
          <div>
            <h3 className="font-medium text-[var(--highlight-ink)] lowercase mb-1">
              1. золотое правило направления хода
            </h3>
            <p className="text-[var(--ink-soft)] font-light">
              Клетка, которую вы выбираете внутри малого сектора 3×3, определяет, в каком секторе глобального поля соперник обязан сделать следующий ход. Например, ход в правый верхний угол отправляет оппонента в правый верхний сектор.
            </p>
          </div>

          <div>
            <h3 className="font-medium text-[var(--highlight-ink)] lowercase mb-1">
              2. победа в секторе
            </h3>
            <p className="text-[var(--ink-soft)] font-light">
              Соберите три своих знака в ряд внутри любого малого квадрата, чтобы захватить этот сектор. На нём появится крупный символ X или O.
            </p>
          </div>

          <div>
            <h3 className="font-medium text-[var(--highlight-ink)] lowercase mb-1">
              3. свободный ход (free play)
            </h3>
            <p className="text-[var(--ink-soft)] font-light">
              Если соперник направляет вас в сектор, который уже выигран или полностью заполнен, вы получаете свободу выбора — можете сделать ход в <span className="text-[var(--highlight-ink)] font-medium">любую открытую клетку</span> на всей доске.
            </p>
          </div>

          <div>
            <h3 className="font-medium text-[var(--highlight-ink)] lowercase mb-1">
              4. победа в матче
            </h3>
            <p className="text-[var(--ink-soft)] font-light">
              Выиграйте три сектора в ряд по горизонтали, вертикали или диагонали глобального поля 3×3, чтобы одержать итоговую победу.
            </p>
          </div>

          <div>
            <h3 className="font-medium text-[var(--highlight-ink)] lowercase mb-1">
              5. режим шахматных часов
            </h3>
            <p className="text-[var(--ink-soft)] font-light">
              Выберите 1 мин (пуля), 2 мин, 3 мин (блиц) или 5 мин (рапид). Таймер начинает обратный отсчет только после первого хода и переключается при передаче хода. Если время истекает, сопернику присуждается победа.
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
            понятно
          </button>
        </div>
      </div>
    </div>
  );
};
