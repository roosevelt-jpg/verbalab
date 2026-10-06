'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { API_URL } from '@/lib/api';
import { BrandMark } from '@/components/brand-mark';
import { CodePanel } from '@/components/code-panel';

export default function DocsPage() {
  const [specUrl, setSpecUrl] = useState(`${API_URL}/v1/openapi.json`);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  "text": "Hello",
  "source": "auto",
  "target": "sw"
}`;

  const sdkExample = `import { Lugemi } from '@lugemi/sdk';

const client = new Lugemi({
  apiKey: process.env.LUGEMI_API_KEY!,
  baseUrl: '${API_URL}',
});

await client.translate({ text: 'Hello', source: 'en', target: 'sw' });`;

  const envExample = `# .env
LUGEMI_API_KEY=lg_live_...
LUGEMI_BASE_URL=${API_URL}`;

  return (
    <div className="vl-api-public vl-fade-up">
      <div className="vl-api-public-header">
        <BrandMark href="/" />
        <div className="vl-api-public-links">
          <Link href="/playground">Playground</Link>
          <Link href="/coverage">Coverage</Link>
          <Link href="/developers">Developers</Link>
          <a href={specUrl} className="vl-btn vl-btn-secondary" style={{ textDecoration: 'none', padding: '0.45rem 0.9rem', minHeight: 40 }}>
            openapi.json
          </a>
        </div>
      </div>

      <p className="vl-tag" style={{ margin: '1.5rem 0 0' }}>
        Lugemi API
      </p>
      <h1 style={{ margin: '0.65rem 0 0', fontFamily: 'var(--font-display)', letterSpacing: '-0.03em', fontSize: '2.35rem', color: 'var(--brand-navy)' }}>
        Build speaking agents with the Lugemi API
      </h1>
      <p style={{ color: 'var(--muted)', lineHeight: 1.65, maxWidth: '40rem' }}>
        First-party language intelligence for developers: generate speech, transcribe, translate, and simulate voice
        agents across languages and accents with cultural context. Africa-first completeness; LATAM, Southeast Asia,
        the Middle East, and the EU in scope. Authenticate with{' '}
        <code className="vl-code">Authorization: Bearer lg_live_...</code> or soft-sandbox{' '}
        <code className="vl-code">lg_test_...</code>. OpenAPI at <code className="vl-code">/v1/openapi.json</code>.
      </p>

      <div className="vl-endpoint-card" style={{ marginTop: '1.5rem' }}>
        <div style={{ marginBottom: '0.65rem' }}>
          <span className="vl-endpoint-method">POST</span>
          <span className="vl-endpoint-path">/v1/translate</span>
        </div>
        <p style={{ color: 'var(--muted)', lineHeight: 1.55, margin: '0 0 1rem' }}>
          Translate text between registry languages via the Lugemi API. Use{' '}
          <code className="vl-code">source: &quot;auto&quot;</code> to detect first. Returns translated text, provider
          id, character count, and optional <code className="vl-code">detection</code>.
        </p>
        <CodePanel code={translateExample} label="Request body" />
      </div>

      <div style={{ display: 'grid', gap: '0.75rem', marginTop: '1.25rem' }}>
        <Endpoint
          method="GET/POST"
          title="/v1/prompts…"
          body="Versioned chat/RAG/voice_faq system prompts with rollback (ADR-0030). Console /prompts."
        />
        <Endpoint method="GET" title="/v1/analytics/overview" body="SQL aggregates for the current org (Clerk or API key; ?from=&to=)." />
        <Endpoint method="POST" title="/v1/voice/simulate" body="Text or audio FAQ turn (API key or Clerk)." />
        <Endpoint method="POST" title="/v1/voice/twilio/inbound|turn" body="Signed Twilio webhooks → TwiML." />
        <Endpoint method="GET/POST" title="/v1/voice-clones" body="List / create clones (Clerk; Pro + consent for create)." />
        <Endpoint method="GET" title="/v1/voice-clones/{id}" body="Get clone profile." />
        <Endpoint method="POST" title="/v1/voice-clones/{id}/review" body="Approve/reject pending_review (clone pipeline or fixture)." />
        <Endpoint method="POST" title="/v1/voice-clones/{id}/disable" body="Disable clone for abuse/policy." />
        <Endpoint
          method="POST"
          title="/v1/audio/speech"
          body="Generate speech. Intended production: own:* via OWN_TTS_URL. Also stock catalog or voice=clone:{id} (watermark)."
        />
        <Endpoint method="GET/POST" title="/v1/workflows" body="List/create saved workflow definitions (Clerk)." />
        <Endpoint method="POST" title="/v1/workflows/{id}/run" body="Enqueue workflow job from saved definition (API key)." />
        <Endpoint method="POST" title="/v1/connectors/slack/commands" body="Slack slash command (signed)." />
        <Endpoint method="POST" title="/v1/connectors/slack/events" body="Slack Events url_verification." />
        <Endpoint method="GET" title="/v1/organization/members" body="List org members (Clerk session)." />
        <Endpoint method="GET" title="/v1/admin/organizations" body="Search orgs (platform admin allowlist)." />
        <Endpoint
          method="GET/PATCH"
          title="/v1/organization/data-settings"
          body="Org data settings (Clerk; owners/admins for PATCH)."
        />
        <Endpoint method="POST" title="/v1/organization/export" body="JSON export of current workspace data (Clerk)." />
        <Endpoint method="DELETE" title="/v1/organization" body="Delete org + cascade (owner; confirmName)." />
        <Endpoint method="GET" title="/v1/metrics/translate" body="In-process translate latency p50/p95/p99 (observability)." />
        <Endpoint
          method="POST"
          title="/v1/translate"
          body="Per-key and per-org Redis rate limits (429 + Retry-After). Monthly character quota remains 402."
        />
        <Endpoint method="POST" title="/v1/knowledge/documents" body="Upload DOCX/PDF/TXT into the workspace knowledge base (embed)." />
        <Endpoint method="POST" title="/v1/knowledge/query" body="Ask the knowledge base; returns answer + citations (RAG)." />
        <Endpoint
          method="POST"
          title="/v1/embeddings"
          body="Create text embeddings (request shape compatible with common embedding APIs; used by RAG)."
        />
        <Endpoint method="POST" title="/v1/interpret" body="Live interpreter: audio → STT → MT → TTS (JSON + audioBase64)." />
        <Endpoint method="POST" title="/v1/chat/completions" body="Language-intelligence chat (optional translateReplyTo)." />
        <Endpoint method="POST" title="/v1/detect" body="Detect source language (Lugemi detect pipeline with offline fallback)." />
        <Endpoint method="GET" title="/v1/languages" body="List seeded language codes, names, and tiers." />
        <Endpoint method="GET/POST" title="/v1/glossary/terms" body="Workspace terminology (Clerk); applied on translate." />
        <Endpoint method="GET/POST" title="/v1/tm/entries" body="Approved translation memory; exact match bypasses MT." />
        <Endpoint method="GET" title="/v1/reviews" body="Quality reviews; accept/reject (accept can upsert TM)." />
        <Endpoint method="POST" title="/v1/localize" body="Translate JSON/YAML i18n trees (ICU passthrough)." />
        <Endpoint method="POST" title="/v1/ocr" body="Image OCR (optional source/target to translate)." />
        <Endpoint method="POST" title="/v1/audio/transcriptions" body="Speech-to-text (multipart audio; usage in minutes)." />
        <Endpoint method="POST" title="/v1/documents/translate" body="Upload DOCX/PDF; returns a document_translate job." />
        <Endpoint method="POST" title="/v1/jobs" body="Enqueue batch_translate, document_translate, or workflow (API key)." />
        <Endpoint method="GET" title="/v1/jobs/{id}" body="Poll job status and result." />
        <Endpoint method="GET" title="/v1/audit-events" body="Org audit trail (Clerk session; owners/admins)." />
        <Endpoint method="GET" title="/v1/openapi.json" body="This OpenAPI 3.1 document." />
        <Endpoint method="POST" title="/v1/api-keys" body="Create a key (Clerk session). Secret returned once." />
        <Endpoint method="GET" title="/v1/usage/summary" body="Month-to-date characters and request counts." />
      </div>

      <div className="vl-endpoint-card" style={{ marginTop: '1.5rem' }}>
        <h2 style={{ marginTop: 0, fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--brand-navy)' }}>
          TypeScript SDK
        </h2>
        <CodePanel code={sdkExample} label="TypeScript" />
      </div>

      <div className="vl-endpoint-card" style={{ marginTop: '1rem' }}>
        <h2 style={{ marginTop: 0, fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--brand-navy)' }}>
          Quickstart
        </h2>
        <ol style={{ color: 'var(--muted)', lineHeight: 1.7, paddingLeft: '1.2rem' }}>
          <li>Create an API key in the console.</li>
          <li>Copy the secret (shown once).</li>
          <li>Call the Lugemi API (translate, transcribe, or generate speech) or use the playground.</li>
        </ol>
        <CodePanel code={envExample} label="Environment" />
        {error ? (
          <p style={{ color: 'var(--bad)', marginBottom: 0 }}>Could not reach OpenAPI ({error}). Is the API running?</p>
        ) : (
          <p style={{ color: 'var(--ok)', marginBottom: 0 }}>
            {loaded ? 'OpenAPI reachable.' : 'Checking OpenAPI…'}
          </p>
        )}
      </div>
    </div>
  );
}

function Endpoint({ method, title, body }: { method: string; title: string; body: string }) {
  return (
    <div className="vl-endpoint-card">
      <div style={{ marginBottom: '0.4rem' }}>
        <span className="vl-endpoint-method">{method}</span>
        <span className="vl-endpoint-path">{title}</span>
      </div>
      <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.5 }}>{body}</p>
    </div>
  );
}
