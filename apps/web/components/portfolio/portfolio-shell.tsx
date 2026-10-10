'use client';

import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/platform';

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
      <div className="lg-page">
        <PageHeader eyebrow="Portfolio" title={props.title} lede={props.lede}>
          <p>
            Move between models, verified interpretation, and the playground without leaving the
            Lugemi console. Each pillar below links to its working surface.
          </p>
        </PageHeader>

        <p className="lg-type-compact" style={{ margin: 0 }}>
          <Link href="/models" style={{ color: 'var(--action-primary)', fontWeight: 600 }}>
            Models
          </Link>
          {' · '}
          <Link href="/verified-interpreter" style={{ color: 'var(--action-primary)', fontWeight: 600 }}>
            Verified Interpreter
          </Link>
          {' · '}
          <Link href="/playground" style={{ color: 'var(--action-primary)', fontWeight: 600 }}>
            Playground
          </Link>
          {props.docsHref ? (
            <>
              {' · '}
              <Link href={props.docsHref} style={{ color: 'var(--action-primary)', fontWeight: 600 }}>
                Docs
              </Link>
            </>
          ) : null}
        </p>

        {engine ? (
          <nav aria-label="Portfolio pillars" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {engine.pillars.map((p) => (
              <Link key={p.id} href={p.console} className="vl-tag" style={{ textDecoration: 'none' }}>
                {p.displayName}
              </Link>
            ))}
          </nav>
        ) : null}

        <div>{props.children}</div>
      </div>
    </AppShell>
  );
}

/** @deprecated Prefer PageHeader + lg-type-* classes */
export const titleStyle = {
  margin: 0,
  fontFamily: 'var(--font-display)',
  fontSize: '1.85rem',
  fontWeight: 720,
  letterSpacing: '-0.03em',
  color: 'var(--brand-navy)',
} as const;

/** @deprecated Prefer lg-type-body / lg-prose */
export const ledeStyle = {
  color: 'var(--muted)',
  margin: '0.45rem 0 0',
  maxWidth: '44rem',
  lineHeight: 1.55,
} as const;
