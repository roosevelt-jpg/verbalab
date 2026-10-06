'use client';

import Link from 'next/link';
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';

type Pillar = {
  id: string;
  displayName: string;
  slug: string;
  family: string;
  api: string;
  console: string;
  notes: string;
};

type PortfolioEngine = {
  product: string;
  note: string;
  pillars: Pillar[];
  links: Record<string, string>;
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-display)',
  fontSize: '1.85rem',
  fontWeight: 720,
  letterSpacing: '-0.03em',
  color: 'var(--brand-navy)',
};

const ledeStyle: CSSProperties = {
  color: 'var(--muted)',
  margin: '0.45rem 0 0',
  maxWidth: '44rem',
  lineHeight: 1.55,
};

export function PortfolioShell(props: {
  title: string;
  lede: string;
  children: ReactNode;
  docsHref?: string;
}) {
  const [engine, setEngine] = useState<PortfolioEngine | null>(null);

  useEffect(() => {
    void apiFetch<PortfolioEngine>('/v1/portfolio/engine')
      .then(setEngine)
      .catch(() => undefined);
  }, []);

  return (
    <AppShell>
      <h1 style={titleStyle}>{props.title}</h1>
      <p style={ledeStyle}>{props.lede}</p>
      <p style={{ margin: '0.65rem 0 0', fontSize: '0.9rem' }}>
        <Link href="/models">Models</Link>
        {' · '}
        <Link href="/verified-interpreter">Verified Interpreter</Link>
        {' · '}
        <Link href="/playground">Playground</Link>
        {props.docsHref ? (
          <>
            {' · '}
            <Link href={props.docsHref}>Docs</Link>
          </>
        ) : null}
      </p>
      {engine ? (
        <nav
          aria-label="Portfolio pillars"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
            marginTop: '1rem',
          }}
        >
          {engine.pillars.map((p) => (
            <Link
              key={p.id}
              href={p.console}
              className="vl-tag"
              style={{ textDecoration: 'none' }}
            >
              {p.displayName}
            </Link>
          ))}
        </nav>
      ) : null}
      <div style={{ marginTop: '1.5rem' }}>{props.children}</div>
    </AppShell>
  );
}

export { titleStyle, ledeStyle };
