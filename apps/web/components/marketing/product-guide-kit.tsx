import Link from 'next/link';
import type { CmsPage, CmsPageSection } from '@/data/cms-types';

const DEFAULT_LINKS = [
  { label: 'API docs', href: '/docs' },
  { label: 'Playground', href: '/playground' },
  { label: 'SDKs & CLI', href: '/developers' },
  { label: 'OpenAPI', href: '/docs' },
];

function GuideCard({ section }: { section: CmsPageSection }) {
  const badge = section.kind === 'api' ? 'API & SDK' : 'Use case guide';
  return (
    <article className="mkt-plain-card mkt-guide-card">
      <p className="mkt-guide-badge">{badge}</p>
      {section.media?.imageUrl || section.media?.videoUrl ? (
        <div className="mkt-page-section-media">
          {section.media.videoUrl ? (
            <video src={section.media.videoUrl} controls playsInline />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={section.media.imageUrl} alt={section.media.alt ?? section.title} />
          )}
        </div>
      ) : null}
      <h3>{section.title}</h3>
      <p>{section.body}</p>
      {section.steps && section.steps.length > 0 ? (
        <ol className="mkt-guide-steps">
          {section.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      ) : null}
      {section.links && section.links.length > 0 ? (
        <div className="mkt-guide-card-links">
          {section.links.map((link) => (
            <Link key={`${link.href}-${link.label}`} href={link.href} className="mkt-inline-doc">
              {link.label}
            </Link>
          ))}
        </div>
      ) : null}
    </article>
  );
}

/** Per-product use-case / demo / API / SDK guide strip for CMS marketing pages. */
export function ProductGuideKit({ page }: { page: CmsPage }) {
  const guideSections = (page.sections ?? []).filter((s) => s.kind === 'guide' || s.kind === 'api');
  const linksFromSections = guideSections.flatMap((s) => s.links ?? []);
  const links = linksFromSections.length > 0 ? dedupeLinks(linksFromSections) : DEFAULT_LINKS;

  return (
    <div className="mkt-product-guide">
      <h2>Use cases, demos &amp; developer kit</h2>
      <p className="mkt-product-guide-lede">
        How teams ship with {page.title}: interactive demos above, step guides below, and the same{' '}
        <code>/v1</code> surface for APIs and SDKs.
      </p>

      {guideSections.length > 0 ? (
        <div className="mkt-feature-grid mkt-guide-grid">
          {guideSections.map((section) => (
            <GuideCard key={section.id} section={section} />
          ))}
        </div>
      ) : null}

      <div className="mkt-guide-cta-row">
        {links.map((link) => (
          <Link key={`${link.href}-${link.label}`} href={link.href} className="vl-btn vl-btn-secondary">
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function dedupeLinks(links: { label: string; href: string }[]) {
  const seen = new Set<string>();
  return links.filter((l) => {
    const key = `${l.href}::${l.label}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
