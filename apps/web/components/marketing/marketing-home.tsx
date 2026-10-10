import Link from 'next/link';
import { AnamorphicPanel } from '@/components/media/anamorphic-panel';
import { AnamorphicCanopyCanvas } from '@/components/media/anamorphic-canopy-canvas';
import type { CmsDocument } from '@/data/cms-types';
import { AgentChatDemo } from './agent-chat-demo';
import { HeroTtsCard } from './hero-tts-card';
import { LanguageBar } from './language-bar';
import { MarketingFooter } from './marketing-footer';
import { MarketingNav } from './nav';
import { StudioSampleDemo } from './studio-sample-demo';
import { TranslatePlayDemo } from './translate-play-demo';
import { VoiceChipRow } from './voice-chip-row';
import './marketing.css';

export function MarketingHome({ content }: { content: CmsDocument }) {
  const {
    hero,
    products,
    useCases,
    hubs,
    creative,
    agents,
    api,
    impact,
    research,
    safety,
    updates,
    banner,
    footer,
    brand,
    nav,
  } = content;

  return (
    <div className="mkt">
      <a className="mkt-skip" href="#main">
        Skip to content
      </a>
      <MarketingNav nav={nav} />
      <main id="main">
        <section className="mkt-hero" aria-labelledby="mkt-hero-title">
          <div className="mkt-hero-anamorphic-bg" aria-hidden="true">
            <AnamorphicCanopyCanvas className="mkt-hero-anamorphic-canvas" intensity={1.1} />
          </div>
          {hero.media?.videoUrl || hero.media?.imageUrl ? (
            <div className="mkt-hero-media" aria-hidden="true">
              {hero.media.videoUrl ? (
                <video src={hero.media.videoUrl} autoPlay muted loop playsInline />
              ) : (
                <img src={hero.media.imageUrl} alt="" />
              )}
            </div>
          ) : null}
          <div className="mkt-wrap mkt-hero-grid">
            <div className="mkt-hero-copy">
              <p className="mkt-eyebrow">{hero.eyebrow}</p>
              <h1 id="mkt-hero-title">
                <span className="mkt-brand-hero">{hero.brand}</span>
                <span className="mkt-tagline">{hero.headline}</span>
              </h1>
              <p className="mkt-hero-lead">{hero.lead}</p>
              <div className="mkt-cta-row">
                <Link href={hero.primaryCta.href} className="vl-btn vl-btn-primary">
                  {hero.primaryCta.label}
                </Link>
                <Link href={hero.secondaryCta.href} className="vl-btn vl-btn-secondary">
                  {hero.secondaryCta.label}
                </Link>
              </div>
            </div>
            <HeroTtsCard demo={hero.demo} />
          </div>
        </section>

        <LanguageBar languages={content.languageBar.languages} />

        <section className="mkt-section" id="products" aria-labelledby="mkt-products-title">
          <div className="mkt-wrap">
            <p className="mkt-kicker">{products.kicker}</p>
            <h2 className="mkt-h2" id="mkt-products-title">
              {products.title}
            </h2>
            <p className="mkt-lede">{products.lede}</p>
            <div className="mkt-card-grid-3">
              {products.items.map((product) => (
                <article key={product.id} className="mkt-product-card">
                  <AnamorphicPanel
                    variant={product.art}
                    size="sm"
                    label={product.name}
                    className="mkt-product-media"
                    imageUrl={product.media?.imageUrl}
                    videoUrl={product.media?.videoUrl}
                  />
                  <p className="mkt-product-tag">{product.tag}</p>
                  <h3>{product.name}</h3>
                  <p>{product.body}</p>
                  <Link href={product.href} className="mkt-text-link">
                    Explore →
                  </Link>
                </article>
              ))}
            </div>
            <div className="mkt-inline-demos" style={{ marginTop: '1.75rem' }}>
              <p className="mkt-tts-label">Hear region voices</p>
              <VoiceChipRow
                voices={content.console.sampleVoices.slice(0, 6).map((v) => ({
                  id: v.id,
                  label: v.label,
                  sample: `${v.label}. ${v.ethnicContext}. Lugemi speaking agents use this voice.`,
                }))}
              />
            </div>
          </div>
        </section>

        <section className="mkt-section mkt-section-mist" id="translate-demo" aria-labelledby="mkt-translate-demo-title">
          <div className="mkt-wrap mkt-demo-split">
            <div>
              <p className="mkt-kicker">Try it</p>
              <h2 className="mkt-h2" id="mkt-translate-demo-title">
                Translate and hear it in realtime
              </h2>
              <p className="mkt-lede">
                Pick a language pair, translate, then play the source and the translation — the same path speaking
                agents use in chat turns.
              </p>
            </div>
            <TranslatePlayDemo />
          </div>
        </section>

        <section className="mkt-section mkt-section-mist" id="use-cases" aria-labelledby="mkt-usecases-title">
          <div className="mkt-wrap">
            <p className="mkt-kicker">{useCases.kicker}</p>
            <h2 className="mkt-h2" id="mkt-usecases-title">
              {useCases.title}
            </h2>
            <p className="mkt-lede">{useCases.lede}</p>
            <div className="mkt-usecase-grid">
              {useCases.items.map((item) => (
                <article key={item.title} className={`mkt-usecase mkt-usecase-${item.tone}`}>
                  <AnamorphicPanel
                    variant={item.art}
                    size="sm"
                    label={item.title}
                    className="mkt-usecase-media"
                    imageUrl={item.media?.imageUrl}
                    videoUrl={item.media?.videoUrl}
                  />
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mkt-section" id="hubs" aria-labelledby="mkt-ship-title">
          <div className="mkt-wrap">
            <p className="mkt-kicker">{hubs.kicker}</p>
            <h2 className="mkt-h2" id="mkt-ship-title">
              {hubs.title}
            </h2>
            <p className="mkt-lede">{hubs.lede}</p>
            <div className="mkt-card-grid-3">
              {hubs.items.map((way) => (
                <article key={way.title} className="mkt-ship-card">
                  <h3>{way.title}</h3>
                  <p>{way.body}</p>
                  <ul className="mkt-ship-tags" aria-label={`${way.title} capabilities`}>
                    {way.tags.map((tag) => (
                      <li key={tag}>{tag}</li>
                    ))}
                  </ul>
                  <Link href={way.href} className="mkt-text-link">
                    Open {way.title} →
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mkt-section mkt-section-mist" id="studio" aria-labelledby="mkt-creative-title">
          <div className="mkt-wrap">
            <p className="mkt-kicker">{creative.kicker}</p>
            <h2 className="mkt-h2" id="mkt-creative-title">
              {creative.title}
            </h2>
            <p className="mkt-lede">{creative.lede}</p>

            <div className="mkt-feature-grid">
              {creative.features.map((feature) => (
                <article key={feature.title} className="mkt-plain-card">
                  <h3>{feature.title}</h3>
                  <p>{feature.body}</p>
                </article>
              ))}
            </div>

            <div className="mkt-module">
              <div className="mkt-module-copy">
                <h3>{creative.moduleTitle}</h3>
                <p>{creative.moduleBody}</p>
                <Link href={creative.moduleCta.href} className="vl-btn vl-btn-primary">
                  {creative.moduleCta.label}
                </Link>
              </div>
              <div className="mkt-module-panel">
                {creative.media?.videoUrl || creative.media?.imageUrl ? (
                  <div className="mkt-module-media">
                    {creative.media.videoUrl ? (
                      <video src={creative.media.videoUrl} controls playsInline />
                    ) : (
                      <img src={creative.media.imageUrl} alt={creative.media.alt ?? ''} />
                    )}
                  </div>
                ) : (
                  <StudioSampleDemo sample={creative.studioSample} chips={creative.languageChips} />
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="mkt-section" id="agents" aria-labelledby="mkt-agents-title">
          <div className="mkt-wrap">
            <p className="mkt-kicker">{agents.kicker}</p>
            <h2 className="mkt-h2" id="mkt-agents-title">
              {agents.title}
            </h2>
            <p className="mkt-lede">{agents.lede}</p>

            <div className="mkt-feature-grid">
              {agents.features.map((feature) => (
                <article key={feature.title} className="mkt-plain-card">
                  <h3>{feature.title}</h3>
                  <p>{feature.body}</p>
                </article>
              ))}
            </div>

            <div className="mkt-module mkt-module-reverse">
              <div className="mkt-module-copy">
                <h3>{agents.moduleTitle}</h3>
                <p>{agents.moduleBody}</p>
                <Link href={agents.moduleCta.href} className="vl-btn vl-btn-primary">
                  {agents.moduleCta.label}
                </Link>
              </div>
              <div className="mkt-module-panel">
                {agents.media?.videoUrl || agents.media?.imageUrl ? (
                  <div className="mkt-module-media">
                    {agents.media.videoUrl ? (
                      <video src={agents.media.videoUrl} controls playsInline />
                    ) : (
                      <img src={agents.media.imageUrl} alt={agents.media.alt ?? ''} />
                    )}
                  </div>
                ) : (
                  <AgentChatDemo
                    title={agents.transcriptTitle}
                    userText={agents.transcriptUser}
                    agentText={agents.transcriptAgent}
                  />
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="mkt-section mkt-section-mist" id="api" aria-labelledby="mkt-api-title">
          <div className="mkt-wrap mkt-api-split">
            <div>
              <p className="mkt-kicker">{api.kicker}</p>
              <h2 className="mkt-h2" id="mkt-api-title">
                {api.title}
              </h2>
              <p className="mkt-lede">{api.lede}</p>
              <div className="mkt-api-tabs" role="tablist" aria-label="API surfaces">
                {api.tabs.map((tab) => (
                  <Link key={tab.label} href={tab.href} className="mkt-api-tab" role="tab">
                    {tab.label}
                  </Link>
                ))}
              </div>
              <div className="mkt-inline-links">
                <Link href={api.primaryCta.href} className="vl-btn vl-btn-primary">
                  {api.primaryCta.label}
                </Link>
                <Link href={api.secondaryCta.href} className="vl-btn vl-btn-secondary">
                  {api.secondaryCta.label}
                </Link>
              </div>
            </div>
            <pre className="mkt-code" tabIndex={0}>
              {api.snippet}
            </pre>
          </div>
        </section>

        <section className="mkt-section" id="impact" aria-labelledby="mkt-impact-title">
          <div className="mkt-wrap">
            <p className="mkt-kicker">{impact.kicker}</p>
            <h2 className="mkt-h2" id="mkt-impact-title">
              {impact.title}
            </h2>
            <div className="mkt-card-grid-3">
              {impact.items.map((item) => (
                <article key={item.title} className="mkt-plain-card">
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mkt-section mkt-section-mist" id="research" aria-labelledby="mkt-research-title">
          <div className="mkt-wrap">
            <p className="mkt-kicker">{research.kicker}</p>
            <h2 className="mkt-h2" id="mkt-research-title">
              {research.title}
            </h2>
            <p className="mkt-lede">{research.lede}</p>
            <ol className="mkt-timeline">
              {research.items.map((item) => (
                <li key={item.year}>
                  <span className="mkt-timeline-year">{item.year}</span>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </li>
              ))}
            </ol>
            <div className="mkt-inline-links">
              <Link href={research.cta.href} className="vl-btn vl-btn-primary">
                {research.cta.label}
              </Link>
            </div>
          </div>
        </section>

        <section className="mkt-section" id="safety" aria-labelledby="mkt-safety-title">
          <div className="mkt-wrap">
            <p className="mkt-kicker">{safety.kicker}</p>
            <h2 className="mkt-h2" id="mkt-safety-title">
              {safety.title}
            </h2>
            <p className="mkt-lede">{safety.lede}</p>
            <div className="mkt-card-grid-4">
              {safety.items.map((item) => (
                <article key={item.title} className="mkt-plain-card">
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mkt-section mkt-section-mist" id="updates" aria-labelledby="mkt-updates-title">
          <div className="mkt-wrap">
            <p className="mkt-kicker">{updates.kicker}</p>
            <h2 className="mkt-h2" id="mkt-updates-title">
              {updates.title}
            </h2>
            <div className="mkt-card-grid-3">
              {updates.items.map((item) => (
                <article key={item.title} className="mkt-plain-card">
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mkt-banner" aria-labelledby="mkt-banner-title">
          <div className="mkt-wrap mkt-banner-inner">
            <h2 id="mkt-banner-title">{banner.title}</h2>
            <p>{banner.body}</p>
            <div className="mkt-cta-row">
              <Link href={banner.primaryCta.href} className="vl-btn mkt-btn-banner">
                {banner.primaryCta.label}
              </Link>
              <Link href={banner.secondaryCta.href} className="vl-btn mkt-btn-banner-ghost">
                {banner.secondaryCta.label}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter footer={footer} brand={brand} />
    </div>
  );
}
