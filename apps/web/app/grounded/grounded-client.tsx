'use client';

import { FormEvent, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { PortfolioShell } from '@/components/portfolio/portfolio-shell';

type InterpretResult = {
  region_id: string;
  resolved_referent: {
    label: string;
    amount: string | null;
    currency: string | null;
  } | null;
  document_evidence: {
    tokens: Array<{ text: string }>;
    amount: string | null;
  };
  speaker_claim: { text: string; intent: string };
  translation: string | null;
  discrepancy_flags: Array<{ code: string; detail: string }>;
  review_decision: string;
  warnings: string[];
  bounding_boxes: Array<{ page: number; x: number; y: number; width: number; height: number }>;
  note?: string;
};

export function GroundedClient() {
  const [apiKey, setApiKey] = useState('');
  const [documentRef, setDocumentRef] = useState('bill_demo_001');
  const [documentText, setDocumentText] = useState(
    'Service charge GHS 45.00\nVAT GHS 7.20\nTotal due GHS 52.20\nPayment due tomorrow',
  );
  const [utterance, setUtterance] = useState('What is this charge on the selected line?');
  const [targetLanguage, setTargetLanguage] = useState('en');
  const [region, setRegion] = useState({ page: 1, x: 40, y: 120, width: 320, height: 48 });
  const [wrongRegion, setWrongRegion] = useState(false);
  const [result, setResult] = useState<InterpretResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setResult(null);
    if (!apiKey.startsWith('lg_')) {
      setError('Paste a lg_live_ or lg_test_ API key');
      return;
    }
    setLoading(true);
    try {
      const activeRegion = wrongRegion
        ? { page: 1, x: 10, y: 10, width: 20, height: 10 }
        : region;
      const res = await apiFetch<InterpretResult>('/v1/grounded/interpret', {
        method: 'POST',
        token: apiKey,
        body: JSON.stringify({
          documentRef,
          documentHash: `hash_${documentText.length}`,
          documentText: wrongRegion ? '' : documentText,
          region: activeRegion,
          utterance,
          targetLanguage,
          sourceLanguage: 'en',
          mode: 'interpret',
        }),
      });
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Interpret failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <PortfolioShell
      title="Lugemi Grounded"
      lede="Speech plus the selected visual referent. Returns document evidence, speaker claim, and translation separately. Highlights the referenced region and supports wrong-region correction. Assistive document communication only."
    >
      <form onSubmit={onSubmit} className="vl-panel" style={{ padding: '1rem', display: 'grid', gap: '0.75rem' }}>
        <label style={{ display: 'grid', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>API key</span>
          <input className="vl-field" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="lg_live_…" />
        </label>
        <label style={{ display: 'grid', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Document reference</span>
          <input className="vl-field" value={documentRef} onChange={(e) => setDocumentRef(e.target.value)} />
        </label>
        <label style={{ display: 'grid', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Document text (selected region OCR stand-in)</span>
          <textarea
            className="vl-field"
            rows={4}
            value={documentText}
            onChange={(e) => setDocumentText(e.target.value)}
          />
        </label>
        <label style={{ display: 'grid', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Spoken / typed utterance</span>
          <textarea className="vl-field" rows={2} value={utterance} onChange={(e) => setUtterance(e.target.value)} />
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(5.5rem, 1fr))', gap: '0.5rem' }}>
          {(['page', 'x', 'y', 'width', 'height'] as const).map((key) => (
            <label key={key} style={{ display: 'grid', gap: '0.2rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{key}</span>
              <input
                className="vl-field"
                type="number"
                value={region[key]}
                onChange={(e) => setRegion((r) => ({ ...r, [key]: Number(e.target.value) }))}
              />
            </label>
          ))}
          <label style={{ display: 'grid', gap: '0.2rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>target</span>
            <input className="vl-field" value={targetLanguage} onChange={(e) => setTargetLanguage(e.target.value)} />
          </label>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input type="checkbox" checked={wrongRegion} onChange={(e) => setWrongRegion(e.target.checked)} />
          <span style={{ fontSize: '0.85rem' }}>Simulate wrong / empty region (request clarification)</span>
        </label>
        <button type="submit" className="vl-btn" disabled={loading}>
          {loading ? 'Interpreting…' : 'Interpret grounded region'}
        </button>
      </form>

      {error ? <p style={{ color: 'var(--bad)', marginTop: '1rem' }}>{error}</p> : null}

      {result ? (
        <div style={{ marginTop: '1.25rem', display: 'grid', gap: '0.85rem' }}>
          <div
            className="vl-panel"
            style={{
              padding: '1rem',
              position: 'relative',
              minHeight: 120,
              background:
                'linear-gradient(180deg, rgba(20,40,70,0.04), transparent), repeating-linear-gradient(0deg, transparent, transparent 22px, rgba(0,0,0,0.04) 23px)',
            }}
          >
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted)' }}>Referenced area</p>
            {(result.bounding_boxes ?? []).map((box, i) => (
              <div
                key={`${box.x}-${i}`}
                style={{
                  marginTop: '0.65rem',
                  border: '2px solid var(--brand-navy)',
                  background: 'rgba(20, 60, 120, 0.08)',
                  padding: '0.55rem 0.7rem',
                  maxWidth: Math.max(160, box.width),
                }}
              >
                <code style={{ fontSize: '0.75rem' }}>
                  page {box.page} · {box.x},{box.y} {box.width}×{box.height}
                </code>
                <div style={{ marginTop: '0.35rem' }}>
                  {result.document_evidence.tokens.map((t) => t.text).join(' · ') || '(no tokens)'}
                </div>
              </div>
            ))}
          </div>

          <div className="vl-panel" style={{ padding: '1rem', display: 'grid', gap: '0.45rem' }}>
            <div>
              Review: <strong>{result.review_decision}</strong> · region {result.region_id}
            </div>
            <p style={{ margin: 0 }}>
              <strong>Document evidence</strong> — amount {result.document_evidence.amount ?? 'n/a'}
            </p>
            <p style={{ margin: 0 }}>
              <strong>Speaker claim</strong> — {result.speaker_claim.text} ({result.speaker_claim.intent})
            </p>
            <p style={{ margin: 0 }}>
              <strong>Translation</strong> — {result.translation ?? '(none — clarify region)'}
            </p>
            {result.resolved_referent ? (
              <p style={{ margin: 0, fontSize: '0.9rem' }}>
                Referent: {result.resolved_referent.label}
                {result.resolved_referent.amount ? ` · ${result.resolved_referent.amount}` : ''}
              </p>
            ) : (
              <p style={{ margin: 0, color: 'var(--brand-navy)' }}>Referent unresolved — select another region.</p>
            )}
            {result.discrepancy_flags.length ? (
              <ul style={{ margin: '0.25rem 0 0', paddingLeft: '1.1rem' }}>
                {result.discrepancy_flags.map((f) => (
                  <li key={f.code}>
                    {f.code}: {f.detail}
                  </li>
                ))}
              </ul>
            ) : null}
            {result.warnings?.length ? (
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted)' }}>{result.warnings.join(' ')}</p>
            ) : null}
            {result.note ? (
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted)' }}>{result.note}</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </PortfolioShell>
  );
}
