import type { Metadata } from 'next';
import { RulesClient } from './RulesClient';

export const metadata: Metadata = {
  title: 'Rules · Tic³ - Ultimate Tic-Tac-Toe',
  description:
    'Rules of Tic³ (Ultimate Tic-Tac-Toe): the golden direction rule, winning local sectors, free move mechanics, and chess clock blitz.',
  alternates: {
    canonical: 'https://ttt.temr.dev/rules',
  },
  openGraph: {
    title: 'Rules · Tic³ - Ultimate Tic-Tac-Toe',
    description:
      'Learn how to play Tic³ (Ultimate Tic-Tac-Toe): direction rule, sector wins, and free move strategy.',
    url: 'https://ttt.temr.dev/rules',
    siteName: 'Tic³',
    type: 'article',
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: 'Tic³ rules',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Rules · Tic³ - Ultimate Tic-Tac-Toe',
    description:
      'Learn how to play Tic³ (Ultimate Tic-Tac-Toe): direction rule, sector wins, and free move strategy.',
    images: ['/og.png'],
  },
};

export default function RulesPage() {
  return <RulesClient />;
}
