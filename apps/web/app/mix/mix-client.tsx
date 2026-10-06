'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { API_URL, apiFetch } from '@/lib/api';
import { PortfolioShell } from '@/components/portfolio/portfolio-shell';
import { DemoPlayStopButton } from '@/components/media/demo-play-stop-button';
import { useDemoPlayer } from '@/components/marketing/use-demo-player';
import { LocaleSelect } from '@/components/language-locale-select';
import { SearchableCombobox } from '@/components/searchable-combobox';
import { useLocaleCatalog } from '@/hooks/use-locale-catalog';

type MixResult = {
  original_transcript: string;
  translation: string;
  spans: Array<{
    text: string;
    language: string;
    uncertain: boolean;
    uncertainty_reason: string | null;
  }>;
  translated_segments: Array<{ source: string; translated: string; uncertain: boolean }>;
  entity_alignment: { names: Array<{ source: string; stable: boolean }> };
  warnings: string[];
  model_id: string;
  variety_id: string | null;
};

type CorridorRow = {
  id: string;
  varietyId: string;
  label: string;
  languageCode: string;
  evaluated: boolean;
};

export function MixClient() {
  const catalog = useLocaleCatalog();
  const [apiKey, setApiKey] = useState('');
  const [target, setTarget] = useState('en');
  const [sourcePrimary, setSourcePrimary] = useState('ak');
  const [textHint, setTextHint] = useState(
    'Caller provided name Kwame Mensah, amount five hundred, then corrected to fifty for tomorrow.',
  );
  const [varietyId, setVarietyId] = useState('ak-GH-twi');
  const [corridors, setCorridors] = useState<CorridorRow[]>([]);
  const [corridorCount, setCorridorCount] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<MixResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { play, stop, playingId, loadingId } = useDemoPlayer();

  useEffect(() => {
    void apiFetch<{ corridors: CorridorRow[]; total?: number; count?: number }>('/v1/portfolio/corridors')
      .then((res) => {
        setCorridors(res.corridors);
        setCorridorCount(res.total ?? res.count ?? res.corridors.length);
        const preferred =
          res.corridors.find((c) => c.varietyId === 'ak-GH-twi') ?? res.corridors[0];
        if (preferred) {
          setVarietyId(preferred.varietyId);
          setSourcePrimary(preferred.languageCode || 'ak');
        }
      })
      .catch(() => undefined);
  }, []);

  const sourceHints = useMemo(() => {
    const primary = sourcePrimary.trim().toLowerCase().split(/[-_]/)[0] || 'ak';
    return primary === 'en' ? 'en' : `${primary},en`;
  }, [sourcePrimary]);

  const corridorOptions = useMemo(
    () =>
      corridors.map((c) => ({
        value: c.varietyId,
        label: `${c.label}${c.evaluated ? ' · strategic' : ''}`,
        keywords: `${c.id} ${c.varietyId} ${c.languageCode} ${c.label}`,
        group: c.evaluated ? 'Strategic' : 'Registry',
      })),
    [corridors],
  );

  function onVarietyChange(next: string) {
    setVarietyId(next);
    const hit = corridors.find((c) => c.varietyId === next);
    if (hit?.languageCode) setSourcePrimary(hit.languageCode);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setResult(null);
    if (!apiKey.startsWith('lg_live_') && !apiKey.startsWith('lg_test_')) {
      setError('Paste a lg_live_ or lg_test_ API key');
      return;
    }
    setLoading(true);
    try {
      const form = new FormData();
      form.append('target', target);
      form.append('sourceHints', sourceHints);
      form.append('textHint', textHint);
      form.append('varietyId', varietyId);
      if (file) form.append('file', file);
      const res = await fetch(`${API_URL}/v1/mix/transcribe-translate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}` },
        body: form,
      });
      const body = (await res.json()) as MixResult & { message?: string };
      if (!res.ok) throw new Error(body.message ?? `HTTP ${res.status}`);
      setResult(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  }

  const ledeCount = corridorCount || corridors.length;

  return (
    <PortfolioShell
      title="Lugemi Mix"
      lede={`Meaning-preserving mixed-language speech. Shows original and translated text side by side, highlights uncertain spans, and keeps names stable. Evaluated varieties: all ${ledeCount || '…'} registry language↔English corridors (not only Twi and Yoruba).`}
      docsHref="/docs"
    >
      <form onSubmit={onSubmit} className="vl-panel" style={{ padding: '1rem', display: 'grid', gap: '0.75rem' }}>
        <label style={{ display: 'grid', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>API key</span>
          <input className="vl-field" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="lg_live_…" />
        </label>
        <label style={{ display: 'grid', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Text hint (local demo without audio)</span>
          <textarea className="vl-field" rows={3} value={textHint} onChange={(e) => setTextHint(e.target.value)} />
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <label style={{ display: 'grid', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Target</span>
            <LocaleSelect
              className="vl-field"
              value={target}
              onChange={setTarget}
              languages={catalog.languages}
              locales={catalog.locales}
              dialects={catalog.dialects}
              accents={catalog.accents}
            />
          </label>
          <label style={{ display: 'grid', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
              Source language <span style={{ opacity: 0.75 }}>(hints: {sourceHints})</span>
            </span>
            <LocaleSelect
              className="vl-field"
              value={sourcePrimary}
              onChange={setSourcePrimary}
              languages={catalog.languages}
              locales={catalog.locales}
              dialects={catalog.dialects}
              accents={catalog.accents}
            />
          </label>
        </div>
        <label style={{ display: 'grid', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
            Corridor variety ({ledeCount || '…'} available)
          </span>
          <SearchableCombobox
            className="vl-field"
            value={varietyId}
            onChange={onVarietyChange}
            options={corridorOptions}
            placeholder={corridors.length ? 'Search corridor / variety…' : 'Loading corridors…'}
            emptyLabel={corridors.length ? 'Select corridor…' : 'Loading corridors…'}
            aria-label="Mix corridor variety"
          />
        </label>
        <label style={{ display: 'grid', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Optional audio file</span>
          <input type="file" accept="audio/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </label>
        <button type="submit" className="vl-btn" disabled={loading}>
          {loading ? 'Running Mix…' : 'Transcribe & translate'}
        </button>
      </form>

      {error ? <p style={{ color: 'var(--bad)', marginTop: '1rem' }}>{error}</p> : null}

      {result ? (
        <div style={{ marginTop: '1.25rem', display: 'grid', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="vl-panel" style={{ padding: '0.9rem' }}>
              <h3 style={{ margin: 0, fontSize: '0.95rem' }}>Original</h3>
              <p style={{ margin: '0.5rem 0 0', whiteSpace: 'pre-wrap' }}>{result.original_transcript}</p>
            </div>
            <div className="vl-panel" style={{ padding: '0.9rem' }}>
              <h3 style={{ margin: 0, fontSize: '0.95rem' }}>Translated</h3>
              <p style={{ margin: '0.5rem 0 0', whiteSpace: 'pre-wrap' }}>{result.translation}</p>
              <div style={{ marginTop: '0.75rem' }}>
                <DemoPlayStopButton
                  active={playingId === 'mix-translation'}
                  loading={loadingId === 'mix-translation'}
                  variant="secondary"
                  onPlay={() =>
                    void play({ id: 'mix-translation', text: result.translation, lang: target })
                  }
                  onStop={() => stop()}
                  label="Play translation"
                />
              </div>
            </div>
          </div>
          <div className="vl-panel" style={{ padding: '0.9rem' }}>
            <h3 style={{ margin: 0, fontSize: '0.95rem' }}>Spans</h3>
            <ul style={{ margin: '0.5rem 0 0', padding: 0, listStyle: 'none', display: 'grid', gap: '0.35rem' }}>
              {result.spans.map((s, i) => (
                <li
                  key={`${s.text}-${i}`}
                  style={{
                    padding: '0.4rem 0.55rem',
                    background: s.uncertain ? 'rgba(180, 90, 40, 0.12)' : 'transparent',
                    borderRadius: 4,
                  }}
                >
                  <strong>{s.language}</strong> — {s.text}
                  {s.uncertain && s.uncertainty_reason ? (
                    <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}> · {s.uncertainty_reason}</span>
                  ) : null}
                </li>
              ))}
            </ul>
            {result.entity_alignment.names.length ? (
              <p style={{ margin: '0.65rem 0 0', fontSize: '0.85rem' }}>
                Stable names:{' '}
                {result.entity_alignment.names.map((n) => n.source).join(', ')}
              </p>
            ) : null}
            {result.warnings.length ? (
              <p style={{ margin: '0.5rem 0 0', color: 'var(--muted)', fontSize: '0.85rem' }}>
                {result.warnings.join(' ')}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--muted)' }}>
        Also available: <code>GET {API_URL}/v1/mix/engine</code>
        {' · '}
        engine probe via{' '}
        <button
          type="button"
          className="vl-btn vl-btn-secondary"
          style={{ minHeight: 28, padding: '0.2rem 0.55rem' }}
          onClick={() => void apiFetch('/v1/mix/engine').then((r) => alert(JSON.stringify(r, null, 2)))}
        >
          Load engine
        </button>
      </p>
    </PortfolioShell>
  );
}
