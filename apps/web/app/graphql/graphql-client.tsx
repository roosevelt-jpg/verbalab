'use client';

import { CSSProperties } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/app-shell';
import { API_URL } from '@/lib/api';

const EXAMPLE = `query {
  languages { code nameEn tier }
  dialects(language: "sw") { code nameEn }
  countryPacks(region: "East Africa") { code nameEn currencyCode }
  languageProducts { id name status }
}`;

export function GraphqlClient() {
  return (
    <AppShell>
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.85rem',
          fontWeight: 720,
          letterSpacing: '-0.03em',
          margin: '0 0 0.35rem',
        }}
      >
        GraphQL
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0 0 1.5rem', maxWidth: '42rem' }}>
        Bounded Language Cloud façade over CQRS command/query buses (ports → Nest adapters). REST remains primary. Not
        federation, not platform-wide hexagonal.
      </p>

      <section style={{ marginBottom: '1.5rem' }}>
        <h2 style={label}>Endpoint</h2>
        <p style={{ margin: 0, fontWeight: 600 }}>
          <code>POST {API_URL}/graphql</code>
        </p>
        <p style={{ margin: '0.35rem 0 0', color: 'var(--muted)', fontSize: '0.9rem' }}>
          Mutations require <code>Authorization: Bearer</code> (API key or Clerk). Send{' '}
          <code>apollo-require-preflight: true</code> for browser clients when CSRF prevention is on.
        </p>
        <p style={{ margin: '0.75rem 0 0' }}>
          <Link href={`${API_URL}/graphql`} style={{ color: 'var(--ink)', fontWeight: 600 }}>
            Open Apollo landing / schema →
          </Link>
        </p>
      </section>

      <section>
        <h2 style={label}>Example query</h2>
        <pre
          style={{
            margin: 0,
            padding: '1rem',
            background: 'rgba(0,0,0,0.04)',
            borderRadius: '0.5rem',
            overflow: 'auto',
            fontSize: '0.85rem',
            lineHeight: 1.45,
          }}
        >
          {EXAMPLE}
        </pre>
      </section>
    </AppShell>
  );
}

const label: CSSProperties = {
  fontSize: '0.8rem',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'var(--muted)',
  margin: '0 0 0.5rem',
};
