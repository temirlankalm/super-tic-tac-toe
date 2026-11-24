import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { connection } from 'next/server';
import { Geist, Geist_Mono, Newsreader } from 'next/font/google';
import './globals.css';
import { LanguageProvider } from '@/i18n/LanguageContext';
import { Language } from '@/i18n/types';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const newsreader = Newsreader({
  variable: '--font-newsreader',
  subsets: ['latin'],
  weight: ['400', '500'],
});

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#efeeee' },
    { media: '(prefers-color-scheme: dark)', color: '#141719' },
  ],
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://ttt.temr.dev'),
  title: {
    default: 'Tic³ - Ultimate Tic-Tac-Toe online',
    template: '%s · Tic³',
  },
  description:
    'Minimalist Ultimate Tic-Tac-Toe game online. Play against the neural engine qnet, challenge a friend via room code, or solve the daily challenge.',
  applicationName: 'Tic³',
  authors: [{ name: 'Temirlan', url: 'https://temr.dev/' }],
  creator: 'Temirlan',
  alternates: {
    canonical: 'https://ttt.temr.dev',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Tic³',
  },
  icons: {
    icon: '/icon.svg',
    apple: '/icons/apple-touch-icon.png',
  },
  openGraph: {
    title: 'Tic³ - Ultimate Tic-Tac-Toe online',
    description:
      'Play Ultimate Tic-Tac-Toe online against qnet AI, friends via room code, or tackle daily challenges.',
    url: 'https://ttt.temr.dev',
    siteName: 'Tic³',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: 'Tic³ - Ultimate Tic-Tac-Toe online',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tic³ - Ultimate Tic-Tac-Toe online',
    description:
      'Minimalist Ultimate Tic-Tac-Toe game online with AI engine, room codes, and daily challenge.',
    images: ['/og.png'],
  },
};

async function LocaleShell({ children }: { children: React.ReactNode }) {
  await connection();
  const cookieStore = await cookies();
  const cookieLang = cookieStore.get('ttt_lang')?.value;
  const initialLanguage: Language | undefined =
    cookieLang === 'ru' || cookieLang === 'en' ? cookieLang : undefined;

  return <LanguageProvider initialLanguage={initialLanguage}>{children}</LanguageProvider>;
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${newsreader.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <meta name="theme-color" content="#efeeee" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#141719" media="(prefers-color-scheme: dark)" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <style>{`html[data-lang-hydrating="1"] body{opacity:0}`}</style>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var cookieMatch = document.cookie.match(/(?:^|;\\s*)ttt_lang=(ru|en)(?:;|$)/);
                var cookieLang = cookieMatch ? cookieMatch[1] : null;
                var storedLang = localStorage.getItem('ttt_lang');
                var l = (storedLang === 'ru' || storedLang === 'en') ? storedLang : (cookieLang || (navigator.language && navigator.language.startsWith('ru') ? 'ru' : 'en'));
                if (l) {
                  document.documentElement.lang = l;
                  if (cookieLang !== l) {
                    if (l !== 'en' && !cookieLang) {
                      document.documentElement.setAttribute('data-lang-hydrating', '1');
                    }
                    document.cookie = 'ttt_lang=' + l + '; Max-Age=31536000; Path=/; SameSite=Lax';
                  }
                }
              } catch(e) {}

              try {
                const t = localStorage.getItem('ttt_theme');
                if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch(e) {}

              if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(() => {});
                });
              }
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col justify-between">
        <Suspense fallback={null}>
          <LocaleShell>{children}</LocaleShell>
        </Suspense>
      </body>
    </html>
  );
}
