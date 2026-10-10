'use client';

import { FormEvent, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { PortfolioShell } from '@/components/portfolio/portfolio-shell';
import { LocaleSelect } from '@/components/language-locale-select';
import { useLocaleCatalog } from '@/hooks/use-locale-catalog';

type VerifyResult = {
  decision: string;
  error_probability: number | null;
  error_spans: Array<{ category: string; severity: string; reason_code: string; source: string }>;
  proposed_clarification: string | null;
  clarify_id: string | null;
  calibration_version: string;
  warnings: string[];
};

type ClarifyResult = {
  resolution: string;
  confirmed_value: string | null;
  note?: string;
};

export function FidelityClient() {
  const catalog = useLocaleCatalog();
  const [apiKey, setApiKey] = useState('');
  const [source, setSource] = useState('I did not approve the transfer of 500');
  const [target, setTarget] = useState('I approved the transfer of 5,000');
  const [sourceLanguage, setSourceLanguage] = useState('en');
  const [targetLanguage, setTargetLanguage] = useState('ak');
  const [verify, setVerify] = useState<VerifyResult | null>(null);
  const [clarifyAnswer, setClarifyAnswer] = useState('');
  const [clarify, setClarify] = useState<ClarifyResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onVerify(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setClarify(null);
    if (!apiKey.startsWith('lg_')) {
      setError('Paste a lg_live_ or lg_test_ API key');
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch<VerifyResult>('/v1/fidelity/verify', {
        method: 'POST',
        token: apiKey,
        body: JSON.stringify({
          source,
          target,
          sourceLanguage,
          targetLanguage,
        }),
      });
      setVerify(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verify failed');
    } finally {
      setLoading(false);
    }
  }

  async function onClarify(silence = false, refused = false) {
    if (!verify?.clarify_id || !apiKey) return;
    setError(null);
    try {
      const res = await apiFetch<ClarifyResult>('/v1/fidelity/clarify', {
        method: 'POST',
        token: apiKey,
        body: JSON.stringify({
          clarifyId: verify.clarify_id,
          answer: silence || refused ? null : clarifyAnswer,
          silence,
          refused,
        }),
      });
      setClarify(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Clarify failed');
    }
  }

  return (
    <PortfolioShell
      title="Lugemi Fidelity"
      lede="Translation verification and clarification. Flags changed negation or quantity before the result is spoken or used by an agent. Silence and refusal never become confirmation. Source/target languages cover the full registry."
    >
      <form onSubmit={onVerify} className="vl-panel" style={{ padding: '1rem', display: 'grid', gap: '0.75rem' }}>
        <label style={{ display: 'grid', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>API key</span>
          <input className="vl-field" value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <label style={{ display: 'grid', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Source language</span>
            <LocaleSelect
              className="vl-field"
              value={sourceLanguage}
              onChange={setSourceLanguage}
              languages={catalog.languages}
              locales={catalog.locales}
              dialects={catalog.dialects}
              accents={catalog.accents}
            />
          </label>
          <label style={{ display: 'grid', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Target language</span>
            <LocaleSelect
              className="vl-field"
              value={targetLanguage}
              onChange={setTargetLanguage}
              languages={catalog.languages}
              locales={catalog.locales}
              dialects={catalog.dialects}
              accents={catalog.accents}
            />
          </label>
        </div>
        <label style={{ display: 'grid', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Source</span>
          <textarea className="vl-field" rows={2} value={source} onChange={(e) => setSource(e.target.value)} />
        </label>
        <label style={{ display: 'grid', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Target translation</span>
          <textarea className="vl-field" rows={2} value={target} onChange={(e) => setTarget(e.target.value)} />
        </label>
        <button type="submit" className="vl-btn" disabled={loading}>
          {loading ? 'Verifying…' : 'Verify'}
        </button>
      </form>

      {error ? <p style={{ color: 'var(--bad)', marginTop: '1rem' }}>{error}</p> : null}

      {verify ? (
        <div className="vl-panel" style={{ padding: '1rem', marginTop: '1rem', display: 'grid', gap: '0.5rem' }}>
          <div>
            Decision: <strong>{verify.decision}</strong>
            {verify.error_probability != null ? ` · P(error)=${verify.error_probability.toFixed(2)}` : ' · probability null (out of calibrated event)'}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
            Calibration {verify.calibration_version}
          </div>
          <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
            {verify.error_spans.map((e, i) => (
              <li key={`${e.reason_code}-${i}`}>
                {e.severity}/{e.category}: {e.reason_code} ({e.source})
              </li>
            ))}
          </ul>
          {verify.proposed_clarification ? (
            <div style={{ marginTop: '0.5rem' }}>
              <p>{verify.proposed_clarification}</p>
              <input
                className="vl-field"
                value={clarifyAnswer}
                onChange={(e) => setClarifyAnswer(e.target.value)}
                placeholder="Caller answer"
              />
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                <button type="button" className="vl-btn" onClick={() => void onClarify(false, false)}>
                  Submit answer
                </button>
                <button type="button" className="vl-btn vl-btn-secondary" onClick={() => void onClarify(true, false)}>
                  Silence
                </button>
                <button type="button" className="vl-btn vl-btn-secondary" onClick={() => void onClarify(false, true)}>
                  Refuse
                </button>
              </div>
            </div>
          ) : null}
          {clarify ? (
            <p style={{ marginTop: '0.5rem' }}>
              Resolution: <strong>{clarify.resolution}</strong>
              {clarify.note ? ` — ${clarify.note}` : null}
            </p>
          ) : null}
        </div>
      ) : null}
    </PortfolioShell>
  );
}
