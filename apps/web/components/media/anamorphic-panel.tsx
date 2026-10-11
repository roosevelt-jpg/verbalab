'use client';

import { stillForVariant, type AnamorphicStillVariant } from '@/lib/anamorphic-stills';
import { motionForStill } from '@/lib/anamorphic-motion';
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

/**
 * Product / use-case media plane. Always motion: muted looping webm when present,
 * otherwise CSS Ken Burns + grain/beam over the photoreal still.
 */
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
  const resolvedImage = imageUrl || stillForVariant(variant);
  const resolvedVideo = videoUrl || motionForStill(resolvedImage, variant);

  return (
    <div
      className={`lg-ana ${sizeClass} ${className}`.trim()}
      data-variant={variant}
      aria-hidden={label ? undefined : true}
      role={label ? 'img' : undefined}
      aria-label={label}
    >
      <div className="lg-ana__stage lg-ana__stage--photo lg-ana__stage--motion">
        {resolvedVideo ? (
          <video
            className="lg-ana__media lg-ana__media--motion"
            src={resolvedVideo}
            poster={resolvedImage}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
          />
        ) : (
          <img className="lg-ana__media lg-ana__media--kenburns" src={resolvedImage} alt="" />
        )}
        <div className="lg-ana__photo-veil" />
        <div className="lg-ana__grain" aria-hidden="true" />
        <div className="lg-ana__beam lg-ana__beam--soft" aria-hidden="true" />
        <div className="lg-ana__photo-frame" />
      </div>
      <span className="lg-ana__label">{label ?? LABELS[variant]}</span>
    </div>
  );
}
