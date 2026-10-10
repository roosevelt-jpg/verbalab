'use client';

import { useCallback, useEffect, useState } from 'react';
import { DemoPlayStopButton } from '@/components/media/demo-play-stop-button';
import { useDemoPlayer } from './use-demo-player';

type PairMeta = {
  id: string;
  source: string;
  target: string;
  sourceLabel: string;
  targetLabel: string;
  text: string;
  translated?: string;
  sourceLang: string;
  targetLang: string;
  sourceVoice: string;
  targetVoice: string;
};

type TranslateResult = {
  mode: string;
  text: string;
  translated: string;
  sourceLabel: string;
  targetLabel: string;
  sourceLang: string;
  targetLang: string;
  sourceVoice: string;
  targetVoice: string;
  pairId: string;
  note?: string;
};

export function TranslatePlayDemo({ compact = false }: { compact?: boolean }) {
  const [pairs, setPairs] = useState<PairMeta[]>([]);
  const [pairId, setPairId] = useState('en-sw');
  const [text, setText] = useState('');
  const [result, setResult] = useState<TranslateResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [chatLog, setChatLog] = useState<Array<{ role: 'user' | 'agent'; text: string; lang: string; voice: string }>>(
    [],
  );
  const { play, stop, playingId, loadingId, status, error } = useDemoPlayer();
  const bothActive = playingId === 'tr-source' || playingId === 'tr-target';
  const bothLoading = loadingId === 'tr-source' || loadingId === 'tr-target';

  useEffect(() => {
    void fetch('/api/demo/translate')
      .then((r) => r.json())
      .then((data: { pairs: PairMeta[] }) => {
        setPairs(data.pairs ?? []);
        const first = data.pairs?.[0];
        if (first) {
          setPairId(first.id);
          setText(first.text);
        }
      })
      .catch(() => undefined);
  }, []);

  const selected = pairs.find((p) => p.id === pairId) ?? pairs[0];

  const runTranslate = useCallback(async () => {
    if (!selected) return;
    setBusy(true);
    try {
      const res = await fetch('/api/demo/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, pairId: selected.id, source: selected.source, target: selected.target }),
      });
      const body = (await res.json()) as TranslateResult;
      setResult(body);
      setChatLog((prev) => [
        ...prev.slice(-4),
        { role: 'user', text: body.text, lang: body.sourceLang, voice: body.sourceVoice },
        { role: 'agent', text: body.translated, lang: body.targetLang, voice: body.targetVoice },
      ]);
      return body;
    } finally {
      setBusy(false);
    }
  }, [selected, text]);

  async function translateAndPlay() {
    const body = await runTranslate();
    if (!body) return;
    await play({
      id: 'tr-source',
      text: body.text,
      voiceId: body.sourceVoice,
      lang: body.sourceLang,
    });
    await play({
      id: 'tr-target',
      text: body.translated,
      voiceId: body.targetVoice,
      lang: body.targetLang,
    });
  }

  return (
    <div className={`mkt-translate-demo${compact ? ' mkt-translate-demo-compact' : ''}`}>
      <div className="mkt-tts-card-head">
        <h2>Translate &amp; play</h2>
        <span className="mkt-tts-badge">Realtime demo</span>
      </div>
      <label className="mkt-tts-label" htmlFor="mkt-tr-pair">
        Language pair
      </label>
      <select
        id="mkt-tr-pair"
        className="vl-input mkt-translate-select"
        value={pairId}
        onChange={(e) => {
          const next = pairs.find((p) => p.id === e.target.value);
          setPairId(e.target.value);
          if (next) {
            setText(next.text);
            setResult(null);
          }
        }}
      >
        {pairs.map((p) => (
          <option key={p.id} value={p.id}>
            {p.sourceLabel} → {p.targetLabel}
          </option>
        ))}
      </select>
      <label className="mkt-tts-label" htmlFor="mkt-tr-text">
        Source text
      </label>
      <textarea
        id="mkt-tr-text"
        className="mkt-tts-textarea"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={compact ? 3 : 4}
      />
      <div className="mkt-tts-actions">
        <button type="button" className="vl-btn vl-btn-primary" disabled={busy} onClick={() => void runTranslate()}>
          {busy ? 'Translating…' : 'Translate'}
        </button>
        <DemoPlayStopButton
          active={bothActive}
          loading={busy || bothLoading}
          disabled={busy}
          variant="secondary"
          label="Translate & play both"
          stopLabel="Stop"
          onStop={stop}
          onPlay={() => void translateAndPlay()}
        />
      </div>
      {result ? (
        <div className="mkt-translate-result">
          <div className="mkt-translate-result-row">
            <div>
              <p className="mkt-tts-label">
                {result.sourceLabel}
              </p>
              <p className="mkt-translate-copy">{result.text}</p>
              <DemoPlayStopButton
                active={playingId === 'tr-source'}
                loading={loadingId === 'tr-source'}
                variant="chip"
                label="Play source"
                stopLabel="Stop"
                onStop={stop}
                onPlay={() => {
                  void play({
                    id: 'tr-source',
                    text: result.text,
                    voiceId: result.sourceVoice,
                    lang: result.sourceLang,
                  });
                }}
              />
            </div>
            <div>
              <p className="mkt-tts-label">
                {result.targetLabel}
              </p>
              <p className="mkt-translate-copy">{result.translated}</p>
              <DemoPlayStopButton
                active={playingId === 'tr-target'}
                loading={loadingId === 'tr-target'}
                variant="chip"
                label="Play translation"
                stopLabel="Stop"
                onStop={stop}
                onPlay={() => {
                  void play({
                    id: 'tr-target',
                    text: result.translated,
                    voiceId: result.targetVoice,
                    lang: result.targetLang,
                  });
                }}
              />
            </div>
          </div>
          {result.note ? <p className="mkt-tts-hint">{result.note}</p> : null}
        </div>
      ) : null}

      {chatLog.length > 0 ? (
        <div className="mkt-fake-chat mkt-chat-demo" style={{ marginTop: '1rem' }}>
          <div className="mkt-fake-ui-bar">Translate chat · play each turn</div>
          {chatLog.map((turn, i) => (
            <div
              key={`${turn.role}-${i}`}
              className={`mkt-chat-row${turn.role === 'agent' ? ' mkt-chat-row-agent' : ''}`}
            >
              <div className={turn.role === 'user' ? 'mkt-chat-bubble mkt-chat-user' : 'mkt-chat-bubble mkt-chat-agent'}>
                {turn.text}
              </div>
              <DemoPlayStopButton
                active={playingId === `tr-chat-${i}`}
                loading={loadingId === `tr-chat-${i}`}
                variant="icon"
                label="Play"
                stopLabel="Stop"
                ariaLabel={
                  playingId === `tr-chat-${i}` || loadingId === `tr-chat-${i}`
                    ? 'Stop turn'
                    : 'Play turn'
                }
                onStop={stop}
                onPlay={() => {
                  const id = `tr-chat-${i}`;
                  void play({ id, text: turn.text, voiceId: turn.voice, lang: turn.lang });
                }}
              />
            </div>
          ))}
        </div>
      ) : null}

      <p className="mkt-tts-hint" role="status" aria-live="polite">
        {error ?? status ?? 'Translate, then play source and target — or play turns in the chat.'}
      </p>
    </div>
  );
}
