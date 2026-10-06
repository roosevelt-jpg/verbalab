'use client';

import { useId, useState } from 'react';
import './anamorphic.css';

/**
 * 3D motion poster for fields that would otherwise be empty video slots.
 * Play affordance only — no autoplay audio. Respects prefers-reduced-motion via CSS.
 */
export function MotionPoster({
  title,
  caption,
  language,
}: {
  title: string;
  caption?: string;
  language?: string;
}) {
  const [active, setActive] = useState(false);
  const labelId = useId();

  return (
    <div className="lg-ana lg-ana--sm" role="group" aria-labelledby={labelId}>
      <div className="lg-ana__stage">
        <div className="lg-ana__layer lg-ana__layer--back" />
        <div className="lg-ana__layer lg-ana__layer--mid" />
        <div className="lg-ana__layer lg-ana__layer--front" />
        <div className="lg-ana__orb" />
        <div className="lg-ana__beam" />
      </div>
      <span className="lg-ana__label" id={labelId}>
        {title}
        {language ? ` · ${language}` : ''}
      </span>
      {caption ? <span className="lg-ana__caption">{caption}</span> : null}
      <button
        type="button"
        className="lg-ana__play"
        aria-pressed={active}
        aria-label={active ? `${title} motion poster playing` : `Play ${title} motion poster`}
        onClick={() => setActive((v) => !v)}
      >
        <span className="lg-ana__play-disc" aria-hidden="true">
          {active ? (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
              <rect x="4" y="4" width="10" height="10" rx="1.5" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
              <path d="M5 3.5v11l10-5.5L5 3.5z" />
            </svg>
          )}
        </span>
      </button>
    </div>
  );
}
