import type { Metadata } from 'next';
import { Suspense } from 'react';
import { GameClient } from './GameClient';

interface PageProps {
  searchParams: Promise<{ room?: string }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const resolved = await searchParams;
  const room = resolved?.room;

  if (room) {
    const title = 'Join my Tic³ game';
    const description = 'Click to play ultimate tic-tac-toe with me, no signup';
    const roomUrl = `https://ttt.temr.dev/?room=${encodeURIComponent(room)}`;

    return {
      title,
      description,
      alternates: {
        canonical: roomUrl,
      },
      openGraph: {
        title,
        description,
        url: roomUrl,
        siteName: 'Tic³',
        type: 'website',
        images: [
          {
            url: '/og.png',
            width: 1200,
            height: 630,
            alt: `Join room #${room} on Tic³`,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: ['/og.png'],
      },
    };
  }

  return {
    title: 'Tic³ - Ultimate Tic-Tac-Toe online',
    description:
      'Minimalist Ultimate Tic-Tac-Toe game online. Play single-player against qnet AI, challenge a friend via room code, or solve the daily challenge.',
    alternates: {
      canonical: 'https://ttt.temr.dev',
    },
    openGraph: {
      title: 'Tic³ - Ultimate Tic-Tac-Toe online',
      description:
        'Play Ultimate Tic-Tac-Toe online against qnet AI, friends via room code, or tackle daily challenges.',
      url: 'https://ttt.temr.dev',
      siteName: 'Tic³',
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
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'VideoGame',
  name: 'Tic³',
  url: 'https://ttt.temr.dev',
  genre: 'Board game',
  browserRequirements: 'Requires JavaScript',
  applicationCategory: 'Game',
  operatingSystem: 'Any',
  offers: {
    '@type': 'Offer',
    price: 0,
    priceCurrency: 'USD',
  },
  description:
    'Minimalist Ultimate Tic-Tac-Toe game online. Play against the neural engine qnet, challenge a friend via room code, or solve the daily challenge.',
  inLanguage: ['en', 'ru'],
};

async function GamePageContent({ searchParams }: PageProps) {
  const resolved = await searchParams;
  return <GameClient initialRoomId={resolved?.room} />;
}

export default function Page(props: PageProps) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense fallback={null}>
        <GamePageContent {...props} />
      </Suspense>
    </>
  );
}
