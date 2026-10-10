import type { ReactNode } from 'react';

const ICONS: Record<string, ReactNode> = {
  speech: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 10a7 7 0 0 1 14 0v2a3 3 0 0 1-3 3h-1v2.5L11.5 15H8a3 3 0 0 1-3-3v-2Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  ),
  translate: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 5h9M8.5 5v2a7 7 0 0 0 7 7" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <path d="M12 19h8M16 11l4 8M20 11l-4 8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  ),
  model: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3 20 7.5v9L12 21l-8-4.5v-9L12 3Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path d="M12 12 20 7.5M12 12v9M12 12 4 7.5" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  ),
  phone: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 3.75h3.5L12 7.5l-2 1.5a11 11 0 0 0 5 5L17 12l3.75 1.5V17A3.25 3.25 0 0 1 17.5 20.25C10.6 20.25 3.75 13.4 3.75 6.5A3.25 3.25 0 0 1 7 3.75Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  ),
  shield: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3.5 19 6.5v5.2c0 4.3-2.8 7.4-7 8.8-4.2-1.4-7-4.5-7-8.8V6.5L12 3.5Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path d="m9.5 12 1.8 1.8L15 10" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  ),
  wave: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 12h2l2-5 3 10 3-8 2 5h6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
};

export function FeaturePanel({
  icon = 'model',
  title,
  body,
}: {
  icon?: keyof typeof ICONS | string;
  title: string;
  body: string;
}) {
  const visual = ICONS[icon] ?? ICONS.model;
  return (
    <article className="lg-feature">
      <div className="lg-feature__visual" aria-hidden>
        {visual}
      </div>
      <h3 className="lg-feature__title">{title}</h3>
      <p className="lg-feature__body">{body}</p>
    </article>
  );
}
