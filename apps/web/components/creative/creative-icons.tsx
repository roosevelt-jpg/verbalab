import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { name: string };

const base = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true as const,
};

export function CreativeIcon({ name, ...rest }: IconProps) {
  const p = { ...base, ...rest };
  switch (name) {
    case 'home':
      return (
        <svg {...p}>
          <path d="M4 10.5L12 4l8 6.5V20a1 1 0 01-1 1h-5v-6H10v6H5a1 1 0 01-1-1v-9.5z" />
        </svg>
      );
    case 'voices':
      return (
        <svg {...p}>
          <path d="M4 10v4M8 7v10M12 4v16M16 7v10M20 10v4" />
        </svg>
      );
    case 'studio':
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4" />
        </svg>
      );
    case 'flows':
      return (
        <svg {...p}>
          <circle cx="6" cy="6" r="2.5" />
          <circle cx="18" cy="6" r="2.5" />
          <circle cx="12" cy="18" r="2.5" />
          <path d="M8.2 7.5L10.5 15M15.8 7.5L13.5 15" />
        </svg>
      );
    case 'chat':
      return (
        <svg {...p}>
          <path d="M5 6h14a1 1 0 011 1v8a1 1 0 01-1 1H10l-4 3v-3H5a1 1 0 01-1-1V7a1 1 0 011-1z" />
          <path d="M9 11h.01M12 11h.01M15 11h.01" />
        </svg>
      );
    case 'assets':
      return (
        <svg {...p}>
          <path d="M4 8l8-4 8 4v8l-8 4-8-4V8z" />
          <path d="M12 12l8-4M12 12v8M12 12L4 8" />
        </svg>
      );
    case 'tts':
      return (
        <svg {...p}>
          <path d="M4 9v6h3l4 3V6L7 9H4zM16 9a3 3 0 010 6M18.5 7a5.5 5.5 0 010 10" />
        </svg>
      );
    case 'clone':
      return (
        <svg {...p}>
          <path d="M12 14a4 4 0 100-8 4 4 0 000 8z" />
          <path d="M5 20a7 7 0 0114 0" />
          <path d="M19 4v4M17 6h4" />
        </svg>
      );
    case 'sfx':
      return (
        <svg {...p}>
          <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
          <path d="M18 15l.8 2.2L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-.8L18 15z" />
        </svg>
      );
    case 'media':
    case 'image':
      return (
        <svg {...p}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <circle cx="9" cy="10" r="1.5" />
          <path d="M3 16l5-4 4 3 3-2 6 4" />
        </svg>
      );
    case 'video':
      return (
        <svg {...p}>
          <rect x="3" y="6" width="13" height="12" rx="2" />
          <path d="M16 10l5-3v10l-5-3V10z" />
        </svg>
      );
    case 'isolator':
      return (
        <svg {...p}>
          <path d="M8 4h8v4H8V4zM6 10h12v10H6V10z" />
          <path d="M10 14h4" />
        </svg>
      );
    case 'changer':
      return (
        <svg {...p}>
          <circle cx="8" cy="9" r="3" />
          <circle cx="16" cy="9" r="3" />
          <path d="M3 19a5 5 0 0110 0M11 19a5 5 0 0110 0" />
        </svg>
      );
    case 'music':
      return (
        <svg {...p}>
          <path d="M9 18V6l10-2v12" />
          <circle cx="7" cy="18" r="2.5" />
          <circle cx="17" cy="16" r="2.5" />
        </svg>
      );
    case 'stt':
      return (
        <svg {...p}>
          <path d="M4 14c2-4 4-6 8-6s6 2 8 6" />
          <path d="M12 8v10M9 18h6" />
        </svg>
      );
    case 'dub':
      return (
        <svg {...p}>
          <path d="M5 7h9a2 2 0 012 2v5a2 2 0 01-2 2H9l-4 3V7z" />
          <path d="M16 10h2a2 2 0 012 2v4a2 2 0 01-2 2h-1l-2 2" />
        </svg>
      );
    case 'book':
      return (
        <svg {...p}>
          <path d="M5 5h6a3 3 0 013 3v11a2 2 0 00-2-2H5V5zM19 5h-6a3 3 0 00-3 3v11a2 2 0 012-2h7V5z" />
        </svg>
      );
    case 'avatar':
      return (
        <svg {...p}>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 20a7 7 0 0114 0" />
        </svg>
      );
    case 'more':
      return (
        <svg {...p}>
          <circle cx="6" cy="12" r="1.4" fill="currentColor" stroke="none" />
          <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
          <circle cx="18" cy="12" r="1.4" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'search':
      return (
        <svg {...p}>
          <circle cx="11" cy="11" r="6" />
          <path d="M16 16l4 4" />
        </svg>
      );
    case 'bell':
      return (
        <svg {...p}>
          <path d="M6 16V11a6 6 0 0112 0v5l1.5 2H4.5L6 16zM10 20a2 2 0 004 0" />
        </svg>
      );
    case 'folder':
      return (
        <svg {...p}>
          <path d="M3 8a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
        </svg>
      );
    case 'upload':
      return (
        <svg {...p}>
          <path d="M12 16V5M8 9l4-4 4 4M5 19h14" />
        </svg>
      );
    case 'send':
      return (
        <svg {...p}>
          <path d="M12 19V5M7 10l5-5 5 5" />
        </svg>
      );
    case 'plus':
      return (
        <svg {...p}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    case 'mic':
      return (
        <svg {...p}>
          <rect x="9" y="3" width="6" height="11" rx="3" />
          <path d="M5 11a7 7 0 0014 0M12 18v3" />
        </svg>
      );
    case 'sidebar':
      return (
        <svg {...p}>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M9 4v16" />
        </svg>
      );
    case 'grid':
      return (
        <svg {...p}>
          <rect x="4" y="4" width="6" height="6" rx="1" />
          <rect x="14" y="4" width="6" height="6" rx="1" />
          <rect x="4" y="14" width="6" height="6" rx="1" />
          <rect x="14" y="14" width="6" height="6" rx="1" />
        </svg>
      );
    case 'list':
      return (
        <svg {...p}>
          <path d="M8 7h12M8 12h12M8 17h12M4 7h.01M4 12h.01M4 17h.01" />
        </svg>
      );
    case 'play':
      return (
        <svg {...p}>
          <path d="M8 6l12 6-12 6V6z" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'close':
      return (
        <svg {...p}>
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      );
    default:
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="8" />
        </svg>
      );
  }
}
