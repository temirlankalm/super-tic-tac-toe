import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, BookOpen } from 'lucide-react';

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
  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--ink)] font-sans antialiased p-6 md:p-12">
      <div className="max-w-[620px] mx-auto animate-fade-up">
        {/* Navigation */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-[var(--ink-soft)] hover:text-[var(--highlight-ink)] transition-colors lowercase border-b border-[var(--underline)] pb-0.5"
          >
            <ArrowLeft size={13} />
            <span>play Tic³</span>
          </Link>
        </div>

        {/* Title */}
        <header className="mb-10 pb-6 border-b border-[var(--line)]">
          <div className="flex items-center gap-2 mb-2 text-[var(--ink-mute)]">
            <BookOpen size={16} />
            <span className="text-xs uppercase tracking-widest font-mono">game guide</span>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-medium tracking-tight text-[var(--highlight-ink)] lowercase">
            rules of Tic³
          </h1>
          <p className="text-sm text-[var(--ink-soft)] mt-2 font-light lowercase">
            strategic ultimate tic-tac-toe on a 9×9 board
          </p>
        </header>

        {/* Rules Content */}
        <article className="space-y-8 text-[15px] md:text-[16px] leading-relaxed text-[var(--ink)]">
          <section>
            <h2 className="font-serif text-lg font-medium text-[var(--highlight-ink)] lowercase mb-2">
              1. the golden direction rule
            </h2>
            <p className="text-[var(--ink-soft)] font-light">
              Every small cell you play inside a 3×3 mini-board dictates which sector of the global board your opponent must play in next. For example, if you place your mark in the top-right cell of any local board, your opponent is forced to play their subsequent move inside the top-right global sector.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg font-medium text-[var(--highlight-ink)] lowercase mb-2">
              2. claiming a sector & winning the match
            </h2>
            <p className="text-[var(--ink-soft)] font-light">
              Line up 3 of your marks in a row within any local 3×3 board to win and claim that entire sector. Your ultimate objective is to claim 3 sectors in a row on the global board — horizontally, vertically, or diagonally.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg font-medium text-[var(--highlight-ink)] lowercase mb-2">
              3. the free move mechanic
            </h2>
            <p className="text-[var(--ink-soft)] font-light">
              If your opponent directs you to a sector that has already been won or is completely full, you earn a <strong className="font-medium text-[var(--highlight-ink)]">free move</strong>: you may place your mark in any open cell across any sector on the entire 9×9 super-board.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg font-medium text-[var(--highlight-ink)] lowercase mb-2">
              4. ties & deadlocks
            </h2>
            <p className="text-[var(--ink-soft)] font-light">
              If a mini-board fills up with no winner, it ends in a tie and belongs to neither player. The match proceeds until one player claims 3 sectors in a row on the global grid or all playable moves are exhausted.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg font-medium text-[var(--highlight-ink)] lowercase mb-2">
              5. chess clocks & modes
            </h2>
            <p className="text-[var(--ink-soft)] font-light">
              Play casual without a timer or test your blitz instincts with optional chess clocks (1m bullet, 2m blitz, 3m blitz, 5m rapid). Test yourself in single-player vs the neural engine <strong className="font-medium text-[var(--highlight-ink)]">qnet</strong>, play 2 players on one screen, or invite friends to a private WebRTC peer-to-peer room.
            </p>
          </section>
        </article>

        {/* Action Button */}
        <div className="mt-12 pt-8 border-t border-[var(--line)] flex items-center justify-between">
          <span className="text-xs text-[var(--ink-mute)] font-light lowercase">
            no account required · free forever
          </span>
          <Link
            href="/"
            className="px-5 py-2 rounded-lg bg-[var(--highlight-ink)] text-[var(--bg)] text-xs font-medium lowercase hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
          >
            start playing Tic³
          </Link>
        </div>
      </div>
    </main>
  );
}
