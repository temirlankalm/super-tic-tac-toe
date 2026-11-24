import type { Metadata } from 'next';
import { LeaderboardClient } from './LeaderboardClient';

export const metadata: Metadata = {
  title: 'Leaderboard · Global Elo Rankings',
  description:
    'Global Elo leaderboard and rankings for Tic³ (Ultimate Tic-Tac-Toe). Track your rating, wins, and compete against players and AI.',
  alternates: {
    canonical: 'https://ttt.temr.dev/leaderboard',
  },
  openGraph: {
    title: 'Leaderboard · Tic³ Ultimate Tic-Tac-Toe',
    description: 'Global Elo rankings and player statistics for Tic³.',
    url: 'https://ttt.temr.dev/leaderboard',
    siteName: 'Tic³',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Tic³ Leaderboard',
    description: 'Global Elo rankings for Tic³ Ultimate Tic-Tac-Toe.',
  },
};

export default function LeaderboardPage() {
  return <LeaderboardClient />;
}
