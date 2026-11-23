'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Language, Translations } from './types';
import { en } from './translations/en';
import { ru } from './translations/ru';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: Translations;
}

const STORAGE_KEY = 'ttt_lang';

const translationsMap: Record<Language, Translations> = {
  ru,
  en,
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: en,
});

function detectInitialLanguage(): Language {
  if (typeof window === 'undefined') return 'en';
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'ru' || saved === 'en') {
      return saved;
    }
    const browserLang = (navigator.language || '').toLowerCase();
    if (browserLang.startsWith('ru')) {
      return 'ru';
    }
  } catch {
    // fallback
  }
  return 'en';
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  // Sync on client mount
  useEffect(() => {
    const initial = detectInitialLanguage();
    setLanguageState(initial);
    document.documentElement.lang = initial;
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
      document.documentElement.lang = lang;
    } catch {}
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguageState((prev: Language) => {
      const next: Language = prev === 'ru' ? 'en' : 'ru';
      try {
        localStorage.setItem(STORAGE_KEY, next);
        document.documentElement.lang = next;
      } catch {}
      return next;
    });
  }, []);

  const t = useMemo(() => translationsMap[language] || en, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      toggleLanguage,
      t,
    }),
    [language, setLanguage, toggleLanguage, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export function useTranslation(): LanguageContextType {
  return useContext(LanguageContext);
}
