'use client';

import { FormEvent, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { PortfolioShell } from '@/components/portfolio/portfolio-shell';
import { DemoPlayStopButton } from '@/components/media/demo-play-stop-button';
import { useDemoPlayer } from '@/components/marketing/use-demo-player';

type Result = {
  mode: string;
  translation: string;
  speech_act: { act: string; politeness: string; urgency: string };
  disclosed_changes: string[];
  candidates: Array<{ mode: string; text: string }>;
};

export function PragmaticsClient() {
  const [apiKey, setApiKey] = useState('');
  const [text, setText] = useState('Could you please look into this when you have a moment?');
  const [mode, setMode] = useState<'faithful' | 'literal' | 'localized'>('faithful');
  const [target, setTarget] = useState('sw');
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { play, stop, playingId, loadingId } = useDemoPlayer();

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!apiKey.startsWith('lg_')) {
      setError('Paste a lg_live_ or lg_test_ API key');
      return;
    }
    try {
      const res = await apiFetch<Result>('/v1/pragmatics/translate', {
        method: 'POST',
        token: apiKey,
        body: JSON.stringify({ text, source: 'en', target, mode, locale: 'sw-TZ' }),
      });
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    }
  }

  return (
    <PortfolioShell
      title="Lugemi Pragmatics"
      lede="Preserve speech acts and register. Choose faithful, literal, or clearly labelled localized — never silently mixed. Target language covers the full registry."
    >
      <form onSubmit={onSubmit} className="vl-panel" style={{ padding: '1rem', display: 'grid', gap: '0.75rem' }}>
        <input className="vl-field" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="API key" />
        <textarea className="vl-field" rows={3} value={text} onChange={(e) => setText(e.target.value)} />
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <select className="vl-field" value={mode} onChange={(e) => setMode(e.target.value as typeof mode)}>
            <option value="faithful">faithful (default)</option>
            <option value="literal">literal</option>
            <option value="localized">localized</option>
          </select>
          <input className="vl-field" value={target} onChange={(e) => setTarget(e.target.value)} style={{ maxWidth: '8rem' }} />
          <button type="submit" className="vl-btn">
            Translate
          </button>
        </div>
      </form>
      {error ? <p style={{ color: 'var(--bad)' }}>{error}</p> : null}
      {result ? (
        <div className="vl-panel" style={{ padding: '1rem', marginTop: '1rem' }}>
          <p>
            Act <strong>{result.speech_act.act}</strong> · politeness {result.speech_act.politeness} · mode{' '}
            {result.mode}
          </p>
          <p>{result.translation}</p>
          <DemoPlayStopButton
            active={playingId === 'prag-out'}
            loading={loadingId === 'prag-out'}
            variant="secondary"
            onPlay={() => void play({ id: 'prag-out', text: result.translation, lang: target })}
            onStop={() => stop()}
            label="Play"
          />
          {result.disclosed_changes.length ? (
            <ul style={{ marginTop: '0.75rem' }}>
              {result.disclosed_changes.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </PortfolioShell>
  );
}
