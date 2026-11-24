'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Globe } from 'lucide-react';

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
    <main className="min-h-screen bg-[var(--bg)] text-[var(--ink)] font-sans antialiased p-6 md:p-12 flex items-center justify-center">
      <div className="max-w-[480px] w-full text-center space-y-6 animate-fade-up">
        <div className="flex justify-end mb-4">
          <button
            type="button"
            onClick={toggleLanguage}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-[var(--line)] text-xs text-[var(--ink-soft)] hover:text-[var(--highlight-ink)] font-mono transition-colors cursor-pointer uppercase"
            aria-label={isRu ? 'Switch to English' : 'Переключить на русский'}
          >
            <Globe size={12} />
            <span>{isRu ? 'EN' : 'RU'}</span>
          </button>
        </div>

        <div className="space-y-2">
          <span className="font-mono text-xs text-[var(--ink-mute)] uppercase tracking-widest">
            {isRu ? 'ошибка 404' : 'error 404'}
          </span>
          <h1 className="font-serif text-3xl md:text-4xl font-medium tracking-tight text-[var(--highlight-ink)] lowercase">
            {isRu ? 'страница не найдена' : 'page not found'}
          </h1>
          <p className="text-sm text-[var(--ink-soft)] font-light lowercase">
            {isRu
              ? 'запрашиваемый сектор не существует на доске или был закрыт.'
              : 'the requested sector does not exist on the board or was closed.'}
          </p>
        </div>

        <div className="pt-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--line)] hover:bg-[var(--line-strong)] text-[var(--highlight-ink)] text-xs font-medium lowercase transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>{isRu ? 'вернуться к игре Tic³' : 'play Tic³'}</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
