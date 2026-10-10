/** Shared Play / Stop glyphs for demo audio controls (no icon package dependency). */

export function PlayIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="currentColor" aria-hidden="true">
      <path d="M5 3.5v11l10-5.5L5 3.5z" />
    </svg>
  );
}

export function StopIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="currentColor" aria-hidden="true">
      <rect x="4" y="4" width="10" height="10" rx="1.5" />
    </svg>
  );
}

export function LoadingIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
      className="lg-demo-play-spin"
    >
      <circle cx="9" cy="9" r="6.5" strokeOpacity="0.25" />
      <path d="M15.5 9a6.5 6.5 0 0 0-6.5-6.5" strokeLinecap="round" />
    </svg>
  );
}
