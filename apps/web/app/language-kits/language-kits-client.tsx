'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { PortfolioShell } from '@/components/portfolio/portfolio-shell';
import { SearchableCombobox, type ComboboxOption } from '@/components/searchable-combobox';

type KitLang = {
  languageTag: string;
  displayName: string;
  nameNative: string | null;
  varietyId: string;
  script: string | null;
};

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
  const [languages, setLanguages] = useState<KitLang[]>([]);
  const [languageTag, setLanguageTag] = useState('ee');
  const [varietyId, setVarietyId] = useState('ee-GH');
  const [displayName, setDisplayName] = useState('Ewe');
  const [kit, setKit] = useState<Kit | null>(null);
  const [coverage, setCoverage] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void apiFetch<{ languages: KitLang[]; total?: number }>('/v1/language-kits/languages')
      .then((res) => {
        setLanguages(res.languages);
        const ee = res.languages.find((l) => l.languageTag === 'ee') ?? res.languages[0];
        if (ee) {
          setLanguageTag(ee.languageTag);
          setVarietyId(ee.varietyId);
          setDisplayName(ee.displayName);
        }
      })
      .catch(() => undefined);
  }, []);

  const langOptions: ComboboxOption[] = useMemo(
    () =>
      languages.map((l) => ({
        value: l.languageTag,
        label: `${l.displayName}${l.nameNative ? ` (${l.nameNative})` : ''} · ${l.varietyId}`,
        keywords: `${l.languageTag} ${l.displayName} ${l.nameNative ?? ''} ${l.varietyId}`,
      })),
    [languages],
  );

  function selectLanguage(tag: string) {
    setLanguageTag(tag);
    const hit = languages.find((l) => l.languageTag === tag);
    if (hit) {
      setVarietyId(hit.varietyId);
      setDisplayName(hit.displayName);
    }
  }

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
        body: JSON.stringify({
          displayName,
          languageTag,
          varietyId,
          script: languages.find((l) => l.languageTag === languageTag)?.script ?? 'Latn',
        }),
      });
      setKit(res);
      setCoverage(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed');
    }
  }

  async function advance() {
    if (!kit || !apiKey) return;
    try {
      const body: Record<string, string> = {
        toStage: 'data_ready',
        datasetManifestRef: `manifest_${languageTag}_local_demo_1`,
        licensePolicyRef: `policy_${languageTag}_local_demo_1`,
      };
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
      lede={`Evidence-gated onboarding. A registry entry is not a model release. Coverage is separate for ASR, translation directions, and synthesis. Full language registry (${languages.length || '…'} languages) available for kit drafting.`}
    >
      <form onSubmit={onCreate} className="vl-panel" style={{ padding: '1rem', display: 'grid', gap: '0.65rem' }}>
        <input className="vl-field" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="API key" />
        <label style={{ display: 'grid', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Language</span>
          <SearchableCombobox
            value={languageTag}
            onChange={selectLanguage}
            options={langOptions}
            placeholder="Search language…"
            emptyLabel="Select language…"
            aria-label="Language kit language"
          />
        </label>
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
