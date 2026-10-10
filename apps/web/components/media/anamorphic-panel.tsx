'use client';

import { AnamorphicCanopyCanvas } from './anamorphic-canopy-canvas';
import './anamorphic.css';

type Variant = 'voice' | 'speech' | 'translate' | 'agents' | 'api' | 'coverage' | 'hub' | 'hero';
type Size = 'sm' | 'md' | 'lg' | 'hero';

const LABELS: Record<Variant, string> = {
  voice: 'Voice plane',
  speech: 'Speech plane',
  translate: 'Translate plane',
  agents: 'Agent plane',
  api: 'API plane',
  coverage: 'Coverage plane',
  hub: 'Platform plane',
  hero: 'Lugemi depth',
};

export function AnamorphicPanel({
  variant = 'hub',
  size = 'md',
  label,
  className = '',
  imageUrl,
  videoUrl,
}: {
  variant?: Variant;
  size?: Size;
  label?: string;
  className?: string;
  imageUrl?: string;
  videoUrl?: string;
}) {
  const sizeClass =
    size === 'sm' ? 'lg-ana--sm' : size === 'lg' ? 'lg-ana--lg' : size === 'hero' ? 'lg-ana--hero' : '';

  return (
    <div
      className={`lg-ana ${sizeClass} ${className}`.trim()}
      data-variant={variant}
      aria-hidden={label ? undefined : true}
      role={label ? 'img' : undefined}
      aria-label={label}
    >
      <div className="lg-ana__stage">
        {videoUrl ? (
          <video className="lg-ana__media" src={videoUrl} autoPlay muted loop playsInline />
        ) : imageUrl ? (
          <img className="lg-ana__media" src={imageUrl} alt="" />
        ) : (
          <>
            <AnamorphicCanopyCanvas
              className="lg-ana__canvas"
              intensity={size === 'sm' ? 0.75 : 1.0}
              showRings={size !== 'sm'}
            />
            <div className="lg-ana__layer lg-ana__layer--back" />
            <div className="lg-ana__layer lg-ana__layer--mid" />
            <div className="lg-ana__layer lg-ana__layer--front" />
            <div className="lg-ana__orb" />
            <div className="lg-ana__orb lg-ana__orb--alt" />
            <div className="lg-ana__beam" />
          </>
        )}
      </div>
      <span className="lg-ana__label">{label ?? LABELS[variant]}</span>
    </div>
  );
}
