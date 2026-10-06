'use client';

import { FormEvent, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { PortfolioShell } from '@/components/portfolio/portfolio-shell';

type Kit = {
  id: string;
  display_name: string;
  language_tag: string;
  variety_id: string;
  stage: string;
  coverage: {
    asr: string;
    synthesis: string;
    translation: Array<{ direction: string; status: string }>;
  };
};

export function LanguageKitsClient() {
  const [apiKey, setApiKey] = useState('');
  const [displayName, setDisplayName] = useState('Ewe (pilot draft)');
  const [languageTag, setLanguageTag] = useState('ee');
  const [varietyId, setVarietyId] = useState('ee-GH');
  const [kit, setKit] = useState<Kit | null>(null);
  const [coverage, setCoverage] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!apiKey.startsWith('lg_')) {
      setError('Paste a lg_live_ or lg_test_ API key');
      return;
    }
    try {
      const res = await apiFetch<Kit>('/v1/language-kits', {
        method: 'POST',
        token: apiKey,
        body: JSON.stringify({ displayName, languageTag, varietyId, script: 'Latn' }),
      });
      setKit(res);
      setCoverage(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed');
    }
  }

  async function advance(toStage?: string) {
    if (!kit || !apiKey) return;
    try {
      const body: Record<string, string> = {};
      if (toStage) body.toStage = toStage;
      if ((toStage ?? 'data_ready') === 'data_ready' || kit.stage === 'draft') {
        body.toStage = 'data_ready';
        body.datasetManifestRef = 'manifest_ewe_pilot_1';
        body.licensePolicyRef = 'policy_ewe_pilot_1';
      }
      const res = await apiFetch<Kit>(`/v1/language-kits/${kit.id}/advance`, {
        method: 'POST',
        token: apiKey,
        body: JSON.stringify(body),
      });
      setKit(res);
      const cov = await apiFetch(`/v1/language-kits/${kit.id}/coverage`, { token: apiKey });
      setCoverage(cov);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Advance failed');
    }
  }

  return (
    <PortfolioShell
      title="Lugemi Language Kit"
      lede="Evidence-gated onboarding. A registry entry is not a model release. Coverage is separate for ASR, translation directions, and synthesis."
    >
      <form onSubmit={onCreate} className="vl-panel" style={{ padding: '1rem', display: 'grid', gap: '0.65rem' }}>
        <input className="vl-field" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="API key" />
        <input className="vl-field" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input className="vl-field" value={languageTag} onChange={(e) => setLanguageTag(e.target.value)} />
          <input className="vl-field" value={varietyId} onChange={(e) => setVarietyId(e.target.value)} />
        </div>
        <button type="submit" className="vl-btn">
          Create draft kit
        </button>
      </form>
      {error ? <p style={{ color: 'var(--bad)' }}>{error}</p> : null}
      {kit ? (
        <div className="vl-panel" style={{ padding: '1rem', marginTop: '1rem' }}>
          <p>
            <strong>{kit.display_name}</strong> · {kit.id} · stage <code>{kit.stage}</code>
          </p>
          <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
            ASR {kit.coverage.asr} · synthesis {kit.coverage.synthesis}
          </p>
          <button type="button" className="vl-btn vl-btn-secondary" onClick={() => void advance()}>
            Advance stage
          </button>
          {coverage ? (
            <pre style={{ marginTop: '0.75rem', fontSize: '0.8rem', overflow: 'auto' }}>
              {JSON.stringify(coverage, null, 2)}
            </pre>
          ) : null}
        </div>
      ) : null}
    </PortfolioShell>
  );
}
