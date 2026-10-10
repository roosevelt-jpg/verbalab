'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CmsDocument, CmsPage, CmsSeo } from '@/data/cms-types';
import { parseCmsSections, serializeCmsSections } from '@/lib/cms-section-text';
import { CmsMediaField } from '@/components/admin/cms-media-field';

type Tab =
  | 'seo'
  | 'hero'
  | 'nav'
  | 'products'
  | 'sections'
  | 'footer'
  | 'pages'
  | 'media'
  | 'console'
  | 'raw';

const TABS: { id: Tab; label: string }[] = [
  { id: 'seo', label: 'SEO & share' },
  { id: 'hero', label: 'Hero' },
  { id: 'nav', label: 'Nav' },
  { id: 'products', label: 'Products' },
  { id: 'sections', label: 'Sections' },
  { id: 'footer', label: 'Footer' },
  { id: 'pages', label: 'Pages' },
  { id: 'media', label: 'Media' },
  { id: 'console', label: 'Console copy' },
  { id: 'raw', label: 'Raw JSON' },
];

const ROUTE_SEO_KEYS = [
  '/',
  '/pricing',
  '/coverage',
  '/baobab',
  '/enterprise',
  '/organizations',
  '/mcp',
  '/docs',
  '/docs/api',
  '/accent-identity',
  '/developers',
  '/sign-up',
  '/sign-in',
  '/onboarding',
  '/dealbridge',
] as const;

function emptySeo(): CmsSeo {
  return { title: '', description: '', ogImageUrl: '', ogImageAlt: '', noIndex: false };
}

function SeoFields({
  value,
  onChange,
  heading,
}: {
  value: CmsSeo;
  onChange: (next: CmsSeo) => void;
  heading?: string;
}) {
  const v = { ...emptySeo(), ...value };
  return (
    <div style={{ display: 'grid', gap: '0.75rem' }}>
      {heading ? (
        <h3 style={{ margin: '0.5rem 0 0', fontSize: '1rem' }}>{heading}</h3>
      ) : null}
      <Field label="SEO title" value={v.title ?? ''} onChange={(t) => onChange({ ...v, title: t })} />
      <Field
        label="Meta description"
        value={v.description ?? ''}
        multiline
        rows={3}
        onChange={(d) => onChange({ ...v, description: d })}
      />
      <Field
        label="OG / share image URL"
        value={v.ogImageUrl ?? ''}
        onChange={(u) => onChange({ ...v, ogImageUrl: u })}
      />
      <Field
        label="OG image alt"
        value={v.ogImageAlt ?? ''}
        onChange={(a) => onChange({ ...v, ogImageAlt: a })}
      />
      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
        <input
          type="checkbox"
          checked={Boolean(v.noIndex)}
          onChange={(e) => onChange({ ...v, noIndex: e.target.checked })}
        />
        Hide from search engines (noindex)
      </label>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  multiline,
  rows,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  rows?: number;
}) {
  return (
    <label style={{ display: 'grid', gap: '0.35rem' }}>
      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--muted)' }}>{label}</span>
      {multiline ? (
        <textarea
          className="vl-input"
          value={value}
          rows={rows ?? 4}
          onChange={(e) => onChange(e.target.value)}
          style={{ fontFamily: 'inherit', resize: 'vertical' }}
        />
      ) : (
        <input className="vl-input" value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </label>
  );
}

export function CmsEditor() {
  const [doc, setDoc] = useState<CmsDocument | null>(null);
  const [tab, setTab] = useState<Tab>('seo');
  const [pageSlug, setPageSlug] = useState<string>('');
  const [routeKey, setRouteKey] = useState<string>('/');
  const [raw, setRaw] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploadLabel, setUploadLabel] = useState('Homepage media');

  const load = useCallback(async () => {
    setError(null);
    const res = await fetch('/api/cms', { cache: 'no-store' });
    if (!res.ok) throw new Error(`Failed to load CMS (${res.status})`);
    const data = (await res.json()) as CmsDocument;
    setDoc(data);
    setRaw(JSON.stringify(data, null, 2));
    setPageSlug(data.pages[0]?.slug ?? '');
  }, []);

  useEffect(() => {
    void load().catch((err: Error) => setError(err.message));
  }, [load]);

  const selectedPage: CmsPage | null = useMemo(() => {
    if (!doc) return null;
    return doc.pages.find((p) => p.slug === pageSlug) ?? doc.pages[0] ?? null;
  }, [doc, pageSlug]);

  async function save(next: CmsDocument) {
    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      const res = await fetch('/api/cms', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.error?.message ?? `Save failed (${res.status})`);
      }
      const saved = body as CmsDocument;
      setDoc(saved);
      setRaw(JSON.stringify(saved, null, 2));
      setStatus(`Saved ${new Date(saved.updatedAt).toLocaleString()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  }

  async function onUpload(file: File) {
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.set('file', file);
      form.set('label', uploadLabel);
      const res = await fetch('/api/cms/media', { method: 'POST', body: form });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error?.message ?? `Upload failed (${res.status})`);
      await load();
      setStatus(`Uploaded ${body.url}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  }

  function updatePage(mutator: (page: CmsPage) => CmsPage) {
    if (!doc || !selectedPage) return;
    const pages = doc.pages.map((p) => (p.slug === selectedPage.slug ? mutator(p) : p));
    setDoc({ ...doc, pages });
  }

  if (!doc) {
    return <p style={{ color: 'var(--muted)' }}>{error ? error : 'Loading CMS…'}</p>;
  }

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className="vl-btn"
            onClick={() => setTab(t.id)}
            style={{
              background: tab === t.id ? 'var(--ink)' : undefined,
              color: tab === t.id ? '#fff' : undefined,
              border: tab === t.id ? 'none' : undefined,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error ? <p style={{ color: 'var(--bad)', margin: 0 }}>{error}</p> : null}
      {status ? <p style={{ color: 'var(--muted)', margin: 0 }}>{status}</p> : null}

      <div className="vl-panel" style={{ padding: '1.25rem', display: 'grid', gap: '1rem' }}>
        {tab === 'seo' ? (
          <>
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Controls browser titles, meta descriptions, and Open Graph / Twitter cards when pages
              are shared. Site defaults apply everywhere; route overrides cover first-class URLs;
              each CMS page can also set its own SEO under the Pages tab.
            </p>
            <Field
              label="Brand name"
              value={doc.brand.name}
              onChange={(v) => setDoc({ ...doc, brand: { ...doc.brand, name: v } })}
            />
            <Field
              label="Brand domain"
              value={doc.brand.domain}
              onChange={(v) => setDoc({ ...doc, brand: { ...doc.brand, domain: v } })}
            />
            <Field
              label="Brand tagline"
              value={doc.brand.tagline}
              onChange={(v) => setDoc({ ...doc, brand: { ...doc.brand, tagline: v } })}
            />
            <Field
              label="Brand positioning (fallback description)"
              value={doc.brand.positioning}
              multiline
              rows={3}
              onChange={(v) => setDoc({ ...doc, brand: { ...doc.brand, positioning: v } })}
            />
            <SeoFields
              heading="Site-wide SEO defaults"
              value={doc.seo ?? emptySeo()}
              onChange={(seo) => setDoc({ ...doc, seo })}
            />
            <CmsMediaField
              label="Default share / OG image"
              uploadLabel="SEO default OG"
              value={{
                imageUrl: doc.seo?.ogImageUrl,
                alt: doc.seo?.ogImageAlt,
              }}
              onChange={(media) =>
                setDoc({
                  ...doc,
                  seo: {
                    ...(doc.seo ?? {}),
                    ogImageUrl: media?.imageUrl ?? '',
                    ogImageAlt: media?.alt ?? doc.seo?.ogImageAlt,
                  },
                })
              }
              onUploaded={() => void load()}
            />
            <label style={{ display: 'grid', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--muted)' }}>
                Route SEO override
              </span>
              <select
                className="vl-input"
                value={routeKey}
                onChange={(e) => setRouteKey(e.target.value)}
              >
                {ROUTE_SEO_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {key}
                  </option>
                ))}
                {Object.keys(doc.routeSeo ?? {})
                  .filter((k) => !(ROUTE_SEO_KEYS as readonly string[]).includes(k))
                  .map((key) => (
                    <option key={key} value={key}>
                      {key}
                    </option>
                  ))}
              </select>
            </label>
            <SeoFields
              heading={`SEO for ${routeKey}`}
              value={doc.routeSeo?.[routeKey] ?? emptySeo()}
              onChange={(seo) =>
                setDoc({
                  ...doc,
                  routeSeo: {
                    ...(doc.routeSeo ?? {}),
                    [routeKey]: seo,
                  },
                })
              }
            />
          </>
        ) : null}

        {tab === 'hero' ? (
          <>
            <Field
              label="Eyebrow"
              value={doc.hero.eyebrow}
              onChange={(v) => setDoc({ ...doc, hero: { ...doc.hero, eyebrow: v } })}
            />
            <Field
              label="Brand"
              value={doc.hero.brand}
              onChange={(v) => setDoc({ ...doc, hero: { ...doc.hero, brand: v } })}
            />
            <Field
              label="Headline"
              value={doc.hero.headline}
              onChange={(v) => setDoc({ ...doc, hero: { ...doc.hero, headline: v } })}
            />
            <Field
              label="Lead"
              value={doc.hero.lead}
              multiline
              onChange={(v) => setDoc({ ...doc, hero: { ...doc.hero, lead: v } })}
            />
            <Field
              label="Primary CTA label"
              value={doc.hero.primaryCta.label}
              onChange={(v) =>
                setDoc({
                  ...doc,
                  hero: { ...doc.hero, primaryCta: { ...doc.hero.primaryCta, label: v } },
                })
              }
            />
            <Field
              label="Primary CTA href"
              value={doc.hero.primaryCta.href}
              onChange={(v) =>
                setDoc({
                  ...doc,
                  hero: { ...doc.hero, primaryCta: { ...doc.hero.primaryCta, href: v } },
                })
              }
            />
            <Field
              label="Secondary CTA label"
              value={doc.hero.secondaryCta.label}
              onChange={(v) =>
                setDoc({
                  ...doc,
                  hero: { ...doc.hero, secondaryCta: { ...doc.hero.secondaryCta, label: v } },
                })
              }
            />
            <Field
              label="Secondary CTA href"
              value={doc.hero.secondaryCta.href}
              onChange={(v) =>
                setDoc({
                  ...doc,
                  hero: { ...doc.hero, secondaryCta: { ...doc.hero.secondaryCta, href: v } },
                })
              }
            />
            <CmsMediaField
              label="Hero media"
              uploadLabel="Hero media"
              value={doc.hero.media}
              onChange={(media) => setDoc({ ...doc, hero: { ...doc.hero, media } })}
              onUploaded={() => void load()}
            />
            <Field
              label="Demo title"
              value={doc.hero.demo.title}
              onChange={(v) =>
                setDoc({ ...doc, hero: { ...doc.hero, demo: { ...doc.hero.demo, title: v } } })
              }
            />
            <Field
              label="Demo default script"
              value={doc.hero.demo.defaultText}
              multiline
              onChange={(v) =>
                setDoc({
                  ...doc,
                  hero: { ...doc.hero, demo: { ...doc.hero.demo, defaultText: v } },
                })
              }
            />
            <Field
              label="Demo voices (one per line: id|label)"
              value={doc.hero.demo.voices.map((v) => `${v.id}|${v.label}`).join('\n')}
              multiline
              rows={5}
              onChange={(v) =>
                setDoc({
                  ...doc,
                  hero: {
                    ...doc.hero,
                    demo: {
                      ...doc.hero.demo,
                      voices: v
                        .split('\n')
                        .map((line) => line.trim())
                        .filter(Boolean)
                        .map((line) => {
                          const parts = line.split('|');
                          const id = (parts[0] ?? 'voice').trim();
                          const label = parts.slice(1).join('|').trim() || id;
                          return { id, label };
                        }),
                    },
                  },
                })
              }
            />
            <Field
              label="Language bar (one language per line)"
              value={doc.languageBar.languages.join('\n')}
              multiline
              rows={8}
              onChange={(v) =>
                setDoc({
                  ...doc,
                  languageBar: {
                    languages: v
                      .split('\n')
                      .map((line) => line.trim())
                      .filter(Boolean),
                  },
                })
              }
            />
          </>
        ) : null}

        {tab === 'nav' ? (
          <>
            <Field
              label="Center links (label|href or label|href|Child>url;Child>url per line)"
              value={doc.nav.centerLinks
                .map((l) => {
                  const kids = (l.children ?? [])
                    .map((c) => `${c.label}>${c.href}`)
                    .join(';');
                  return kids ? `${l.label}|${l.href}|${kids}` : `${l.label}|${l.href}`;
                })
                .join('\n')}
              multiline
              rows={12}
              onChange={(v) =>
                setDoc({
                  ...doc,
                  nav: {
                    ...doc.nav,
                    centerLinks: v
                      .split('\n')
                      .map((line) => line.trim())
                      .filter(Boolean)
                      .map((line) => {
                        const parts = line.split('|');
                        const label = (parts[0] ?? 'Link').trim();
                        const href = (parts[1] ?? '/').trim() || '/';
                        const childRaw = (parts[2] ?? '').trim();
                        const children = childRaw
                          ? childRaw
                              .split(';')
                              .map((chunk) => chunk.trim())
                              .filter(Boolean)
                              .map((chunk) => {
                                const [cLabel, ...rest] = chunk.split('>');
                                return {
                                  label: (cLabel ?? 'Link').trim(),
                                  href: (rest.join('>') || '/').trim() || '/',
                                };
                              })
                          : undefined;
                        return children?.length ? { label, href, children } : { label, href };
                      }),
                  },
                })
              }
            />
            <Field
              label="Console label"
              value={doc.nav.actions.console.label}
              onChange={(v) =>
                setDoc({
                  ...doc,
                  nav: {
                    ...doc.nav,
                    actions: {
                      ...doc.nav.actions,
                      console: { ...doc.nav.actions.console, label: v },
                    },
                  },
                })
              }
            />
            <Field
              label="Signup label"
              value={doc.nav.actions.signup.label}
              onChange={(v) =>
                setDoc({
                  ...doc,
                  nav: {
                    ...doc.nav,
                    actions: {
                      ...doc.nav.actions,
                      signup: { ...doc.nav.actions.signup, label: v },
                    },
                  },
                })
              }
            />
          </>
        ) : null}

        {tab === 'products' ? (
          <>
            <Field
              label="Products section title"
              value={doc.products.title}
              onChange={(v) => setDoc({ ...doc, products: { ...doc.products, title: v } })}
            />
            <Field
              label="Products lede"
              value={doc.products.lede}
              multiline
              onChange={(v) => setDoc({ ...doc, products: { ...doc.products, lede: v } })}
            />
            {doc.products.items.map((item, idx) => (
              <div
                key={item.id}
                style={{
                  display: 'grid',
                  gap: '0.65rem',
                  padding: '0.85rem',
                  border: '1px solid rgba(16,38,77,0.1)',
                  borderRadius: 12,
                }}
              >
                <strong>{item.name}</strong>
                <Field
                  label="Name"
                  value={item.name}
                  onChange={(v) => {
                    const items = [...doc.products.items];
                    items[idx] = { ...item, name: v };
                    setDoc({ ...doc, products: { ...doc.products, items } });
                  }}
                />
                <Field
                  label="Body"
                  value={item.body}
                  multiline
                  onChange={(v) => {
                    const items = [...doc.products.items];
                    items[idx] = { ...item, body: v };
                    setDoc({ ...doc, products: { ...doc.products, items } });
                  }}
                />
                <Field
                  label="Href"
                  value={item.href}
                  onChange={(v) => {
                    const items = [...doc.products.items];
                    items[idx] = { ...item, href: v };
                    setDoc({ ...doc, products: { ...doc.products, items } });
                  }}
                />
                <CmsMediaField
                  label={`${item.name} media`}
                  uploadLabel={`Product · ${item.name}`}
                  value={item.media}
                  onChange={(media) => {
                    const items = [...doc.products.items];
                    items[idx] = { ...item, media };
                    setDoc({ ...doc, products: { ...doc.products, items } });
                  }}
                  onUploaded={() => void load()}
                />
              </div>
            ))}
          </>
        ) : null}

        {tab === 'sections' ? (
          <>
            <Field
              label="Use cases title"
              value={doc.useCases.title}
              onChange={(v) => setDoc({ ...doc, useCases: { ...doc.useCases, title: v } })}
            />
            <Field
              label="Hubs title"
              value={doc.hubs.title}
              onChange={(v) => setDoc({ ...doc, hubs: { ...doc.hubs, title: v } })}
            />
            <Field
              label="Creative title"
              value={doc.creative.title}
              onChange={(v) => setDoc({ ...doc, creative: { ...doc.creative, title: v } })}
            />
            <Field
              label="Creative module body"
              value={doc.creative.moduleBody}
              multiline
              onChange={(v) => setDoc({ ...doc, creative: { ...doc.creative, moduleBody: v } })}
            />
            <CmsMediaField
              label="Creative section media"
              uploadLabel="Creative section"
              value={doc.creative.media}
              onChange={(media) => setDoc({ ...doc, creative: { ...doc.creative, media } })}
              onUploaded={() => void load()}
            />
            <Field
              label="Agents title"
              value={doc.agents.title}
              onChange={(v) => setDoc({ ...doc, agents: { ...doc.agents, title: v } })}
            />
            <CmsMediaField
              label="Agents section media"
              uploadLabel="Agents section"
              value={doc.agents.media}
              onChange={(media) => setDoc({ ...doc, agents: { ...doc.agents, media } })}
              onUploaded={() => void load()}
            />
            <Field
              label="API title"
              value={doc.api.title}
              onChange={(v) => setDoc({ ...doc, api: { ...doc.api, title: v } })}
            />
            <Field
              label="API snippet"
              value={doc.api.snippet}
              multiline
              rows={10}
              onChange={(v) => setDoc({ ...doc, api: { ...doc.api, snippet: v } })}
            />
            <Field
              label="Banner title"
              value={doc.banner.title}
              onChange={(v) => setDoc({ ...doc, banner: { ...doc.banner, title: v } })}
            />
            <Field
              label="Banner body"
              value={doc.banner.body}
              multiline
              onChange={(v) => setDoc({ ...doc, banner: { ...doc.banner, body: v } })}
            />
          </>
        ) : null}

        {tab === 'footer' ? (
          <>
            <Field
              label="Footer mission"
              value={doc.footer.mission}
              multiline
              onChange={(v) => setDoc({ ...doc, footer: { ...doc.footer, mission: v } })}
            />
            <Field
              label="Copyright"
              value={doc.footer.copyright}
              onChange={(v) => setDoc({ ...doc, footer: { ...doc.footer, copyright: v } })}
            />
            <Field
              label="Support FAB label"
              value={doc.footer.supportFab.label}
              onChange={(v) =>
                setDoc({
                  ...doc,
                  footer: {
                    ...doc.footer,
                    supportFab: { ...doc.footer.supportFab, label: v },
                  },
                })
              }
            />
            {doc.footer.columns.map((col, cIdx) => {
              const isSocials = col.id === 'socials';
              return (
                <div key={col.id} style={{ display: 'grid', gap: '0.5rem' }}>
                  <Field
                    label={`${col.title} column title`}
                    value={col.title}
                    onChange={(v) => {
                      const columns = [...doc.footer.columns];
                      columns[cIdx] = { ...col, title: v };
                      setDoc({ ...doc, footer: { ...doc.footer, columns } });
                    }}
                  />
                  <Field
                    label={
                      isSocials
                        ? 'Socials (label|href per line — channel name and URL only)'
                        : `${col.title} links (label|href)`
                    }
                    value={col.links.map((l) => `${l.label}|${l.href}`).join('\n')}
                    multiline
                    rows={isSocials ? 10 : 6}
                    onChange={(v) => {
                      const columns = [...doc.footer.columns];
                      columns[cIdx] = {
                        ...col,
                        links: v
                          .split('\n')
                          .map((line) => line.trim())
                          .filter(Boolean)
                          .map((line) => {
                            const parts = line.split('|');
                            const label = (parts[0] ?? 'Link').trim();
                            const href = (parts[1] ?? '/').trim();
                            return { label, href };
                          }),
                      };
                      setDoc({ ...doc, footer: { ...doc.footer, columns } });
                    }}
                  />
                  {isSocials ? (
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--muted)' }}>
                      These entries drive the footer Socials column and /p/socials. No descriptions
                      needed — one label and one URL per line.
                    </p>
                  ) : null}
                </div>
              );
            })}
          </>
        ) : null}

        {tab === 'pages' && selectedPage ? (
          <>
            <label style={{ display: 'grid', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--muted)' }}>
                Select page
              </span>
              <select
                className="vl-input"
                value={selectedPage.slug}
                onChange={(e) => setPageSlug(e.target.value)}
              >
                {doc.pages.map((p) => (
                  <option key={p.slug} value={p.slug}>
                    /p/{p.slug} — {p.title}
                  </option>
                ))}
              </select>
            </label>
            <Field
              label="Title"
              value={selectedPage.title}
              onChange={(v) => updatePage((p) => ({ ...p, title: v }))}
            />
            <Field
              label="Eyebrow"
              value={selectedPage.eyebrow ?? ''}
              onChange={(v) => updatePage((p) => ({ ...p, eyebrow: v || undefined }))}
            />
            <Field
              label="Lead"
              value={selectedPage.lead}
              multiline
              onChange={(v) => updatePage((p) => ({ ...p, lead: v }))}
            />
            <Field
              label="Body"
              value={selectedPage.body}
              multiline
              rows={6}
              onChange={(v) => updatePage((p) => ({ ...p, body: v }))}
            />
            <CmsMediaField
              label="Page hero media"
              uploadLabel={`Page · ${selectedPage.slug}`}
              value={selectedPage.media}
              onChange={(media) => updatePage((p) => ({ ...p, media }))}
              onUploaded={() => void load()}
            />
            <SeoFields
              heading="Page SEO & share (optional — falls back to title / lead / hero media)"
              value={selectedPage.seo ?? emptySeo()}
              onChange={(seo) => updatePage((p) => ({ ...p, seo }))}
            />
            <Field
              label="Primary CTA label"
              value={selectedPage.primaryCta?.label ?? ''}
              onChange={(v) =>
                updatePage((p) => ({
                  ...p,
                  primaryCta: {
                    label: v,
                    href: p.primaryCta?.href ?? '/sign-up',
                  },
                }))
              }
            />
            <Field
              label="Primary CTA href"
              value={selectedPage.primaryCta?.href ?? ''}
              onChange={(v) =>
                updatePage((p) => ({
                  ...p,
                  primaryCta: {
                    label: p.primaryCta?.label ?? 'Continue',
                    href: v,
                  },
                }))
              }
            />
            <Field
              label="Sections — [kind] Title||Body, then > steps and @ label|href (blank line between blocks)"
              value={serializeCmsSections(selectedPage.sections ?? [])}
              multiline
              rows={16}
              onChange={(v) =>
                updatePage((p) => ({
                  ...p,
                  sections: parseCmsSections(v, p.sections ?? []),
                }))
              }
            />
            <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.85rem', lineHeight: 1.45 }}>
              Use <code className="vl-code">[guide]</code> or <code className="vl-code">[api]</code> for
              ProductGuideKit blocks. Content sections omit the tag. Steps start with{' '}
              <code className="vl-code">&gt;</code>; links with <code className="vl-code">@</code>. Copy stays
              in the text field above; media uploads below are separate.
            </p>
            {(selectedPage.sections ?? []).length > 0 ? (
              <div style={{ display: 'grid', gap: '0.85rem' }}>
                <strong style={{ fontSize: '0.9rem', color: 'var(--brand-navy)' }}>
                  Section media (text + image/video cards)
                </strong>
                {(selectedPage.sections ?? []).map((section, sIdx) => (
                  <div
                    key={section.id}
                    style={{
                      display: 'grid',
                      gap: '0.55rem',
                      padding: '0.85rem',
                      border: '1px solid rgba(16,38,77,0.1)',
                      borderRadius: 12,
                    }}
                  >
                    <div style={{ fontWeight: 650 }}>{section.title || `Section ${sIdx + 1}`}</div>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--muted)' }}>
                      {(section.body || '').slice(0, 140)}
                      {(section.body || '').length > 140 ? '…' : ''}
                    </p>
                    <CmsMediaField
                      label="Card media"
                      uploadLabel={`Section · ${section.title || section.id}`}
                      value={section.media}
                      onChange={(media) =>
                        updatePage((p) => ({
                          ...p,
                          sections: (p.sections ?? []).map((s, i) =>
                            i === sIdx ? { ...s, media } : s,
                          ),
                        }))
                      }
                      onUploaded={() => void load()}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted)' }}>
                Add section text blocks above, then upload image/video media for each card here.
              </p>
            )}
            <button
              type="button"
              className="vl-btn"
              onClick={() => {
                const slug = `page-${Date.now().toString(36)}`;
                const nextPage: CmsPage = {
                  slug,
                  title: 'New page',
                  lead: 'Edit this page in Admin CMS.',
                  body: 'Add body copy, media, and sections.',
                  showInFooter: true,
                  primaryCta: { label: 'Start free', href: '/sign-up' },
                };
                setDoc({ ...doc, pages: [...doc.pages, nextPage] });
                setPageSlug(slug);
              }}
            >
              Add page
            </button>
          </>
        ) : null}

        {tab === 'media' ? (
          <>
            <Field label="Upload label" value={uploadLabel} onChange={setUploadLabel} />
            <label
              className="vl-btn vl-btn-primary"
              style={{
                display: 'inline-flex',
                cursor: busy ? 'wait' : 'pointer',
                opacity: busy ? 0.65 : 1,
                width: 'fit-content',
              }}
            >
              {busy ? 'Uploading…' : 'Upload image or video'}
              <input
                type="file"
                accept="image/*,video/*"
                hidden
                disabled={busy}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void onUpload(file);
                  e.target.value = '';
                }}
              />
            </label>
            <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.9rem' }}>
              Uploads store under <code className="vl-code">public/cms-media/</code>. Prefer Upload on
              Hero, Products, and page section cards — copy stays plain text; media is separate.
            </p>
            {doc.mediaLibrary.length === 0 ? (
              <p style={{ margin: 0, color: 'var(--muted)' }}>
                Library empty — upload an image or video to get started.
              </p>
            ) : (
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: '0.65rem' }}>
                {doc.mediaLibrary.map((m) => (
                  <li
                    key={m.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '5rem 1fr',
                      gap: '0.75rem',
                      alignItems: 'center',
                      padding: '0.55rem',
                      border: '1px solid rgba(16,38,77,0.08)',
                      borderRadius: 10,
                      background: 'var(--surface-canvas)',
                    }}
                  >
                    <div
                      style={{
                        width: '5rem',
                        height: '3.5rem',
                        borderRadius: 6,
                        overflow: 'hidden',
                        background: '#0b1426',
                      }}
                    >
                      {m.kind === 'video' ? (
                        <video src={m.url} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <img src={m.url} alt={m.alt ?? m.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      )}
                    </div>
                    <div>
                      <strong>{m.label}</strong> · {m.kind}
                      <div>
                        <code className="vl-code" style={{ fontSize: '0.75rem' }}>
                          {m.url}
                        </code>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : null}

        {tab === 'console' ? (
          <>
            <Field
              label="Dashboard welcome title"
              value={doc.console.dashboardWelcome.title}
              onChange={(v) =>
                setDoc({
                  ...doc,
                  console: {
                    ...doc.console,
                    dashboardWelcome: { ...doc.console.dashboardWelcome, title: v },
                  },
                })
              }
            />
            <Field
              label="Dashboard welcome lead"
              value={doc.console.dashboardWelcome.lead}
              multiline
              onChange={(v) =>
                setDoc({
                  ...doc,
                  console: {
                    ...doc.console,
                    dashboardWelcome: { ...doc.console.dashboardWelcome, lead: v },
                  },
                })
              }
            />
            <Field
              label="Docs intro title"
              value={doc.console.docsIntro.title}
              onChange={(v) =>
                setDoc({
                  ...doc,
                  console: {
                    ...doc.console,
                    docsIntro: { ...doc.console.docsIntro, title: v },
                  },
                })
              }
            />
            <Field
              label="Docs intro lead"
              value={doc.console.docsIntro.lead}
              multiline
              onChange={(v) =>
                setDoc({
                  ...doc,
                  console: {
                    ...doc.console,
                    docsIntro: { ...doc.console.docsIntro, lead: v },
                  },
                })
              }
            />
            <Field
              label="Playground default text"
              value={doc.console.playgroundDefaults.text}
              multiline
              onChange={(v) =>
                setDoc({
                  ...doc,
                  console: {
                    ...doc.console,
                    playgroundDefaults: { ...doc.console.playgroundDefaults, text: v },
                  },
                })
              }
            />
          </>
        ) : null}

        {tab === 'raw' ? (
          <textarea
            className="vl-input"
            value={raw}
            rows={24}
            onChange={(e) => setRaw(e.target.value)}
            style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.8rem' }}
          />
        ) : null}
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          className="vl-btn vl-btn-primary"
          disabled={busy}
          onClick={() => {
            if (tab === 'raw') {
              try {
                const parsed = JSON.parse(raw) as CmsDocument;
                void save(parsed);
              } catch {
                setError('Raw JSON is invalid');
              }
              return;
            }
            void save(doc);
          }}
        >
          {busy ? 'Saving…' : 'Save CMS'}
        </button>
        <button
          type="button"
          className="vl-btn"
          disabled={busy}
          onClick={() => void load().catch((err: Error) => setError(err.message))}
        >
          Reload
        </button>
        <a className="vl-btn" href="/" target="_blank" rel="noreferrer">
          Preview homepage
        </a>
        {selectedPage ? (
          <a className="vl-btn" href={`/p/${selectedPage.slug}`} target="_blank" rel="noreferrer">
            Preview /p/{selectedPage.slug}
          </a>
        ) : null}
      </div>
    </div>
  );
}
