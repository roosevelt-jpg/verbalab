import Link from 'next/link';
import type { CmsPage } from '@/data/cms-types';

const DEFAULT_LINKS = [
  { label: 'API docs', href: '/docs' },
  { label: 'Playground', href: '/playground' },
  { label: 'SDKs & CLI', href: '/developers' },
  { label: 'OpenAPI', href: '/docs' },
];

/** Per-product use-case / demo / API / SDK guide strip for CMS marketing pages. */
export function ProductGuideKit({ page }: { page: CmsPage }) {
  const guideSections = (page.sections ?? []).filter((s) => s.kind === 'guide' || s.kind === 'api');
  const links =
    guideSections.flatMap((s) => s.links ?? []).length > 0
      ? guideSections.flatMap((s) => s.links ?? [])
      : DEFAULT_LINKS;

  return (
    <div className="mkt-product-guide" style={{ marginTop: '2rem' }}>
      <h2 style={{ margin: '0 0 0.5rem', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
        Use cases, demos &amp; developer kit
      </h2>
      <p style={{ margin: '0 0 1.1rem', color: 'var(--muted)', maxWidth: '40rem', lineHeight: 1.5 }}>
        How teams ship with {page.title}: interactive demos above, step guides below, and the same{' '}
        <code>/v1</code> surface for APIs and SDKs.
      </p>

      {guideSections.length > 0 ? (
        <div className="mkt-feature-grid" style={{ marginBottom: '1.25rem' }}>
          {guideSections.map((section) => (
            <article key={section.id} className="mkt-plain-card">
              <h3>{section.title}</h3>
              <p>{section.body}</p>
              {section.steps && section.steps.length > 0 ? (
                <ol style={{ margin: '0.75rem 0 0', paddingLeft: '1.15rem', lineHeight: 1.55 }}>
                  {section.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              ) : null}
            </article>
          ))}
        </div>
      ) : null}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.55rem' }}>
        {links.map((link) => (
          <Link key={`${link.href}-${link.label}`} href={link.href} className="vl-btn vl-btn-secondary">
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
