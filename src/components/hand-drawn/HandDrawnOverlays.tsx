'use client';

import React from 'react';

interface LineStrikeProps {
  line: number[];
  /** Scale of SVG viewBox: 100 for 3x3 local board, 300 for super board */
  size?: 100 | 300;
  /** Thicker stroke for global win */
  heavy?: boolean;
  className?: string;
}

/**
 * Computes a subtly curved hand-drawn pencil strike-through SVG path across a 3-cell win line.
 */
export const PencilLineStrike: React.FC<LineStrikeProps> = ({
  line,
  size = 100,
  heavy = false,
  className = '',
}) => {
  if (!line || line.length !== 3) return null;

  const first = line[0];
  const last = line[2];

  const colA = first % 3;
  const rowA = Math.floor(first / 3);
  const colB = last % 3;
  const rowB = Math.floor(last / 3);

  const cell = size / 3;
  const cx1 = colA * cell + cell / 2;
  const cy1 = rowA * cell + cell / 2;
  const cx2 = colB * cell + cell / 2;
  const cy2 = rowB * cell + cell / 2;

  const dx = cx2 - cx1;
  const dy = cy2 - cy1;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;

  // Overhang past start and end cell centers for natural pencil sweep
  const overhang = size * 0.14;
  const x1 = cx1 - ux * overhang;
  const y1 = cy1 - uy * overhang;
  const x2 = cx2 + ux * overhang;
  const y2 = cy2 + uy * overhang;

  // Slight perpendicular bow for organic hand-drawn feel
  const bow = size * 0.016;
  const mx = (x1 + x2) / 2 - uy * bow;
  const my = (y1 + y2) / 2 + ux * bow;

  const d = `M ${x1.toFixed(1)} ${y1.toFixed(1)} Q ${mx.toFixed(1)} ${my.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`;

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className={`pointer-events-none select-none overflow-visible ${className}`}
      fill="none"
      aria-hidden="true"
    >
      {/* Highlighter under-swipe */}
      <path
        d={d}
        stroke="var(--accent)"
        strokeWidth={heavy ? 18 : 6.5}
        strokeOpacity={heavy ? 0.52 : 0.45}
        strokeLinecap="round"
        className="animate-pencil-draw"
      />
      {/* Graphite pencil slash */}
      <path
        d={d}
        stroke="var(--highlight-ink)"
        strokeWidth={heavy ? 5.2 : 2.6}
        strokeLinecap="round"
        className="animate-pencil-draw"
      />
    </svg>
  );
};

interface SectorCircleProps {
  variant?: number;
  isGlobalWinningBoard?: boolean;
  className?: string;
}

const CIRCLE_PATHS = [
  // Organic hand-drawn loop 0
  'M 52 8 C 79 7, 94 24, 92 50 C 91 77, 74 93, 49 92 C 23 91, 8 74, 9 48 C 10 22, 29 9, 56 10',
  // Organic hand-drawn loop 1
  'M 47 9 C 22 11, 8 28, 9 52 C 11 78, 28 92, 53 91 C 78 90, 93 72, 91 46 C 89 22, 71 8, 44 10',
  // Organic hand-drawn loop 2
  'M 55 9 C 81 12, 93 30, 91 54 C 88 79, 70 93, 46 91 C 21 89, 8 71, 10 45 C 12 21, 31 8, 59 11',
];

export const PencilSectorCircle: React.FC<SectorCircleProps> = ({
  variant = 0,
  isGlobalWinningBoard = false,
  className = '',
}) => {
  const path = CIRCLE_PATHS[variant % CIRCLE_PATHS.length];

  return (
    <svg
      viewBox="0 0 100 100"
      className={`pointer-events-none select-none overflow-visible ${className}`}
      fill="none"
      aria-hidden="true"
    >
      {isGlobalWinningBoard && (
        <path
          d={path}
          stroke="var(--accent)"
          strokeWidth="9"
          strokeOpacity="0.55"
          strokeLinecap="round"
        />
      )}
      <path
        d={path}
        stroke="var(--highlight-ink)"
        strokeWidth={isGlobalWinningBoard ? '3.4' : '2.2'}
        strokeOpacity={isGlobalWinningBoard ? '0.92' : '0.45'}
        strokeLinecap="round"
        className="animate-pencil-draw"
      />
    </svg>
  );
};
