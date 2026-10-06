'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AgentChatDemo } from '@/components/marketing/agent-chat-demo';
import { API_URL } from '@/lib/api';

type VerifyResult = {
  verdict: string;
  summary: string;
  findings: Array<{ code: string; severity: string; detail: string }>;
};

/** Interactive provenance verify demo for Legal Integrity marketing pages. */
export function IntegrityVerifyDemo() {
  const [watermark, setWatermark] = useState('required');
  const [consent, setConsent] = useState(true);
  const [notes, setNotes] = useState('Speaker recorded informed consent for civic announcement clone.');
  const [claim, setClaim] = useState(
    'Generated speech proposed as a bilingual civic notice — not live courtroom testimony.',
  );
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function runVerify() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/v1/language-integrity/verify`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          claimType: 'provenance',
          watermarkHeader: watermark,
          consentAttested: consent,
          attestationNotes: notes,
          audioClaimText: claim,
        }),
      });
      if (!res.ok) throw new Error(`Verify HTTP ${res.status}`);
      const data = (await res.json()) as VerifyResult;
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verify failed');
      setResult({
        verdict: watermark === 'required' && consent ? 'attested' : 'unattested',
        summary:
          watermark === 'required' && consent
            ? 'Demo sandbox: claim carries watermark disclosure and consent signals.'
            : 'Demo sandbox: incomplete Lugemi attestation — do not treat as provenanced.',
        findings: [
          {
            code: 'demo',
            severity: 'info',
            detail: 'API unreachable — showing local demo verdict. Start the Lugemi API for live verify.',
          },
        ],
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mkt-page-demos">
      <AgentChatDemo
        title="Integrity desk · ministry briefing"
        userText="Can this voice clip be admitted as live testimony?"
        agentText="Not without Lugemi attestation. Require watermark disclosure, consent-gated clone status, audit ids — and human review for any bilingual filing."
        userVoiceId="user"
        agentVoiceId="amara"
      />
      <div
        style={{
          marginTop: '1.25rem',
          padding: '1.15rem 1.25rem',
          border: '1px solid var(--mkt-line, #d6d1c7)',
          borderRadius: '0.55rem',
          background: 'linear-gradient(165deg, rgba(15, 118, 110, 0.06), transparent 55%)',
        }}
      >
        <p className="mkt-tts-label" style={{ marginBottom: '0.65rem' }}>
          Provenance verify demo
        </p>
        <p style={{ margin: '0 0 0.85rem', color: 'var(--muted)', fontSize: '0.92rem', lineHeight: 1.55 }}>
          Paste a claim shape courts can require. This checks Lugemi watermark + consent metadata — not a universal
          deepfake detector.
        </p>
        <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.35rem' }}>
          Watermark header claim
        </label>
        <select
          value={watermark}
          onChange={(e) => setWatermark(e.target.value)}
          style={{ width: '100%', marginBottom: '0.75rem', padding: '0.45rem 0.55rem' }}
        >
          <option value="required">X-Lugemi-Watermark: required</option>
          <option value="missing">No watermark header</option>
          <option value="off">watermark=off (invalid)</option>
        </select>
        <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.75rem' }}>
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          Consent attested
        </label>
        <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.35rem' }}>
          Attestation notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          style={{ width: '100%', marginBottom: '0.75rem', padding: '0.45rem 0.55rem' }}
        />
        <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.35rem' }}>
          Audio / use claim
        </label>
        <textarea
          value={claim}
          onChange={(e) => setClaim(e.target.value)}
          rows={2}
          style={{ width: '100%', marginBottom: '0.85rem', padding: '0.45rem 0.55rem' }}
        />
        <button type="button" className="vl-btn vl-btn-primary" disabled={busy} onClick={() => void runVerify()}>
          {busy ? 'Checking…' : 'Run integrity check'}
        </button>
        {error ? (
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: '0.65rem' }}>
            Live API note: {error}
          </p>
        ) : null}
        {result ? (
          <div style={{ marginTop: '1rem' }}>
            <p style={{ margin: 0, fontWeight: 650 }}>
              Verdict: <span style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>{result.verdict}</span>
            </p>
            <p style={{ margin: '0.35rem 0 0.65rem', color: 'var(--muted)', lineHeight: 1.55 }}>{result.summary}</p>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', color: 'var(--muted)', fontSize: '0.88rem' }}>
              {result.findings.slice(0, 4).map((f) => (
                <li key={`${f.code}-${f.detail.slice(0, 24)}`}>
                  [{f.severity}] {f.detail}
                </li>
              ))}
            </ul>
            <p style={{ margin: '0.85rem 0 0', fontSize: '0.88rem' }}>
              <Link href="/language-integrity">Open Integrity console</Link>
              {' · '}
              <Link href="/docs">API docs</Link>
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
