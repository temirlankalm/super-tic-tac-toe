'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Globe } from 'lucide-react';
import { useTranslation } from '@/i18n/LanguageContext';

export function RulesClient() {
  const { t, language, setLanguage } = useTranslation();

  const toggleLanguage = () => {
    setLanguage(language === 'ru' ? 'en' : 'ru');
  };

  const isRu = language === 'ru';

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--ink)] font-sans antialiased p-6 md:p-12">
      <div className="max-w-[620px] mx-auto animate-fade-up">
        {/* Navigation & Language toggle */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-[var(--ink-soft)] hover:text-[var(--highlight-ink)] transition-colors lowercase border-b border-[var(--underline)] pb-0.5"
          >
            <ArrowLeft size={13} />
            <span>{isRu ? 'играть в Tic³' : 'play Tic³'}</span>
          </Link>

          <button
            type="button"
            onClick={toggleLanguage}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-[var(--line)] text-xs text-[var(--ink-soft)] hover:text-[var(--highlight-ink)] font-mono transition-colors cursor-pointer uppercase"
            title={isRu ? 'switch to English' : 'переключить на русский'}
          >
            <Globe size={12} />
            <span>{isRu ? 'EN' : 'RU'}</span>
          </button>
        </div>

        {/* Title */}
        <header className="mb-10 pb-6 border-b border-[var(--line)]">
          <div className="flex items-center gap-2 mb-2 text-[var(--ink-mute)]">
            <BookOpen size={16} />
            <span className="text-xs uppercase tracking-widest font-mono">
              {isRu ? 'руководство' : 'game guide'}
            </span>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-medium tracking-tight text-[var(--highlight-ink)] lowercase">
            {isRu ? 'правила Tic³' : 'rules of Tic³'}
          </h1>
          <p className="text-sm text-[var(--ink-soft)] mt-2 font-light lowercase">
            {isRu
              ? 'стратегические супер крестики-нолики на поле 9×9'
              : 'strategic ultimate tic-tac-toe on a 9×9 board'}
          </p>
        </header>

        {/* Rules Content */}
        <article className="space-y-8 text-[15px] md:text-[16px] leading-relaxed text-[var(--ink)]">
          <section>
            <h2 className="font-serif text-lg font-medium text-[var(--highlight-ink)] lowercase mb-2">
              {isRu ? '1. золотое правило направления' : '1. the golden direction rule'}
            </h2>
            <p className="text-[var(--ink-soft)] font-light">
              {isRu
                ? 'X всегда ходит первым. Каждая малая клетка, в которую вы ставите ход внутри сектора 3×3, определяет сектор глобального поля, в котором обязан ходить соперник. Например, ход в правый верхний угол отправляет соперника в правый верхний сектор супер-доски.'
                : 'X moves first. Every small cell you play inside a 3×3 mini-board dictates which sector of the global board your opponent must play in next. For example, if you place your mark in the top-right cell of any local board, your opponent is forced to play their subsequent move inside the top-right global sector.'}
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg font-medium text-[var(--highlight-ink)] lowercase mb-2">
              {isRu ? '2. захват сектора и победа в матче' : '2. claiming a sector & winning the match'}
            </h2>
            <p className="text-[var(--ink-soft)] font-light">
              {isRu
                ? 'Соберите три своих знака в ряд внутри любого сектора 3×3, чтобы захватить его целиком. Главная цель игры — выстроить три захваченных сектора в ряд на глобальной доске (по горизонтали, вертикали или диагонали).'
                : 'Line up 3 of your marks in a row within any local 3×3 board to win and claim that entire sector. Your ultimate objective is to claim 3 sectors in a row on the global board — horizontally, vertically, or diagonally.'}
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg font-medium text-[var(--highlight-ink)] lowercase mb-2">
              {isRu ? '3. механика свободного хода' : '3. the free move mechanic'}
            </h2>
            <p className="text-[var(--ink-soft)] font-light">
              {isRu ? (
                <>
                  Если соперник отправляет вас в уже выигранный или полностью заполненный сектор, вы получаете{' '}
                  <strong className="font-medium text-[var(--highlight-ink)]">свободный ход</strong>:
                  вы можете поставить свой знак в абсолютно любую открытую клетку любого сектора на всей доске 9×9.
                </>
              ) : (
                <>
                  If your opponent directs you to a sector that has already been won or is completely full, you earn a{' '}
                  <strong className="font-medium text-[var(--highlight-ink)]">free move</strong>: you
                  may place your mark in any open cell across any sector on the entire 9×9 super-board.
                </>
              )}
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg font-medium text-[var(--highlight-ink)] lowercase mb-2">
              {isRu ? '4. ничьи и закрытые секторы' : '4. ties and completed sectors'}
            </h2>
            <p className="text-[var(--ink-soft)] font-light">
              {isRu
                ? 'Если в секторе заполнены все 9 клеток без победителя, сектор завершается вничью и не принадлежит никому. Если никто не собирает 3 сектора в ряд и все 9 секторов завершены, побеждает игрок с большим числом захваченных секторов; при равном счете объявляется ничья.'
                : 'If a mini-board fills up with no winner, it ends in a tie and belongs to neither player. If neither player claims 3 sectors in a row and all 9 sectors are decided, the player with the most claimed sectors wins; if equal, the game is a draw.'}
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg font-medium text-[var(--highlight-ink)] lowercase mb-2">
              {isRu ? '5. шахматные часы и режимы игры' : '5. chess clocks & modes'}
            </h2>
            <p className="text-[var(--ink-soft)] font-light">
              {isRu ? (
                <>
                  Играйте без контроля времени или испытайте скорость реакции с шахматными часами (1м пуля, 2м / 3м блиц, 5м рапид). Проверьте свои силы против нейросетевого движка{' '}
                  <strong className="font-medium text-[var(--highlight-ink)]">qnet</strong>, играйте вдвоем на одном экране или создайте приватную WebRTC комнату для игры с другом по коду.
                </>
              ) : (
                <>
                  Play casual without a timer or test your blitz instincts with optional chess clocks (1m bullet, 2m blitz, 3m blitz, 5m rapid). Test yourself in single-player vs the neural engine{' '}
                  <strong className="font-medium text-[var(--highlight-ink)]">qnet</strong>, play 2 players on one screen, or invite friends to a private WebRTC peer-to-peer room.
                </>
              )}
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg font-medium text-[var(--highlight-ink)] lowercase mb-2">
              {isRu ? '6. сдача, ничья, челлендж и комнаты' : '6. resign, draw, daily & rooms'}
            </h2>
            <p className="text-[var(--ink-soft)] font-light">
              {isRu
                ? 'Вы можете сдаться в любой момент или предложить ничью (в игре с ИИ доступно после 10 ходов при равной позиции). Решайте ежедневный челлендж по UTC для серии побед или создавайте приватные онлайн-комнаты для игры с друзьями по коду с выбором стороны.'
                : 'You can resign at any time or offer a draw (available vs AI after 10 moves if the position is roughly even). Solve the daily challenge seeded by UTC date to build your streak, or create private online rooms with custom side selection to play friends.'}
            </p>
          </section>
        </article>

        {/* Action Button */}
        <div className="mt-12 pt-8 border-t border-[var(--line)] flex items-center justify-between">
          <span className="text-xs text-[var(--ink-mute)] font-light lowercase">
            {isRu ? 'без регистрации · бесплатно навсегда' : 'no account required · free forever'}
          </span>
          <Link
            href="/"
            className="px-5 py-2 rounded-lg bg-[var(--highlight-ink)] text-[var(--bg)] text-xs font-medium lowercase hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
          >
            {isRu ? 'начать играть в Tic³' : 'start playing Tic³'}
          </Link>
        </div>
      </div>
    </main>
  );
}
