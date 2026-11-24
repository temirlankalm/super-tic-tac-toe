'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PencilArrowLeft, PencilGlobe } from '@/components/hand-drawn/PencilIcons';

export default function NotFound() {
  const [lang, setLang] = useState<'en' | 'ru'>('en');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('ttt_lang');
      if (saved === 'ru' || saved === 'en') {
        setLang(saved);
        document.documentElement.lang = saved;
        return;
      }
      if ((navigator.language || '').toLowerCase().startsWith('ru')) {
        setLang('ru');
        document.documentElement.lang = 'ru';
      }
    } catch {}
  }, []);

  const toggleLanguage = () => {
    const next = lang === 'ru' ? 'en' : 'ru';
    setLang(next);
    try {
      localStorage.setItem('ttt_lang', next);
      document.documentElement.lang = next;
    } catch {}
  };

  const isRu = lang === 'ru';

  return (
    <main className="min-h-screen text-[var(--ink)] font-sans antialiased p-6 md:p-12 flex items-center justify-center">
      <div className="pencil-sheet max-w-[480px] w-full p-6 sm:p-8 text-center space-y-6 animate-fade-up">
        <div className="flex justify-end mb-2">
          <button
            type="button"
            onClick={toggleLanguage}
            className="pencil-chip inline-flex items-center gap-1 px-2.5 py-1 text-xs text-[var(--ink-soft)] font-mono cursor-pointer uppercase"
            aria-label={isRu ? 'Switch to English' : 'Переключить на русский'}
          >
            <PencilGlobe className="w-3.5 h-3.5" />
            <span>{isRu ? 'EN' : 'RU'}</span>
          </button>
        </div>

        <div className="space-y-2">
          <span className="font-mono text-xs text-[var(--highlight-ink)] highlighter-mark px-2 py-0.5 uppercase tracking-widest">
            {isRu ? 'ошибка 404' : 'error 404'}
          </span>
          <h1 className="font-hand text-4xl md:text-5xl font-semibold tracking-tight text-[var(--highlight-ink)] lowercase">
            {isRu ? 'страница не найдена' : 'page not found'}
          </h1>
          <p className="text-sm text-[var(--ink-soft)] font-light lowercase">
            {isRu
              ? 'запрашиваемый сектор не существует на доске или был закрыт.'
              : 'the requested sector does not exist on the board or was closed.'}
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/"
            className="pencil-btn-primary inline-flex items-center gap-1.5 px-5 py-2 text-xs font-medium lowercase cursor-pointer"
          >
            <PencilArrowLeft className="w-3.5 h-3.5" />
            <span>{isRu ? 'вернуться к игре Tic³' : 'play Tic³'}</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
