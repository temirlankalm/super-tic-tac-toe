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
    const title = `Join game #${room} · t³ Ultimate Tic-Tac-Toe`;
    const description = `Join my game of Ultimate Tic-Tac-Toe! Enter room #${room} and play in real time via peer-to-peer WebRTC.`;
    return {
      title,
      description,
      alternates: {
        canonical: `https://ttt.temr.dev/?room=${encodeURIComponent(room)}`,
      },
      openGraph: {
        title: `Join my game of Ultimate Tic-Tac-Toe (#${room})`,
        description,
        url: `https://ttt.temr.dev/?room=${encodeURIComponent(room)}`,
        siteName: 't³ super tic-tac-toe',
        type: 'website',
        images: [
          {
            url: '/og.png',
            width: 1200,
            height: 630,
            alt: `Join room #${room} on t³`,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: `Join my game of Ultimate Tic-Tac-Toe (#${room})`,
        description,
        images: ['/og.png'],
      },
    };
  }

  return {
    title: 't³ - Ultimate Tic-Tac-Toe online',
    description:
      'Minimalist Ultimate Tic-Tac-Toe game online. Play single-player against qnet AI, challenge a friend via room code, or solve the daily challenge.',
    alternates: {
      canonical: 'https://ttt.temr.dev',
    },
    openGraph: {
      title: 't³ - Ultimate Tic-Tac-Toe online',
      description:
        'Play Ultimate Tic-Tac-Toe online against qnet AI, friends via room code, or tackle daily challenges.',
      url: 'https://ttt.temr.dev',
      siteName: 't³ super tic-tac-toe',
      type: 'website',
      images: [
        {
          url: '/og.png',
          width: 1200,
          height: 630,
          alt: 't³ super tic-tac-toe',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 't³ - Ultimate Tic-Tac-Toe online',
      description:
        'Minimalist Ultimate Tic-Tac-Toe game online with AI engine, room codes, and daily challenge.',
      images: ['/og.png'],
    },
  };
}

async function GamePageContent({ searchParams }: PageProps) {
  const resolved = await searchParams;
  return <GameClient initialRoomId={resolved?.room} />;
}

export default function Page(props: PageProps) {
  return (
    <Suspense fallback={null}>
      <GamePageContent {...props} />
    </Suspense>
  );
}
