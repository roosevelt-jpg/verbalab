'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { API_URL } from '@/lib/api';
import { BrandMark } from '@/components/brand-mark';
import { CodePanel } from '@/components/code-panel';
import {
  DOCS_CAPABILITIES,
  DOCS_CATEGORIES,
  DOCS_MODELS,
  DOCS_PATHS,
} from './docs-catalog';
import './docs.css';

function apiRefHash(method: string, path: string): string {
  const primary = method.toLowerCase().includes('get')
    ? 'get'
    : method.toLowerCase().includes('delete')
      ? 'delete'
      : method.toLowerCase().includes('put')
        ? 'put'
        : method.toLowerCase().includes('patch')
          ? 'patch'
          : 'post';
  return `${primary} ${path}`;
}

export default function DocsPage() {
  const [specUrl, setSpecUrl] = useState(`${API_URL}/v1/openapi.json`);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>('intro');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [endpointCount, setEndpointCount] = useState<number | null>(null);

  useEffect(() => {
    setSpecUrl(`${API_URL}/v1/openapi.json`);
    void fetch(`${API_URL}/v1/openapi.json`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`OpenAPI HTTP ${res.status}`);
        const doc = (await res.json()) as { paths?: Record<string, unknown> };
        const paths = doc.paths ? Object.keys(doc.paths).length : 0;
        let ops = 0;
        for (const item of Object.values(doc.paths ?? {})) {
          if (item && typeof item === 'object') {
            ops += Object.keys(item).filter((k) =>
              ['get', 'post', 'put', 'patch', 'delete'].includes(k),
            ).length;
          }
        }
        setEndpointCount(ops || paths);
        setLoaded(true);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  const translateExample = `{
  "text": "Welcome to Lugemi",
  "source": "en",
  "target": "ak"
}`;

  const speechExample = `{
  "text": "Mema wo akye. Akwaaba ba Lugemi.",
  "voice": "own:en-gh-female",
  "language": "en-GH",
  "format": "mp3"
}`;

  const sdkExample = `import { Lugemi } from '@lugemi/sdk';

const client = new Lugemi({
  apiKey: process.env.LUGEMI_API_KEY!,
  baseUrl: '${API_URL}',
});

const mt = await client.translate({
  text: 'Welcome to Lugemi Language Intelligence',
  source: 'en',
  target: 'ak',
});

const speech = await client.speech.synthesize({
  text: mt.text,
  voice: 'own:en-gh-female',
  language: 'ak',
});`;

  const envExample = `# .env
LUGEMI_API_KEY=lg_live_...
LUGEMI_BASE_URL=${API_URL}`;

  function navTo(id: string) {
    setActiveSection(id);
    setMobileMenuOpen(false);
  }

  return (
    <div className="docs-shell">
      <header className="docs-header">
        <div className="docs-header-left">
          <button
            type="button"
            className="docs-mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            Menu
          </button>
          <BrandMark href="/" />
        </div>

        <nav className="docs-header-links" aria-label="Documentation navigation">
          <Link href="/docs/api" className="vl-btn vl-btn-primary" style={{ padding: '0.4rem 0.85rem' }}>
            Full API reference
          </Link>
          <Link href="/playground">Playground</Link>
          <Link href="/models">Models</Link>
          <Link href="/docs/mcp">MCP</Link>
          <Link href="/docs/connectors">Connectors</Link>
          <Link href="/developers">Developers</Link>
          <a
            href={`${API_URL}/docs`}
            target="_blank"
            rel="noopener noreferrer"
            className="vl-btn vl-btn-secondary"
            style={{ padding: '0.4rem 0.85rem' }}
          >
            OpenAPI UI
          </a>
        </nav>
      </header>

      <div className="docs-layout">
        <aside className={`docs-sidebar ${mobileMenuOpen ? 'is-open' : ''}`} aria-label="Documentation Sidebar">
          <div className="docs-nav-group">
            <h3 className="docs-nav-group-title">Overview</h3>
            <ul className="docs-nav-list">
              {(
                [
                  ['intro', 'Introduction'],
                  ['how-it-works', 'How Lugemi works'],
                  ['paths', 'Choose your path'],
                  ['models', 'Meet the models'],
                  ['capabilities', 'Browse by capability'],
                  ['authentication', 'Authentication'],
                  ['sdk-quickstart', 'TypeScript SDK'],
                ] as const
              ).map(([id, label]) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    className={`docs-nav-link ${activeSection === id ? 'is-active' : ''}`}
                    onClick={() => navTo(id)}
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="docs-nav-group">
            <h3 className="docs-nav-group-title">API surfaces</h3>
            <ul className="docs-nav-list">
              {DOCS_CATEGORIES.map((cat) => (
                <li key={cat.id}>
                  <a
                    href={`#${cat.id}`}
                    className={`docs-nav-link ${activeSection === cat.id ? 'is-active' : ''}`}
                    onClick={() => navTo(cat.id)}
                  >
                    <span>{cat.title}</span>
                    <span className="docs-nav-badge">{cat.items.length}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="docs-nav-group">
            <h3 className="docs-nav-group-title">Developer guides</h3>
            <ul className="docs-nav-list">
              <li>
                <Link href="/docs/api" className="docs-nav-link">
                  Interactive API reference
                </Link>
              </li>
              <li>
                <Link href="/docs/connectors" className="docs-nav-link">
                  Connectors
                </Link>
              </li>
              <li>
                <Link href="/docs/mcp" className="docs-nav-link">
                  MCP
                </Link>
              </li>
              <li>
                <Link href="/keys" className="docs-nav-link">
                  API keys
                </Link>
              </li>
              <li>
                <Link href="/coverage" className="docs-nav-link">
                  Language coverage
                </Link>
              </li>
              <li>
                <Link href="/models" className="docs-nav-link">
                  Live models
                </Link>
              </li>
            </ul>
          </div>
        </aside>

        <main className="docs-main">
          <section id="intro" className="docs-hero">
            <p className="vl-tag">Lugemi documentation</p>
            <h1 className="docs-title">Language intelligence for speaking agents</h1>
            <p className="docs-lead">
              Lugemi is first-party voice, speech, and translation infrastructure — Echo neural speech, Baobab
              dialect-aware MT, Atlas reasoning, and a complete OpenAPI surface for Africa-first and global corridors.
              {endpointCount != null ? (
                <>
                  {' '}
                  Live spec exposes <strong>{endpointCount.toLocaleString()}</strong> operations.
                </>
              ) : null}
            </p>

            <div className="docs-quick-actions">
              <Link href="/docs/api" className="vl-btn vl-btn-primary">
                Explore full API reference →
              </Link>
              <a href={`${API_URL}/docs`} target="_blank" rel="noopener noreferrer" className="vl-btn vl-btn-secondary">
                OpenAPI interactive docs
              </a>
              <a href={specUrl} download="lugemi-openapi.json" className="vl-btn vl-btn-secondary">
                Download openapi.json
              </a>
            </div>
          </section>

          <section id="how-it-works" className="docs-section">
            <h2 className="docs-section-title">How Lugemi works</h2>
            <p className="docs-section-desc">
              Lugemi provides AI language infrastructure: text-to-speech, speech-to-text, translation, voice cloning,
              conversational agents, and governance. Use it in four ways, suited to different audiences.
            </p>
            <div className="docs-concept-grid">
              <article className="docs-concept">
                <h3>Voices</h3>
                <p>
                  Speech personas as <code className="vl-code">own:*</code> IDs (for example{' '}
                  <code className="vl-code">own:en-gh-female</code>) or <code className="vl-code">clone:&#123;id&#125;</code>.
                  Accent Identity packs bind country, culture, and lifestyle to Echo voices.
                </p>
              </article>
              <article className="docs-concept">
                <h3>Models</h3>
                <p>
                  Echo Voice / Echo Listen, Baobab Translate, Atlas Reason, and Vector embeddings control quality,
                  latency, and language coverage. See the live matrix at <Link href="/models">/models</Link>.
                </p>
              </article>
              <article className="docs-concept">
                <h3>Usage</h3>
                <p>
                  Metered characters (TTS/MT), tokens (chat), and STT minutes against workspace plans. Create{' '}
                  <code className="vl-code">lg_live_</code> or <code className="vl-code">lg_test_</code> keys in{' '}
                  <Link href="/keys">/keys</Link>.
                </p>
              </article>
            </div>
          </section>

          <section id="paths" className="docs-section">
            <h2 className="docs-section-title">Choose your path</h2>
            <p className="docs-section-desc">Pick the surface that matches how you ship.</p>
            <div className="docs-path-grid">
              {DOCS_PATHS.map((path) => (
                <article key={path.id} className="docs-path-card">
                  <h3>{path.title}</h3>
                  <p>{path.body}</p>
                  <Link href={path.href} className="docs-card-link">
                    {path.cta} →
                  </Link>
                </article>
              ))}
            </div>
          </section>

          <section id="models" className="docs-section">
            <h2 className="docs-section-title">Meet the models</h2>
            <p className="docs-section-desc">
              First-party Lugemi models — not reseller wrappers. Availability follows{' '}
              <code className="vl-code">GET /v1/models/live</code>.
            </p>
            <div className="docs-model-grid">
              {DOCS_MODELS.map((model) => (
                <article key={model.id} className="docs-model-card">
                  <p className="docs-model-family">{model.family}</p>
                  <h3>{model.name}</h3>
                  <p className="docs-model-blurb">{model.blurb}</p>
                  <ul>
                    {model.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                  <Link href={model.href} className="docs-card-link">
                    Explore →
                  </Link>
                </article>
              ))}
            </div>
            <p style={{ marginTop: '1rem' }}>
              <Link href="/models" className="docs-card-link">
                View live model matrix →
              </Link>
            </p>
          </section>

          <section id="capabilities" className="docs-section">
            <h2 className="docs-section-title">Browse by capability</h2>
            <p className="docs-section-desc">
              Everything we support end-to-end — speech, translate, agents, studio, connectors, and enterprise
              governance.
            </p>
            <div className="docs-capability-grid">
              {DOCS_CAPABILITIES.map((cap) => (
                <Link key={cap.id} href={cap.href} className="docs-capability-card">
                  <h3>{cap.title}</h3>
                  <p>{cap.body}</p>
                  {cap.apiPath ? <code className="docs-capability-api">{cap.apiPath}</code> : null}
                </Link>
              ))}
            </div>
          </section>

          <section id="authentication" className="docs-section">
            <h2 className="docs-section-title">Authentication</h2>
            <div className="docs-auth-banner">
              <div className="docs-auth-banner-text">
                <strong>Bearer keys:</strong>{' '}
                <code className="vl-code">Authorization: Bearer lg_live_…</code> for production or{' '}
                <code className="vl-code">lg_test_…</code> for soft sandbox. Console browsing uses Clerk; machine keys
                identify Playground and Studio Bearer traffic.
              </div>
              <Link href="/keys" className="vl-btn vl-btn-primary" style={{ padding: '0.4rem 0.85rem' }}>
                Create API key
              </Link>
            </div>

            <div className="docs-auth-examples">
              <div className="vl-endpoint-card">
                <div className="docs-card-header">
                  <span className="vl-endpoint-method">POST</span>
                  <span className="vl-endpoint-path">/v1/translate</span>
                </div>
                <p className="docs-card-body">
                  Baobab dialect-aware MT. Use <code className="vl-code">source: &quot;auto&quot;</code> or explicit
                  registry codes such as <code className="vl-code">ak</code>, <code className="vl-code">sw</code>,{' '}
                  <code className="vl-code">yo</code>.
                </p>
                <CodePanel code={translateExample} label="Translate request" />
              </div>
              <div className="vl-endpoint-card">
                <div className="docs-card-header">
                  <span className="vl-endpoint-method">POST</span>
                  <span className="vl-endpoint-path">/v1/tts/synthesize</span>
                </div>
                <p className="docs-card-body">
                  Echo neural speech. Prefer authenticated Studio calls so Kokoro/Piper weights serve when{' '}
                  <code className="vl-code">OWN_TTS_URL</code> is live.
                </p>
                <CodePanel code={speechExample} label="Speech request" />
              </div>
            </div>
          </section>

          {DOCS_CATEGORIES.map((cat) => (
            <section key={cat.id} id={cat.id} className="docs-section">
              <h2 className="docs-section-title">{cat.title}</h2>
              <p className="docs-section-desc">{cat.tagline}</p>
              <div className="docs-grid">
                {cat.items.map((item) => (
                  <article key={`${item.method}-${item.path}`} className="docs-card">
                    <div className="docs-card-header">
                      <span className="vl-endpoint-method">{item.method}</span>
                      <span className="vl-endpoint-path">{item.path}</span>
                    </div>
                    <h3 style={{ fontSize: '1rem', margin: '0 0 0.35rem', color: 'var(--brand-navy)' }}>
                      {item.summary}
                    </h3>
                    <p className="docs-card-body">{item.description}</p>
                    <Link
                      href={`/docs/api#${encodeURIComponent(apiRefHash(item.method, item.path))}`}
                      className="docs-card-link"
                    >
                      View in API reference →
                    </Link>
                  </article>
                ))}
              </div>
            </section>
          ))}

          <section id="sdk-quickstart" className="docs-section">
            <h2 className="docs-section-title">TypeScript SDK quickstart</h2>
            <p className="docs-section-desc">
              Ship with <code className="vl-code">@lugemi/sdk</code> — translate, speech, and chat against the same
              first-party endpoints.
            </p>
            <div className="vl-endpoint-card" style={{ marginBottom: '1.25rem' }}>
              <CodePanel code={sdkExample} label="TypeScript example" />
            </div>
            <div className="vl-endpoint-card">
              <h3 style={{ margin: '0 0 0.75rem', fontSize: '1.1rem', color: 'var(--brand-navy)' }}>
                Configuration
              </h3>
              <CodePanel code={envExample} label=".env" />
              <p
                style={{
                  marginTop: '0.85rem',
                  color: loaded ? 'var(--ok)' : error ? 'var(--bad)' : 'var(--muted)',
                }}
              >
                {loaded
                  ? `OpenAPI live${endpointCount != null ? ` · ${endpointCount.toLocaleString()} operations` : ''}.`
                  : error
                    ? `OpenAPI check: ${error}`
                    : 'Verifying OpenAPI…'}
              </p>
              <p style={{ marginTop: '0.75rem' }}>
                Every tagged operation also appears in the{' '}
                <Link href="/docs/api" className="docs-card-link">
                  interactive API reference
                </Link>{' '}
                (searchable by path, method, and OpenAPI tag) and in Swagger at{' '}
                <a href={`${API_URL}/docs`} target="_blank" rel="noopener noreferrer">
                  {API_URL}/docs
                </a>
                .
              </p>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
