import React from 'react';

interface LogoProps {
  className?: string;
}

export const HandDrawnLogo: React.FC<LogoProps> = ({ className = 'h-6 w-auto' }) => {
  return (
    <svg
      viewBox="0 0 298 466"
      className={className}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="t³ logo"
    >
      {/* Editorial serif lowercase t */}
      <path d="M 60 95 L 86 95 L 87 164 L 173 164 L 173 198 L 86 199 L 86 376 L 88 393 L 91 402 L 95 410 L 107 422 L 127 429 L 146 429 L 175 423 L 175 457 L 154 463 L 116 465 L 95 461 L 73 451 L 60 439 L 48 418 L 44 402 L 42 383 L 42 199 L 0 198 L 0 177 L 35 163 L 43 158 L 60 96 Z" />
      
      {/* Pixelated retro 8-bit superscript 3 (cubed) */}
      <rect x="204.3" y="0.0" width="91.7" height="15.4" />
      <rect x="250.1" y="15.4" width="30.6" height="15.4" />
      <rect x="234.9" y="30.9" width="30.6" height="15.4" />
      <rect x="219.6" y="46.3" width="61.1" height="15.4" />
      <rect x="265.4" y="61.7" width="30.6" height="15.4" />
      <rect x="189.0" y="77.1" width="30.6" height="15.4" />
      <rect x="265.4" y="77.1" width="30.6" height="15.4" />
      <rect x="204.3" y="92.6" width="76.4" height="15.4" />
    </svg>
  );
};
