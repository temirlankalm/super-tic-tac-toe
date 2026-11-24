'use client';

import React from 'react';

interface IconProps {
  className?: string;
}

const baseSvgProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true as const,
};

export function PencilTrophy({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg {...baseSvgProps} className={className}>
      <path d="M7.5 4.5C9.5 4.2 14.5 4.2 16.5 4.5C16.8 9.2 15.2 13 12 13.5C8.8 13 7.2 9.2 7.5 4.5Z" />
      <path d="M7.2 6.2C5.2 6 4.2 7.2 4.5 9C4.8 10.6 6.2 11.2 7.8 10.8" />
      <path d="M16.8 6.2C18.8 6 19.8 7.2 19.5 9C19.2 10.6 17.8 11.2 16.2 10.8" />
      <path d="M12 13.5C11.9 15.5 12.1 17 12 18.8" />
      <path d="M8.5 19.2C10.5 18.8 13.5 18.9 15.5 19.2" />
    </svg>
  );
}

export function PencilFlame({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg {...baseSvgProps} className={className}>
      <path d="M12.2 3.2C13.8 5.6 17.2 8.2 17.4 13C17.5 16.8 15 19.8 12 20C8.8 20.1 6.4 17.3 6.6 13.6C6.7 10.7 8.4 8.7 9.4 7.3C9.6 8.8 10.4 9.7 11.1 10.2C11.2 7.6 11.4 5.2 12.2 3.2Z" />
      <path d="M10.4 15.4C10.3 13.8 11.2 12.6 12.1 11.8C13.2 12.7 13.9 14.1 13.8 15.6C13.6 16.8 12.8 17.6 11.9 17.6C10.9 17.6 10.4 16.6 10.4 15.4Z" />
    </svg>
  );
}

export function PencilUser({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg {...baseSvgProps} className={className}>
      <path d="M12 4.6C14 4.5 15.4 6 15.3 8C15.2 9.9 13.8 11.3 11.9 11.3C10 11.3 8.7 9.8 8.8 7.9C8.9 6 10.1 4.7 12 4.6Z" />
      <path d="M5.6 19.3C6.1 15.9 8.7 14.1 12 14.2C15.3 14.3 17.9 16 18.4 19.3" />
    </svg>
  );
}

export function PencilUsers({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg {...baseSvgProps} className={className}>
      <path d="M9.2 5.4C10.9 5.3 12.1 6.6 12 8.3C11.9 10 10.7 11.2 9.1 11.2C7.5 11.2 6.3 9.9 6.4 8.2C6.5 6.5 7.6 5.5 9.2 5.4Z" />
      <path d="M3.8 19C4.3 16 6.5 14.3 9.2 14.4C11.9 14.5 14 16.1 14.4 19" />
      <path d="M15.6 6.2C17 6.3 18 7.4 17.9 8.8C17.8 10.1 16.8 11.1 15.5 11" />
      <path d="M15.8 14.5C18 14.8 19.6 16.2 20.1 18.8" />
    </svg>
  );
}

export function PencilBot({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg {...baseSvgProps} className={className}>
      <path d="M12 3.5L12 6.6" />
      <circle cx="12" cy="3.1" r="1" />
      <path d="M5.2 8C8.5 7.6 15.5 7.6 18.8 8C19.2 10.5 19.2 15.8 18.7 18.4C15 18.8 9 18.8 5.3 18.4C4.8 15.8 4.8 10.5 5.2 8Z" />
      <path d="M8.8 12.2L9.2 12.2" />
      <path d="M14.8 12.2L15.2 12.2" />
      <path d="M9 15.6C10.8 16 13.2 16 15 15.5" />
    </svg>
  );
}

export function PencilSliders({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg {...baseSvgProps} className={className}>
      <path d="M4.5 7.2L19.5 7" />
      <path d="M4.5 12.2L19.5 12" />
      <path d="M4.5 17.2L19.5 17" />
      <circle cx="9" cy="7.1" r="1.7" fill="var(--surface)" />
      <circle cx="15" cy="12.1" r="1.7" fill="var(--surface)" />
      <circle cx="10.5" cy="17.1" r="1.7" fill="var(--surface)" />
    </svg>
  );
}

export function PencilClock({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg {...baseSvgProps} className={className}>
      <path d="M12 4.2C16.4 4.1 19.9 7.5 19.8 12C19.7 16.4 16.3 19.8 11.9 19.8C7.5 19.8 4.1 16.3 4.2 11.9C4.3 7.5 7.6 4.3 12 4.2Z" />
      <path d="M12 7.5L12.1 12.1L15.2 14" />
    </svg>
  );
}

export function PencilVolumeOn({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg {...baseSvgProps} className={className}>
      <path d="M4.5 9.6L8.2 9.5L12.8 5.6L12.9 18.4L8.2 14.5L4.5 14.4C4.3 12.8 4.3 11.2 4.5 9.6Z" />
      <path d="M16 9.1C17 10.5 17 13.5 16 14.9" />
      <path d="M18.6 6.8C20.3 9.5 20.3 14.5 18.6 17.2" />
    </svg>
  );
}

export function PencilVolumeOff({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg {...baseSvgProps} className={className}>
      <path d="M4.5 9.6L8.2 9.5L12.8 5.6L12.9 18.4L8.2 14.5L4.5 14.4C4.3 12.8 4.3 11.2 4.5 9.6Z" />
      <path d="M16.2 9.4L20 14.6" />
      <path d="M20 9.4L16.2 14.6" />
    </svg>
  );
}

export function PencilSun({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg {...baseSvgProps} className={className}>
      <circle cx="12" cy="12" r="3.8" />
      <path d="M12 3.4V5.3M12 18.7V20.6M3.4 12H5.3M18.7 12H20.6M5.9 5.9L7.3 7.3M16.7 16.7L18.1 18.1M18.1 5.9L16.7 7.3M7.3 16.7L5.9 18.1" />
    </svg>
  );
}

export function PencilMoon({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg {...baseSvgProps} className={className}>
      <path d="M18.8 14.8C16.8 15.6 14.3 15.3 12.4 13.6C10.5 11.9 9.9 9.3 10.6 7C10.8 6.2 11.2 5.4 11.7 4.7C8.1 5 5.1 8 4.9 11.8C4.7 16 8 19.6 12.2 19.7C15.1 19.8 17.6 18 18.8 14.8Z" />
    </svg>
  );
}

export function PencilHelp({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg {...baseSvgProps} className={className}>
      <path d="M9.4 8.6C9.6 6.8 10.9 5.7 12.4 5.7C14 5.7 15.2 6.8 15.1 8.4C15 10.2 12.4 10.8 12.2 13.2" />
      <path d="M12.2 16.8L12.3 17" />
    </svg>
  );
}

export function PencilClose({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg {...baseSvgProps} className={className}>
      <path d="M6.2 6.4L17.8 17.6" />
      <path d="M17.6 6.2L6.4 17.8" />
    </svg>
  );
}

export function PencilChevronDown({ className = 'w-3.5 h-3.5' }: IconProps) {
  return (
    <svg {...baseSvgProps} className={className}>
      <path d="M6.5 9.5C8.5 11.8 10.3 13.4 12 14.8C13.7 13.4 15.5 11.7 17.5 9.5" />
    </svg>
  );
}

export function PencilUndo({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg {...baseSvgProps} className={className}>
      <path d="M8.6 6.2L5.2 9.6L8.8 12.8" />
      <path d="M5.6 9.6H13.4C16.6 9.6 18.8 11.6 18.8 14.4C18.8 17 16.8 18.6 13.8 18.6H9.2" />
    </svg>
  );
}

export function PencilReset({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg {...baseSvgProps} className={className}>
      <path d="M18.6 10.2C17.8 6.8 14.8 4.6 11.4 4.8C7.6 5 4.8 8.2 4.9 12.1C5 16 8.1 19 12 19C15.1 19 17.7 17.1 18.6 14.3" />
      <path d="M19.4 6.2L18.8 10.4L14.8 9.8" />
    </svg>
  );
}

export function PencilFlag({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg {...baseSvgProps} className={className}>
      <path d="M5.6 20L5.8 4.5" />
      <path d="M5.8 5.2C9 4.3 11.4 6.3 14.6 5.6C16.2 5.2 17.4 4.9 18.4 4.8L18.2 12.6C16.8 12.9 15.4 13.4 13.8 13.6C10.9 13.9 8.7 12.1 5.8 12.8" />
    </svg>
  );
}

export function PencilHandshake({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg {...baseSvgProps} className={className}>
      <path d="M4.2 12.6L7.5 8.8C8.4 7.9 9.8 7.9 10.8 8.7L13.5 11C14.2 11.6 14.2 12.7 13.5 13.4" />
      <path d="M19.8 12.2L16.5 8.8C15.7 8 14.3 8 13.4 8.7" />
      <path d="M7.8 14.6L11.6 17.8C12.3 18.3 13.2 18.3 13.8 17.7L17.4 14.2" />
    </svg>
  );
}

export function PencilShare({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg {...baseSvgProps} className={className}>
      <circle cx="17.2" cy="5.8" r="2.2" />
      <circle cx="6.8" cy="12" r="2.2" />
      <circle cx="17.2" cy="18.2" r="2.2" />
      <path d="M8.8 10.9L15.1 7.1" />
      <path d="M8.8 13.1L15.1 16.9" />
    </svg>
  );
}

export function PencilCopy({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg {...baseSvgProps} className={className}>
      <path d="M9.2 8.4H17.6C18.2 8.4 18.6 8.8 18.6 9.4V18.4C18.6 19 18.2 19.4 17.6 19.4H9.2C8.6 19.4 8.2 19 8.2 18.4V9.4C8.2 8.8 8.6 8.4 9.2 8.4Z" />
      <path d="M15.4 8.2V5.6C15.4 5 15 4.6 14.4 4.6H6.2C5.6 4.6 5.2 5 5.2 5.6V14.4C5.2 15 5.6 15.4 6.2 15.4H8" />
    </svg>
  );
}

export function PencilCheck({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg {...baseSvgProps} className={className}>
      <path d="M5.2 12.8L9.6 17.2L19 7.2" />
    </svg>
  );
}

export function PencilSparkles({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg {...baseSvgProps} className={className}>
      <path d="M12 3.8C12.3 7.5 13.7 8.9 17.4 9.2C13.7 9.5 12.3 10.9 12 14.6C11.7 10.9 10.3 9.5 6.6 9.2C10.3 8.9 11.7 7.5 12 3.8Z" />
      <path d="M17.5 14.8C17.6 16.3 18.2 16.9 19.7 17C18.2 17.1 17.6 17.7 17.5 19.2C17.4 17.7 16.8 17.1 15.3 17C16.8 16.9 17.4 16.3 17.5 14.8Z" />
      <path d="M6.4 15.4L6.5 17.6M5.4 16.5L7.6 16.5" />
    </svg>
  );
}

export function PencilEyeOff({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg {...baseSvgProps} className={className}>
      <path d="M4.2 12C6.4 8.2 9.1 6.7 12 6.7C14.9 6.7 17.6 8.2 19.8 12C17.6 15.8 14.9 17.3 12 17.3C9.1 17.3 6.4 15.8 4.2 12Z" />
      <circle cx="12" cy="12" r="2.1" />
      <path d="M4.6 4.8L19.4 19.2" />
    </svg>
  );
}

export function PencilHourglass({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg {...baseSvgProps} className={className}>
      <path d="M7.2 4.6H16.8" />
      <path d="M7.2 19.4H16.8" />
      <path d="M8.2 4.8C8.3 8.8 11.2 10.5 12 12C12.8 10.5 15.7 8.8 15.8 4.8" />
      <path d="M8.2 19.2C8.3 15.2 11.2 13.5 12 12C12.8 13.5 15.7 15.2 15.8 19.2" />
    </svg>
  );
}

export function PencilCalendar({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg {...baseSvgProps} className={className}>
      <path d="M4.8 7.6C8.5 7.3 15.5 7.3 19.2 7.6C19.4 11 19.4 16.2 19.1 19C15.2 19.4 8.8 19.4 4.9 19C4.6 16.2 4.6 11 4.8 7.6Z" />
      <path d="M8.2 4.6V7.5M15.8 4.6V7.5M5 10.8H19" />
    </svg>
  );
}

export function PencilArrowLeft({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg {...baseSvgProps} className={className}>
      <path d="M18.8 12.1L5.4 12" />
      <path d="M10.4 7L5.2 12L10.4 17" />
    </svg>
  );
}

export function PencilArrowRight({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg {...baseSvgProps} className={className}>
      <path d="M5.2 12L18.6 12.1" />
      <path d="M13.6 7L18.8 12L13.6 17" />
    </svg>
  );
}

export function PencilGlobe({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg {...baseSvgProps} className={className}>
      <circle cx="12" cy="12" r="8.2" />
      <path d="M12 3.8C9.8 6.8 9.8 17.2 12 20.2" />
      <path d="M12 3.8C14.2 6.8 14.2 17.2 12 20.2" />
      <path d="M4.3 9.5H19.7M4.3 14.5H19.7" />
    </svg>
  );
}

export function PencilQr({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg {...baseSvgProps} className={className}>
      <path d="M4.6 4.8H9.8V10H4.6Z" />
      <path d="M14.2 4.8H19.4V10H14.2Z" />
      <path d="M4.6 14.2H9.8V19.4H4.6Z" />
      <path d="M14.4 14.4H16.8V16.8M19.2 14.4V19.2H14.4" />
    </svg>
  );
}

export function PencilChart({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg {...baseSvgProps} className={className}>
      <path d="M4.6 19.2V5" />
      <path d="M4.6 19.2H19.6" />
      <path d="M7.6 15.2L11.1 11.4L14.2 13.6L18.6 7.8" />
    </svg>
  );
}

export function PencilAlert({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg {...baseSvgProps} className={className}>
      <path d="M12 4.2C16.4 4.1 19.9 7.6 19.8 12C19.7 16.4 16.3 19.8 11.9 19.8C7.5 19.8 4.1 16.3 4.2 11.9C4.3 7.5 7.6 4.3 12 4.2Z" />
      <path d="M12 8.2V12.6" />
      <path d="M12 15.8V16.1" />
    </svg>
  );
}
