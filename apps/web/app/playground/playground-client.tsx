'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { API_URL, apiFetch } from '@/lib/api';
import { BrandMark } from '@/components/brand-mark';
import { CodePanel } from '@/components/code-panel';
import { DemoPlayStopButton } from '@/components/media/demo-play-stop-button';
import { useDemoPlayer } from '@/components/marketing/use-demo-player';
import { LocaleSelect } from '@/components/language-locale-select';
import { useLocaleCatalog } from '@/hooks/use-locale-catalog';
import { SITE_CONTENT } from '@/data/site-content';

type Mode = 'translate' | 'detect' | 'languages';

function isApiKey(value: string) {
  return value.startsWith('lg_live_') || value.startsWith('lg_test_');
}

export function PlaygroundClient() {
  const searchParams = useSearchParams();
  const catalog = useLocaleCatalog();
  const [mode, setMode] = useState<Mode>('translate');
  const [apiKey, setApiKey] = useState('');
  const [source, setSource] = useState(
    () => searchParams.get('source') || SITE_CONTENT.playgroundDefaults.source,
  );
  const [target, setTarget] = useState(
    () => searchParams.get('target') || SITE_CONTENT.playgroundDefaults.target,
  );
  const [text, setText] = useState(SITE_CONTENT.playgroundDefaults.text);
  const [response, setResponse] = useState<string>('');
  const [playText, setPlayText] = useState<string | null>(null);
  const [playLang, setPlayLang] = useState('en');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { play, stop, playingId, loadingId, status, error: playError } = useDemoPlayer();

  const curl =
    mode === 'languages'
      ? `curl "${API_URL}/v1/languages"`
      : mode === 'detect'
        ? `curl -X POST "${API_URL}/v1/detect" \\
  -H "Authorization: Bearer ${apiKey || 'lg_live_...'}" \\
  -H "Content-Type: application/json" \\
  -d '{"text":${JSON.stringify(text)}}'`
        : `curl -X POST "${API_URL}/v1/translate" \\
  -H "Authorization: Bearer ${apiKey || 'lg_live_...'}" \\
  -H "Content-Type: application/json" \\
  -d '{"text":${JSON.stringify(text)},"source":"${source}","target":"${target}"}'`;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    setResponse('');
    setPlayText(null);
    try {
      if (mode === 'languages') {
        const res = await apiFetch<unknown>('/v1/languages');
        setResponse(JSON.stringify(res, null, 2));
        return;
      }
      if (!isApiKey(apiKey)) {
        throw new Error('Paste a lg_live_ or lg_test_ API key from the console');
      }
      if (mode === 'detect') {
        const res = await apiFetch<unknown>('/v1/detect', {
          method: 'POST',
          token: apiKey,
          body: JSON.stringify({ text }),
        });
        setResponse(JSON.stringify(res, null, 2));
        return;
      }
      const res = await apiFetch<{ text?: string; translatedText?: string; target?: string }>(
        '/v1/translate',
        {
          method: 'POST',
          token: apiKey,
          body: JSON.stringify({ text, source, target }),
        },
      );
      setResponse(JSON.stringify(res, null, 2));
      const spoken = res.translatedText ?? res.text;
      if (spoken) {
        setPlayText(spoken);
        setPlayLang(res.target ?? target);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="vl-api-public vl-fade-up">
      <PublicHeader />
      <p className="vl-tag" style={{ margin: '1.35rem 0 0' }}>
        Lugemi API
      </p>
      <h1 style={{ margin: '0.55rem 0 0', fontFamily: 'var(--font-display)', letterSpacing: '-0.03em', fontSize: '2rem', color: 'var(--brand-navy)' }}>
        API playground
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0.5rem 0 0', maxWidth: '38rem', lineHeight: 1.6 }}>
        Try translate, detect, and languages against the Lugemi API — the same surface speaking agents use for
        multilingual turns. Prefill text is editable. Paste a <code className="vl-code">lg_live_</code> or{' '}
        <code className="vl-code">lg_test_</code> key; list languages without a key.
      </p>

      <div className="vl-player-bar" style={{ marginTop: '1.25rem' }}>
        {(['translate', 'detect', 'languages'] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`vl-mode-tab${mode === m ? ' is-active' : ''}`}
          >
            {m}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} className="vl-panel" style={{ marginTop: '1rem', padding: '1.35rem', display: 'grid', gap: '1rem' }}>
        <div style={{ marginBottom: '-0.25rem' }}>
          <span className="vl-endpoint-method">
            {mode === 'languages' ? 'GET' : 'POST'}
          </span>
          <span className="vl-endpoint-path">
            {mode === 'languages' ? '/v1/languages' : mode === 'detect' ? '/v1/detect' : '/v1/translate'}
          </span>
        </div>

        {mode !== 'languages' ? (
          <label className="vl-label">
            API key
            <input
              className="vl-field vl-code"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="lg_live_... or lg_test_..."
              required
            />
          </label>
        ) : null}

        {mode === 'translate' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <label className="vl-label">
              Source
              <LocaleSelect
                value={source}
                onChange={setSource}
                languages={
                  catalog.languages.length
                    ? catalog.languages
                    : [
                        { code: 'en', name: 'English' },
                        { code: 'ak', name: 'Akan (Twi)', nativeName: 'Twi' },
                      ]
                }
                locales={catalog.locales}
                dialects={catalog.dialects}
                accents={catalog.accents}
                allowAuto
                className="vl-field"
              />
            </label>
            <label className="vl-label">
              Target
              <LocaleSelect
                value={target}
                onChange={setTarget}
                languages={
                  catalog.languages.length
                    ? catalog.languages
                    : [
                        { code: 'en', name: 'English' },
                        { code: 'ak', name: 'Akan (Twi)', nativeName: 'Twi' },
                      ]
                }
                locales={catalog.locales}
                dialects={catalog.dialects}
                accents={catalog.accents}
                className="vl-field"
              />
            </label>
          </div>
        ) : null}

        {mode !== 'languages' ? (
          <label className="vl-label">
            Text
            <textarea className="vl-field" rows={5} value={text} onChange={(e) => setText(e.target.value)} required />
          </label>
        ) : (
          <p style={{ margin: 0, color: 'var(--muted)' }}>Public language registry — no API key required.</p>
        )}

        <div className="vl-player-bar" style={{ border: 'none', padding: 0, background: 'transparent' }}>
          <button type="submit" className="vl-btn vl-btn-primary" disabled={loading}>
            {loading ? 'Sending…' : 'Send request'}
          </button>
        </div>
      </form>

      {error ? <p style={{ color: 'var(--bad)' }}>{error}</p> : null}
      {playError ? (
        <p style={{ color: 'var(--bad)' }} role="alert">
          {playError}
        </p>
      ) : null}

      {playText ? (
        <div
          className="vl-panel"
          style={{
            marginTop: '1rem',
            padding: '1rem 1.15rem',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.75rem',
            alignItems: 'center',
          }}
        >
          <DemoPlayStopButton
            active={playingId === 'playground-result'}
            loading={loadingId === 'playground-result'}
            variant="primary"
            label="Play translation"
            stopLabel="Stop"
            onStop={stop}
            onPlay={() => {
              void play({
                id: 'playground-result',
                text: playText,
                lang: playLang,
                voiceId: playLang.startsWith('sw') ? 'amara' : 'abe',
              });
            }}
          />
          <p className="mkt-tts-hint" role="status" aria-live="polite" style={{ margin: 0 }}>
            {status ?? 'Hear the translated result with demo TTS.'}
          </p>
        </div>
      ) : null}

      <div style={{ display: 'grid', gap: '1rem', marginTop: '1.25rem' }}>
        <CodePanel code={curl} label="cURL" />
        {response ? <CodePanel code={response} label="Response" /> : null}
      </div>
    </div>
  );
}

function PublicHeader() {
  return (
    <div className="vl-api-public-header">
      <BrandMark href="/" />
      <div className="vl-api-public-links">
        <Link href="/docs">Docs</Link>
        <Link href="/models">Models</Link>
        <Link href="/developers">Developers</Link>
        <Link href="/dashboard" className="vl-btn vl-btn-secondary" style={{ textDecoration: 'none', padding: '0.45rem 0.9rem', minHeight: 40 }}>
          Console
        </Link>
      </div>
    </div>
  );
}
