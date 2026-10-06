import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AnamorphicPanel } from '@/components/media/anamorphic-panel';
import { MarketingFooter } from '@/components/marketing/marketing-footer';
import { MarketingNav } from '@/components/marketing/nav';
import '@/components/marketing/marketing.css';
import { getCmsDocument, getCmsPage } from '@/lib/cms';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getCmsPage(slug);
  if (!page) return { title: 'Lugemi' };
  return {
    title: `${page.title} · Lugemi`,
    description: page.lead,
  };
}

export default async function CmsMarketingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [doc, page] = await Promise.all([getCmsDocument(), getCmsPage(slug)]);
  if (!page) notFound();

  return (
    <div className="mkt">
      <a className="mkt-skip" href="#main">
        Skip to content
      </a>
      <MarketingNav nav={doc.nav} />
      <main id="main">
        <section className="mkt-hero mkt-page-hero" aria-labelledby="mkt-page-title">
          <div className="mkt-wrap mkt-page-hero-grid">
            <div className="mkt-hero-copy">
              {page.eyebrow ? <p className="mkt-eyebrow">{page.eyebrow}</p> : null}
              <h1 id="mkt-page-title">
                <span className="mkt-brand-hero">{doc.brand.name}</span>
                <span className="mkt-tagline">{page.title}</span>
              </h1>
              <p className="mkt-hero-lead">{page.lead}</p>
              <div className="mkt-cta-row">
                {page.primaryCta ? (
                  <Link href={page.primaryCta.href} className="vl-btn vl-btn-primary">
                    {page.primaryCta.label}
                  </Link>
                ) : null}
                {page.secondaryCta ? (
                  <Link href={page.secondaryCta.href} className="vl-btn vl-btn-secondary">
                    {page.secondaryCta.label}
                  </Link>
                ) : null}
              </div>
            </div>
            <AnamorphicPanel
              variant="hub"
              size="lg"
              label={page.title}
              imageUrl={page.media?.imageUrl}
              videoUrl={page.media?.videoUrl}
            />
          </div>
        </section>

        <section className="mkt-section">
          <div className="mkt-wrap">
            <p className="mkt-lede" style={{ maxWidth: '46rem' }}>
              {page.body}
            </p>
            {page.sections && page.sections.length > 0 ? (
              <div className="mkt-feature-grid" style={{ marginTop: '2.5rem' }}>
                {page.sections.map((section) => (
                  <article key={section.id} className="mkt-plain-card">
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
                  </article>
                ))}
              </div>
            ) : null}
          </div>
        </section>

        <section className="mkt-banner" aria-labelledby="mkt-page-banner">
          <div className="mkt-wrap mkt-banner-inner">
            <h2 id="mkt-page-banner">{doc.banner.title}</h2>
            <p>{doc.banner.body}</p>
            <div className="mkt-cta-row">
              <Link href={doc.banner.primaryCta.href} className="vl-btn mkt-btn-banner">
                {doc.banner.primaryCta.label}
              </Link>
              <Link href={doc.banner.secondaryCta.href} className="vl-btn mkt-btn-banner-ghost">
                {doc.banner.secondaryCta.label}
              </Link>
            </div>
          </div>
        </section>
      </main>
      <MarketingFooter footer={doc.footer} brand={doc.brand} />
    </div>
  );
}
