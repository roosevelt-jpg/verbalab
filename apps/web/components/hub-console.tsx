'use client';

import type { ReactNode } from 'react';
import { AppShell } from '@/components/app-shell';
import { AnamorphicPanel } from '@/components/media/anamorphic-panel';
import { SITE_CONTENT, type HubCatalogItem } from '@/data/site-content';
import './media/anamorphic.css';

/**
 * Shared console shell for hub / VL-* surfaces: prefilled catalog + Lugemi 3D panel
 * so pages never look abandoned while waiting on API or keys.
 */
export function HubConsole({
  title,
  lede,
  catalogTitle = SITE_CONTENT.hubDefaults.catalogTitle,
  catalogLead = SITE_CONTENT.hubDefaults.catalogLead,
  catalogItems = SITE_CONTENT.hubDefaults.items,
  children,
}: {
  title: string;
  lede: string;
  catalogTitle?: string;
  catalogLead?: string;
  catalogItems?: HubCatalogItem[];
  children?: ReactNode;
}) {
  return (
    <AppShell>
      <div className="lg-hub-hero">
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.85rem',
              fontWeight: 720,
              letterSpacing: '-0.03em',
              margin: '0 0 0.35rem',
              color: 'var(--brand-navy)',
            }}
          >
            {title}
          </h1>
          <p style={{ color: 'var(--muted)', margin: 0, maxWidth: '42rem', lineHeight: 1.6 }}>{lede}</p>
        </div>
        <AnamorphicPanel variant="hub" size="sm" label={title} />
      </div>

      <section
        className="vl-endpoint-card"
        style={{ marginBottom: '1.25rem' }}
        aria-labelledby="lg-hub-catalog-title"
      >
        <h2
          id="lg-hub-catalog-title"
          style={{
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--muted)',
            margin: '0 0 0.35rem',
            fontWeight: 700,
          }}
        >
          {catalogTitle}
        </h2>
        <p style={{ color: 'var(--muted)', margin: '0 0 0.85rem', fontSize: '0.9rem', lineHeight: 1.55 }}>
          {catalogLead}
        </p>
        <ul
          style={{
            margin: 0,
            padding: 0,
            listStyle: 'none',
            display: 'grid',
            gap: '0.65rem',
            gridTemplateColumns: 'repeat(auto-fill, minmax(14rem, 1fr))',
          }}
        >
          {catalogItems.map((item) => (
            <li
              key={item.id}
              style={{
                borderTop: '1px solid var(--line)',
                paddingTop: '0.55rem',
              }}
            >
              <div style={{ fontWeight: 600, color: 'var(--brand-navy)', fontSize: '0.95rem' }}>{item.title}</div>
              <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: '0.2rem', lineHeight: 1.45 }}>
                {item.body}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {children}
    </AppShell>
  );
}
