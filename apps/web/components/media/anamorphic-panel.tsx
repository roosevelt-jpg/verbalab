'use client';

import { stillForVariant, type AnamorphicStillVariant } from '@/lib/anamorphic-stills';
import './anamorphic.css';

type Variant = AnamorphicStillVariant;
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
  const resolvedImage = videoUrl ? undefined : imageUrl || stillForVariant(variant);

  return (
    <div
      className={`lg-ana ${sizeClass} ${className}`.trim()}
      data-variant={variant}
      aria-hidden={label ? undefined : true}
      role={label ? 'img' : undefined}
      aria-label={label}
    >
      <div className={`lg-ana__stage${resolvedImage || videoUrl ? ' lg-ana__stage--photo' : ''}`}>
        {videoUrl ? (
          <video className="lg-ana__media" src={videoUrl} autoPlay muted loop playsInline />
        ) : resolvedImage ? (
          <>
            <img className="lg-ana__media" src={resolvedImage} alt="" />
            <div className="lg-ana__photo-veil" />
            <div className="lg-ana__photo-frame" />
          </>
        ) : null}
      </div>
      <span className="lg-ana__label">{label ?? LABELS[variant]}</span>
    </div>
  );
}
