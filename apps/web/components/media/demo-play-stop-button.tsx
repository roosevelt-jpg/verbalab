'use client';

import { LoadingIcon, PlayIcon, StopIcon } from '@/components/media/play-stop-icons';

type Variant = 'icon' | 'chip' | 'primary' | 'secondary';

/**
 * Accessible Play / Stop control for demo TTS and audio previews.
 * Idle → Play; loading → spinner (still stoppable); playing → Stop.
 */
export function DemoPlayStopButton({
  active,
  loading = false,
  disabled = false,
  onPlay,
  onStop,
  label = 'Play',
  stopLabel = 'Stop',
  ariaLabel,
  variant = 'icon',
  className,
  title,
}: {
  active: boolean;
  loading?: boolean;
  disabled?: boolean;
  onPlay: () => void;
  onStop: () => void;
  label?: string;
  stopLabel?: string;
  /** Overrides computed aria-label */
  ariaLabel?: string;
  variant?: Variant;
  className?: string;
  title?: string;
}) {
  const busy = active || loading;
  const computedAria =
    ariaLabel ?? (loading ? `Loading ${label}` : busy ? stopLabel : label);

  const classes = [
    'lg-demo-play-btn',
    `lg-demo-play-btn--${variant}`,
    busy ? 'is-active' : '',
    loading ? 'is-loading' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      className={classes}
      disabled={disabled && !busy}
      aria-pressed={busy}
      aria-busy={loading || undefined}
      aria-label={computedAria}
      title={title ?? computedAria}
      onClick={() => {
        if (busy) {
          onStop();
          return;
        }
        onPlay();
      }}
    >
      <span className="lg-demo-play-btn__icon" aria-hidden="true">
        {loading ? <LoadingIcon /> : busy ? <StopIcon /> : <PlayIcon />}
      </span>
      {variant !== 'icon' ? (
        <span className="lg-demo-play-btn__text">{busy ? stopLabel : label}</span>
      ) : null}
    </button>
  );
}
