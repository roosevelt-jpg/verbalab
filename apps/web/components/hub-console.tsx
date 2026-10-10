'use client';

import type { ReactNode } from 'react';
import { AppShell } from '@/components/app-shell';
import { AnamorphicPanel } from '@/components/media/anamorphic-panel';
import { FeaturePanel, PageHeader } from '@/components/platform';
import { SITE_CONTENT, type HubCatalogItem } from '@/data/site-content';
import './media/anamorphic.css';

/**
 * Shared console shell for hub surfaces: unified page chrome, catalog cards,
 * and Lugemi visual panel so pages stay brand-aligned while waiting on API or keys.
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
  const featurePreview = catalogItems.slice(0, 3);

  return (
    <AppShell>
      <div className="lg-page">
        <div className="lg-hub-hero">
          <PageHeader eyebrow="Lugemi" title={title} lede={lede} compact />
          <AnamorphicPanel variant="hub" size="sm" label={title} />
        </div>

        {featurePreview.length > 0 ? (
          <section className="lg-page-section" aria-label="Capabilities">
            <div className="lg-page-section__head">
              <h2 className="lg-type-section">What you can do here</h2>
              <p className="lg-type-body">
                These capabilities describe the product surface. Availability depends on your plan,
                workspace flags, and model coverage for each language.
              </p>
            </div>
            <div className="lg-grid-3">
              {featurePreview.map((item, index) => (
                <FeaturePanel
                  key={item.id}
                  icon={index === 0 ? 'speech' : index === 1 ? 'translate' : 'model'}
                  title={item.title}
                  body={item.body}
                />
              ))}
            </div>
          </section>
        ) : null}

        <section className="lg-page-section" aria-labelledby="lg-hub-catalog-title">
          <div className="lg-page-section__head">
            <h2 id="lg-hub-catalog-title" className="lg-type-section">
              {catalogTitle}
            </h2>
            <p className="lg-type-body">{catalogLead}</p>
          </div>
          <ul className="lg-hub-catalog">
            {catalogItems.map((item) => (
              <li key={item.id}>
                <strong>{item.title}</strong>
                <span>{item.body}</span>
              </li>
            ))}
          </ul>
        </section>

        {children}
      </div>
    </AppShell>
  );
}
