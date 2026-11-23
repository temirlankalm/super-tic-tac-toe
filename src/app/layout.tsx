import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { LanguageProvider } from '@/i18n/LanguageContext';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
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
  authors: [{ name: 'Temirlan', url: 'https://temirlan.dev' }],
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <meta name="theme-color" content="#efeeee" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#141719" media="(prefers-color-scheme: dark)" />
        <link rel="canonical" href="https://ttt.temr.dev" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const l = localStorage.getItem('ttt_lang') || (navigator.language && navigator.language.startsWith('ru') ? 'ru' : 'en');
                if (l) document.documentElement.lang = l;
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
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
