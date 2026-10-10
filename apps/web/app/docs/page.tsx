'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { API_URL } from '@/lib/api';
import { BrandMark } from '@/components/brand-mark';
import { CodePanel } from '@/components/code-panel';
import './docs.css';

interface EndpointItem {
  method: string;
  path: string;
  summary: string;
  description: string;
}

interface EndpointCategory {
  id: string;
  title: string;
  tagline: string;
  items: EndpointItem[];
}

const CATEGORIES: EndpointCategory[] = [
  {
    id: 'speech-audio',
    title: 'Voice & Audio',
    tagline: 'First-party neural speech synthesis, transcription, accents, and voice cloning.',
    items: [
      {
        method: 'POST',
        path: '/v1/audio/speech',
        summary: 'Generate speech synthesis',
        description:
          'First-party Lugemi speech synthesis via own:* models, stock regional catalog, or authorized workspace voice clones.',
      },
      {
        method: 'POST',
        path: '/v1/audio/transcriptions',
        summary: 'Speech-to-text transcription',
        description:
          'Multipart audio transcription with word-level timestamps, dialect detection, and usage metered in minutes.',
      },
      {
        method: 'POST',
        path: '/v1/voice/simulate',
        summary: 'Voice FAQ simulator',
        description: 'Multi-turn interactive simulation with voice response turns, sentiment, and confidence scoring.',
      },
      {
        method: 'POST',
        path: '/v1/interpret',
        summary: 'Live real-time interpreter',
        description: 'End-to-end speech cascade: Audio In -> STT -> Machine Translation -> Neural TTS -> Audio Out.',
      },
      {
        method: 'GET / POST',
        path: '/v1/voice-clones',
        summary: 'Voice clone management',
        description:
          'List and create authorized voice profiles with cryptographic watermark headers and verified consent attestations.',
      },
    ],
  },
  {
    id: 'translation',
    title: 'Translation & Localization',
    tagline: 'Cultural, dialect-aware machine translation and structured content localization.',
    items: [
      {
        method: 'POST',
        path: '/v1/translate',
        summary: 'Dialect-aware translation',
        description:
          'Translate text across languages with full African language fidelity (e.g. English <-> Twi, Swahili, Yoruba).',
      },
      {
        method: 'POST',
        path: '/v1/detect',
        summary: 'Language detection',
        description: 'Identify source text dialect, script, and language confidence scores with offline fallback.',
      },
      {
        method: 'POST',
        path: '/v1/localize',
        summary: 'i18n tree localization',
        description:
          'Translate nested JSON/YAML key-value files while strictly preserving ICU syntax and variables.',
      },
      {
        method: 'POST',
        path: '/v1/documents/translate',
        summary: 'Document translation',
        description: 'Upload DOCX or PDF files for async document translation preserving layouts and styles.',
      },
      {
        method: 'GET / POST',
        path: '/v1/glossary/terms',
        summary: 'Terminology glossaries',
        description: 'Workspace-scoped terminology and brand lexicons applied deterministically during translation.',
      },
    ],
  },
  {
    id: 'language-intelligence',
    title: 'Intelligence & Models',
    tagline: 'First-party model registry, RAG knowledge systems, and chat completions.',
    items: [
      {
        method: 'POST',
        path: '/v1/chat/completions',
        summary: 'Language intelligence chat',
        description:
          'Chat completion pipeline tailored for regional languages with optional automatic reply translation.',
      },
      {
        method: 'POST',
        path: '/v1/knowledge/query',
        summary: 'Knowledge base RAG query',
        description: 'Query enterprise documents with grounded neural citations and source paragraph references.',
      },
      {
        method: 'POST',
        path: '/v1/embeddings',
        summary: 'Vector embeddings',
        description: 'Generate high-dimensional semantic embeddings for cross-lingual vector retrieval and matching.',
      },
      {
        method: 'GET',
        path: '/v1/models/live',
        summary: 'Model catalog matrix',
        description: 'Live availability matrix for Baobab, Echo, Atlas, and specialized dialect reasoning models.',
      },
    ],
  },
  {
    id: 'integrity-governance',
    title: 'Integrity & Enterprise Governance',
    tagline: 'Watermark verification, audit trails, and workspace compliance.',
    items: [
      {
        method: 'POST',
        path: '/v1/language-integrity/verify',
        summary: 'Provenance verification',
        description:
          'Verify cryptographic provenance, synthetic media watermarks, and consent attestations for audit compliance.',
      },
      {
        method: 'GET',
        path: '/v1/language-integrity/protocol',
        summary: 'Government adoption protocol',
        description: 'Formal protocol specification for official bilingual filings and synthetic audio compliance.',
      },
      {
        method: 'GET',
        path: '/v1/audit-events',
        summary: 'Audit log stream',
        description: 'Full workspace audit trail including voice clone approvals, API key rotations, and data exports.',
      },
      {
        method: 'GET',
        path: '/v1/usage/summary',
        summary: 'Usage & quota metering',
        description: 'Month-to-date character, token, and STT minute usage against workspace plan limits.',
      },
    ],
  },
];

export default function DocsPage() {
  const [specUrl, setSpecUrl] = useState(`${API_URL}/v1/openapi.json`);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>('getting-started');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setSpecUrl(`${API_URL}/v1/openapi.json`);
    void fetch(`${API_URL}/v1/openapi.json`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`OpenAPI HTTP ${res.status}`);
        await res.json();
        setLoaded(true);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  const translateExample = `{
  "text": "Hello world",
  "source": "auto",
  "target": "ak"
}`;

  const sdkExample = `import { Lugemi } from '@lugemi/sdk';

const client = new Lugemi({
  apiKey: process.env.LUGEMI_API_KEY!,
  baseUrl: '${API_URL}',
});

// Translate English to Akan/Twi
const res = await client.translate({
  text: 'Welcome to Lugemi Language Intelligence',
  source: 'en',
  target: 'ak',
});

console.log(res.text);`;

  const envExample = `#.env
LUGEMI_API_KEY=lg_live_...
LUGEMI_BASE_URL=${API_URL}`;

  return (
    <div className="docs-shell">
      {/* Top Header */}
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
            Interactive API Reference
          </Link>
          <Link href="/playground">Playground</Link>
          <Link href="/models">Models</Link>
          <Link href="/mcp">MCP</Link>
          <Link href="/connectors">Connectors</Link>
          <Link href="/developers">Developers Hub</Link>
          <a
            href={`${API_URL}/docs`}
            target="_blank"
            rel="noopener noreferrer"
            className="vl-btn vl-btn-secondary"
            style={{ padding: '0.4rem 0.85rem' }}
          >
            Swagger / OpenAPI UI
          </a>
        </nav>
      </header>

      {/* Main Grid Layout with Sidebar */}
      <div className="docs-layout">
        <aside className={`docs-sidebar ${mobileMenuOpen ? 'is-open' : ''}`} aria-label="Documentation Sidebar">
          <div className="docs-nav-group">
            <h3 className="docs-nav-group-title">Overview</h3>
            <ul className="docs-nav-list">
              <li>
                <a
                  href="#getting-started"
                  className={`docs-nav-link ${activeSection === 'getting-started' ? 'is-active' : ''}`}
                  onClick={() => {
                    setActiveSection('getting-started');
                    setMobileMenuOpen(false);
                  }}
                >
                  Getting Started
                </a>
              </li>
              <li>
                <a
                  href="#authentication"
                  className={`docs-nav-link ${activeSection === 'authentication' ? 'is-active' : ''}`}
                  onClick={() => {
                    setActiveSection('authentication');
                    setMobileMenuOpen(false);
                  }}
                >
                  Authentication
                </a>
              </li>
              <li>
                <a
                  href="#sdk-quickstart"
                  className={`docs-nav-link ${activeSection === 'sdk-quickstart' ? 'is-active' : ''}`}
                  onClick={() => {
                    setActiveSection('sdk-quickstart');
                    setMobileMenuOpen(false);
                  }}
                >
                  TypeScript SDK
                </a>
              </li>
            </ul>
          </div>

          <div className="docs-nav-group">
            <h3 className="docs-nav-group-title">API Endpoints</h3>
            <ul className="docs-nav-list">
              {CATEGORIES.map((cat) => (
                <li key={cat.id}>
                  <a
                    href={`#${cat.id}`}
                    className={`docs-nav-link ${activeSection === cat.id ? 'is-active' : ''}`}
                    onClick={() => {
                      setActiveSection(cat.id);
                      setMobileMenuOpen(false);
                    }}
                  >
                    <span>{cat.title}</span>
                    <span className="docs-nav-badge">{cat.items.length}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="docs-nav-group">
            <h3 className="docs-nav-group-title">Developer Guides</h3>
            <ul className="docs-nav-list">
              <li>
                <Link href="/docs/connectors" className="docs-nav-link">
                  Connector Guides
                </Link>
              </li>
              <li>
                <Link href="/docs/mcp" className="docs-nav-link">
                  Model Context Protocol (MCP)
                </Link>
              </li>
              <li>
                <Link href="/keys" className="docs-nav-link">
                  Manage API Keys
                </Link>
              </li>
              <li>
                <Link href="/coverage" className="docs-nav-link">
                  Language Coverage
                </Link>
              </li>
            </ul>
          </div>
        </aside>

        {/* Content Area */}
        <main className="docs-main">
          {/* Hero Section */}
          <section id="getting-started" className="docs-hero">
            <p className="vl-tag">Lugemi Language Intelligence API</p>
            <h1 className="docs-title">Build speaking agents with Lugemi</h1>
            <p className="docs-lead">
              First-party language intelligence for developers: synthesize native accents, transcribe, translate, and
              orchestrate speaking AI agents with complete cultural context. Complete African language coverage with
              global multilingual reach across LATAM, Southeast Asia, Middle East, and EU corridors.
            </p>

            <div className="docs-quick-actions">
              <Link href="/docs/api" className="vl-btn vl-btn-primary">
                Explore Full API Reference &rarr;
              </Link>
              <a href={`${API_URL}/docs`} target="_blank" rel="noopener noreferrer" className="vl-btn vl-btn-secondary">
                Live OpenAPI Interactive Docs
              </a>
              <a href={specUrl} download="lugemi-openapi.json" className="vl-btn vl-btn-secondary">
                Download openapi.json
              </a>
            </div>
          </section>

          {/* Authentication & Status */}
          <section id="authentication" className="docs-section">
            <div className="docs-auth-banner">
              <div className="docs-auth-banner-text">
                <strong>Authentication:</strong> All API calls accept Bearer tokens:{' '}
                <code className="vl-code">Authorization: Bearer lg_live_...</code> for production or{' '}
                <code className="vl-code">lg_test_...</code> for sandboxed testing.
              </div>
              <Link href="/keys" className="vl-btn vl-btn-primary" style={{ padding: '0.4rem 0.85rem' }}>
                Create API Key
              </Link>
            </div>

            <div className="vl-endpoint-card">
              <div className="docs-card-header">
                <span className="vl-endpoint-method">POST</span>
                <span className="vl-endpoint-path">/v1/translate</span>
              </div>
              <p className="docs-card-body">
                Translate text between registry languages. English to Akan/Twi (<code className="vl-code">ak-GH</code>)
                or Swahili (<code className="vl-code">sw-KE</code>). Use{' '}
                <code className="vl-code">source: &quot;auto&quot;</code> to detect origin dialect.
              </p>
              <CodePanel code={translateExample} label="Translate Request Body" />
            </div>
          </section>

          {/* Categorized Endpoints */}
          {CATEGORIES.map((cat) => (
            <section key={cat.id} id={cat.id} className="docs-section">
              <h2 className="docs-section-title">{cat.title}</h2>
              <p className="docs-section-desc">{cat.tagline}</p>

              <div className="docs-grid">
                {cat.items.map((item) => (
                  <article key={item.path} className="docs-card">
                    <div className="docs-card-header">
                      <span className="vl-endpoint-method">{item.method}</span>
                      <span className="vl-endpoint-path">{item.path}</span>
                    </div>
                    <h3 style={{ fontSize: '1rem', margin: '0 0 0.35rem', color: 'var(--brand-navy)' }}>
                      {item.summary}
                    </h3>
                    <p className="docs-card-body">{item.description}</p>
                    <Link href={`/docs/api#${encodeURIComponent(item.path)}`} className="docs-card-link">
                      View parameters &amp; responses &rarr;
                    </Link>
                  </article>
                ))}
              </div>
            </section>
          ))}

          {/* SDK Quickstart */}
          <section id="sdk-quickstart" className="docs-section">
            <h2 className="docs-section-title">TypeScript SDK Quickstart</h2>
            <p className="docs-section-desc">
              Get up and running in minutes using the first-party <code className="vl-code">@lugemi/sdk</code>.
            </p>
            <div className="vl-endpoint-card" style={{ marginBottom: '1.25rem' }}>
              <CodePanel code={sdkExample} label="TypeScript Example" />
            </div>
            <div className="vl-endpoint-card">
              <h3 style={{ margin: '0 0 0.75rem', fontSize: '1.1rem', color: 'var(--brand-navy)' }}>
                Configuration &amp; Environment
              </h3>
              <CodePanel code={envExample} label=".env Configuration" />
              <p style={{ marginTop: '0.85rem', color: loaded ? 'var(--ok)' : error ? 'var(--bad)' : 'var(--muted)' }}>
                {loaded
                  ? 'OpenAPI service verified live and responding.'
                  : error
                    ? `Notice: OpenAPI status check (${error}).`
                    : 'Verifying OpenAPI status…'}
              </p>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
