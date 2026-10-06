'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { API_URL } from '@/lib/api';

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

  return (
    <div className="vl-fade-up" style={{ maxWidth: '56rem', margin: '0 auto', padding: '2.25rem 1.5rem 4rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        <Link href="/" style={{ fontFamily: 'var(--font-display)', fontWeight: 760, textDecoration: 'none', fontSize: '1.15rem' }}>
          VerbaLab
        </Link>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Link href="/playground" style={{ color: 'var(--muted)', textDecoration: 'none' }}>
            Playground
          </Link>
          <Link href="/coverage" style={{ color: 'var(--muted)', textDecoration: 'none' }}>
            Coverage
          </Link>
          <a href={specUrl} className="vl-btn vl-btn-secondary" style={{ textDecoration: 'none', padding: '0.45rem 0.9rem' }}>
            openapi.json
          </a>
        </div>
      </div>

      <h1 style={{ margin: '1.75rem 0 0', fontFamily: 'var(--font-display)', letterSpacing: '-0.03em', fontSize: '2.35rem' }}>
        API documentation
      </h1>
      <p style={{ color: 'var(--muted)', lineHeight: 1.65, maxWidth: '38rem' }}>
        Machine-readable OpenAPI for the VerbaLab API (translate, media, jobs, knowledge, and more). Authenticate
        product calls with <code className="vl-code">Authorization: Bearer vl_live_...</code> or soft-sandbox{' '}
        <code className="vl-code">vl_test_...</code>. Hub: <Link href="/developers">/developers</Link>.
      </p>

      <div className="vl-panel" style={{ marginTop: '1.5rem', padding: '1.35rem', background: 'var(--bg-soft)', border: 'none' }}>
        <h2 style={{ marginTop: 0, fontFamily: 'var(--font-display)', fontSize: '1.2rem' }}>POST /v1/translate</h2>
        <p style={{ color: 'var(--muted)', lineHeight: 1.55 }}>
          Translate text between registry languages. Use <code className="vl-code">source: "auto"</code> to detect first.
          Returns translated text, provider id, character count, and optional <code className="vl-code">detection</code>.
        </p>
        <pre className="vl-code" style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{`{
  "text": "Hello",
  "source": "auto",
  "target": "sw"
}`}</pre>
      </div>

      <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
        <Endpoint
          title="Prompt management"
          body="Versioned chat/RAG/voice_faq system prompts with rollback (ADR-0030). Console /prompts."
        />
        <Endpoint title="GET/POST /v1/prompts…" body="List keys; create/activate versions; restore code fallback (Clerk)." />
        <Endpoint
          title="Analytics"
          body="Org overview: volume by feature/language pair, estimated cost, job error rate (ADR-0029)."
        />
        <Endpoint title="GET /v1/analytics/overview" body="SQL aggregates for the current org (Clerk or API key; ?from=&to=)." />
        <Endpoint
          title="Voice FAQ agent"
          body="Twilio inbound/outbound + STT → FAQ LLM → TTS. Simulate without Twilio (ADR-0028)."
        />
        <Endpoint title="POST /v1/voice/simulate" body="Text or audio FAQ turn (API key or Clerk)." />
        <Endpoint title="POST /v1/voice/twilio/inbound|turn" body="Signed Twilio webhooks → TwiML." />
        <Endpoint
          title="Voice Studio / clones"
          body="African Voice Studio console (/audio): stock TTS, language presets, consent-gated clones with review + disable (ADR-0044). Vendors only."
        />
        <Endpoint title="GET/POST /v1/voice-clones" body="List / create clones (Clerk; Pro + consent for create)." />
        <Endpoint title="GET /v1/voice-clones/{id}" body="Get clone profile." />
        <Endpoint title="POST /v1/voice-clones/{id}/review" body="Approve/reject pending_review (approve → ElevenLabs or fixture)." />
        <Endpoint title="POST /v1/voice-clones/{id}/disable" body="Disable clone for abuse/policy." />
        <Endpoint title="POST /v1/audio/speech" body="TTS; stock OpenAI, own:* rented open-weight (VL-121), or voice=clone:{id} (watermark)." />
        <Endpoint
          title="Workflows"
          body="JSON steps (transcribe → translate → notify) via job runner. Console /workflows (ADR-0027)."
        />
        <Endpoint title="GET/POST /v1/workflows" body="List/create saved workflow definitions (Clerk)." />
        <Endpoint title="POST /v1/workflows/{id}/run" body="Enqueue workflow job from saved definition (API key)." />
        <Endpoint
          title="Slack connector"
          body="Slash /verbalab <lang> <text> → translate into Slack. Link Team ID on /connectors (ADR-0026)."
        />
        <Endpoint title="POST /v1/connectors/slack/commands" body="Slack slash command (signed)." />
        <Endpoint title="POST /v1/connectors/slack/events" body="Slack Events url_verification." />
        <Endpoint
          title="Admin + customer portal"
          body="Members on /billing; platform admin /admin (ADMIN_EMAILS). Disable org + revoke keys (ADR-0025)."
        />
        <Endpoint title="GET /v1/organization/members" body="List org members (Clerk session)." />
        <Endpoint title="GET /v1/admin/organizations" body="Search orgs (platform admin allowlist)." />
        <Endpoint
          title="Notifications"
          body="Resend email: job complete, usage 80%/100%, member-added. Clerk hosts invites (ADR-0024)."
        />
        <Endpoint
          title="Production deploy"
          body="Fly.io one-region (ADR-0023). See infra/DEPLOY.md — Docker + release migrate; CI deploy when FLY_API_TOKEN set."
        />
        <Endpoint
          title="Data governance"
          body="Retention / persist / vendor-training flags; workspace export; owner org delete (cascade). See docs/data-map.md."
        />
        <Endpoint title="GET/PATCH /v1/organization/data-settings" body="Org data settings (Clerk; owners/admins for PATCH)." />
        <Endpoint title="POST /v1/organization/export" body="JSON export of current workspace data (Clerk)." />
        <Endpoint title="DELETE /v1/organization" body="Delete org + cascade (owner; confirmName)." />
        <Endpoint
          title="Security baseline"
          body="API keys hashed (SHA-256); tenant isolation; helmet + Next security headers; CI gitleaks + pnpm audit."
        />
        <Endpoint title="GET /v1/metrics/translate" body="In-process translate latency p50/p95/p99 (observability)." />
        <Endpoint
          title="POST /v1/translate rate limits"
          body="Per-key and per-org Redis limits (429 + Retry-After). Monthly character quota remains 402."
        />
        <Endpoint title="POST /v1/knowledge/documents" body="Upload DOCX/PDF/TXT into the workspace knowledge base (embed)." />
        <Endpoint title="POST /v1/knowledge/query" body="Ask the knowledge base; returns answer + citations (RAG)." />
        <Endpoint title="POST /v1/embeddings" body="Create text embeddings (OpenAI-shaped; used by RAG)." />
        <Endpoint title="POST /v1/interpret" body="Live interpreter: audio → STT → MT → TTS (JSON + audioBase64)." />
        <Endpoint title="POST /v1/chat/completions" body="Language-intelligence chat (optional translateReplyTo)." />
        <Endpoint title="POST /v1/detect" body="Detect source language (Google detect with franc-min fallback)." />
        <Endpoint title="GET /v1/languages" body="List seeded language codes, names, and tiers." />
        <Endpoint title="GET/POST /v1/glossary/terms" body="Workspace terminology (Clerk); applied on translate." />
        <Endpoint title="GET/POST /v1/tm/entries" body="Approved translation memory; exact match bypasses MT." />
        <Endpoint title="GET /v1/reviews" body="Quality reviews; accept/reject (accept can upsert TM)." />
        <Endpoint title="POST /v1/localize" body="Translate JSON/YAML i18n trees (ICU passthrough)." />
        <Endpoint title="POST /v1/ocr" body="Image OCR (optional source/target to translate)." />
        <Endpoint title="POST /v1/audio/transcriptions" body="Speech-to-text (multipart audio; usage in minutes)." />
        <Endpoint title="POST /v1/audio/speech" body="Text-to-speech; returns audio bytes. See GET /v1/audio/voices." />
        <Endpoint title="POST /v1/documents/translate" body="Upload DOCX/PDF; returns a document_translate job." />
        <Endpoint title="POST /v1/jobs" body="Enqueue batch_translate, document_translate, or workflow (API key)." />
        <Endpoint title="GET /v1/jobs/{id}" body="Poll job status and result." />
        <Endpoint title="GET /v1/audit-events" body="Org audit trail (Clerk session; owners/admins)." />
        <Endpoint title="GET /v1/openapi.json" body="This OpenAPI 3.1 document." />
        <Endpoint title="POST /v1/api-keys" body="Create a key (Clerk session). Secret returned once." />
        <Endpoint title="GET /v1/usage/summary" body="Month-to-date characters and request counts." />
      </div>

      <div className="vl-panel" style={{ marginTop: '1.5rem', padding: '1.35rem' }}>
        <h2 style={{ marginTop: 0, fontFamily: 'var(--font-display)', fontSize: '1.2rem' }}>TypeScript SDK</h2>
        <pre className="vl-code" style={{ margin: 0, background: 'var(--bg-soft)', padding: '1rem', borderRadius: 12, overflow: 'auto' }}>
{`import { VerbaLab } from '@verbalab/sdk';

const client = new VerbaLab({
  apiKey: process.env.VERBALAB_API_KEY!,
  baseUrl: '${API_URL}',
});

await client.translate({ text: 'Hello', source: 'en', target: 'sw' });`}
        </pre>
      </div>

      <div className="vl-panel" style={{ marginTop: '1.5rem', padding: '1.35rem' }}>
        <h2 style={{ marginTop: 0, fontFamily: 'var(--font-display)', fontSize: '1.2rem' }}>Quickstart</h2>
        <ol style={{ color: 'var(--muted)', lineHeight: 1.7, paddingLeft: '1.2rem' }}>
          <li>Create an API key in the console.</li>
          <li>Copy the secret (shown once).</li>
          <li>Call translate or use the playground.</li>
        </ol>
        <pre className="vl-code" style={{ margin: 0, background: 'var(--bg-soft)', padding: '1rem', borderRadius: 12, overflow: 'auto' }}>
{`# .env
VERBALAB_API_KEY=vl_live_...
VERBALAB_BASE_URL=${API_URL}`}
        </pre>
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

function Endpoint({ title, body }: { title: string; body: string }) {
  return (
    <div className="vl-panel" style={{ padding: '1.1rem 1.25rem' }}>
      <div className="vl-code" style={{ fontWeight: 600 }}>
        {title}
      </div>
      <p style={{ margin: '0.4rem 0 0', color: 'var(--muted)' }}>{body}</p>
    </div>
  );
}
