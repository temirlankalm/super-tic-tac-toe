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
            how to play super tic-tac-toe
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-[var(--ink-soft)] hover:text-[var(--highlight-ink)] transition-colors cursor-pointer"
            aria-label="Close rules"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 text-sm leading-relaxed text-[var(--ink)]">
          <div>
            <h3 className="font-medium text-[var(--highlight-ink)] lowercase mb-1">
              1. the golden rule (sending)
            </h3>
            <p className="text-[var(--ink-soft)]">
              Whichever square you pick inside a mini-board dictates which mini-board your opponent must play in next. For example, click the top-right square of any sector, and your opponent must play somewhere in the top-right sector.
            </p>
          </div>

          <div>
            <h3 className="font-medium text-[var(--highlight-ink)] lowercase mb-1">
              2. winning a sector
            </h3>
            <p className="text-[var(--ink-soft)]">
              Get three of your marks in a row inside any mini-board to win that sector. It will be marked with a large symbol.
            </p>
          </div>

          <div>
            <h3 className="font-medium text-[var(--highlight-ink)] lowercase mb-1">
              3. the free play rule
            </h3>
            <p className="text-[var(--ink-soft)]">
              If an opponent sends you to a sector that has already been won or is full, you are freed — you may play in <span className="text-[var(--highlight-ink)] font-medium">any open square</span> across the entire global board.
            </p>
          </div>

          <div>
            <h3 className="font-medium text-[var(--highlight-ink)] lowercase mb-1">
              4. winning the game
            </h3>
            <p className="text-[var(--ink-soft)]">
              Win three mini-board sectors in a row on the global 3×3 grid to claim overall victory.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-[var(--line)] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs tracking-wider uppercase bg-[var(--line)] hover:bg-[var(--line-strong)] text-[var(--highlight-ink)] transition-colors cursor-pointer font-medium"
          >
            got it
          </button>
        </div>
      </div>
    </div>
  );
};
