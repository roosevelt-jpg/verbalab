'use client';

import type { ReactNode } from 'react';
import { AnamorphicPanel } from '@/components/media/anamorphic-panel';
import type { AnamorphicStillVariant } from '@/lib/anamorphic-stills';

/**
 * Inspiration / template tile — always uses looping 3D anamorphic motion media
 * (never a flat gradient placeholder).
 */
export function CreativeInspoCard({
  title,
  variant = 'speech',
  children,
}: {
  title: string;
  variant?: AnamorphicStillVariant;
  children?: ReactNode;
}) {
  return (
    <>
      <div className="lg-creative-inspo-art lg-creative-inspo-art--motion">
        <AnamorphicPanel variant={variant} size="sm" label={title} />
      </div>
      <figcaption>{title}</figcaption>
      {children}
    </>
  );
}
