'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useLayoutEffect,
  useMemo,
  useCallback,
} from 'react';
import { Language, Translations } from './types';
import { en } from './translations/en';
import { ru } from './translations/ru';
import { analytics } from '@/lib/analytics/client';

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

function persistLanguage(lang: Language) {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
    document.cookie = `${STORAGE_KEY}=${lang}; Max-Age=31536000; Path=/; SameSite=Lax`;
    document.documentElement.lang = lang;
  } catch {}
}

function getCookieLang(): Language | null {
  if (typeof document === 'undefined') return null;
  try {
    const match = document.cookie.match(/(?:^|;\s*)ttt_lang=(ru|en)(?:;|$)/);
    return match ? (match[1] as Language) : null;
  } catch {
    return null;
  }
}

function detectInitialLanguage(): Language {
  if (typeof window === 'undefined') return 'en';
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'ru' || saved === 'en') {
      return saved;
    }
    const cookieLang = getCookieLang();
    if (cookieLang === 'ru' || cookieLang === 'en') {
      return cookieLang;
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

const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export const LanguageProvider: React.FC<{
  children: React.ReactNode;
  initialLanguage?: Language;
}> = ({ children, initialLanguage }) => {
  const [language, setLanguageState] = useState<Language>(initialLanguage || 'en');

  // Sync before paint on client mount to prevent any EN -> RU flash
  useIsomorphicLayoutEffect(() => {
    const initial = detectInitialLanguage();
    setLanguageState(initial);
    persistLanguage(initial);
    document.documentElement.removeAttribute('data-lang-hydrating');
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    persistLanguage(lang);
    try {
      analytics.languageToggle(lang);
    } catch {}
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguageState((prev: Language) => {
      const next: Language = prev === 'ru' ? 'en' : 'ru';
      persistLanguage(next);
      try {
        analytics.languageToggle(next);
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
