'use client';

import { useMemo, useState } from 'react';
import type { CmsHeroDemo, CmsHeroDemoVoice } from '@/data/cms-types';
import { DemoPlayStopButton } from '@/components/media/demo-play-stop-button';
import { resolveVoiceDemoScript } from '@/lib/native-demo-scripts';
import { useDemoPlayer } from './use-demo-player';

function voiceMeta(voice: CmsHeroDemoVoice | undefined): { lang: string; text: string } {
  if (!voice) return resolveVoiceDemoScript(undefined);
  if (voice.sampleText?.trim() && voice.lang?.trim()) {
    return { lang: voice.lang, text: voice.sampleText };
  }
  const resolved = resolveVoiceDemoScript(voice.id);
  return {
    lang: voice.lang?.trim() || resolved.lang,
    text: voice.sampleText?.trim() || resolved.text,
  };
}

export function HeroTtsCard({ demo }: { demo: CmsHeroDemo }) {
  const initialVoice = demo.voices[0];
  const initial = voiceMeta(initialVoice);
  const [voice, setVoice] = useState(initialVoice?.id ?? '');
  const [text, setText] = useState(initial.text || demo.defaultText);
  const { play, stop, playingId, loadingId, status, error } = useDemoPlayer();

  const selected = useMemo(
    () => demo.voices.find((item) => item.id === voice),
    [demo.voices, voice],
  );
  const meta = voiceMeta(selected);
  const mainActive = playingId === 'hero-tts';
  const mainLoading = loadingId === 'hero-tts';
  const previewId = `hero-voice-${voice}`;
  const previewActive = playingId === previewId;
  const previewLoading = loadingId === previewId;

  function selectVoice(nextId: string) {
    const next = demo.voices.find((item) => item.id === nextId);
    const nextMeta = voiceMeta(next);
    setVoice(nextId);
    // Always swap to the native sample for that language — never keep one English draft.
    setText(nextMeta.text);
  }

  return (
    <div className="mkt-tts-card">
      <div className="mkt-tts-card-head">
        <h2>{demo.title}</h2>
        <span className="mkt-tts-badge">{demo.badge}</span>
      </div>
      <label className="mkt-tts-label" htmlFor="mkt-tts-text">
        Script
      </label>
      <textarea
        id="mkt-tts-text"
        className="mkt-tts-textarea"
        value={text}
        onChange={(event) => setText(event.target.value)}
        rows={5}
        spellCheck
      />
      <fieldset className="mkt-tts-voices">
        <legend className="mkt-tts-label">Voice</legend>
        <div className="mkt-voice-chips">
          {demo.voices.map((item) => (
            <button
              key={item.id}
              type="button"
              className={item.id === voice ? 'mkt-voice-chip is-active' : 'mkt-voice-chip'}
              aria-pressed={item.id === voice}
              onClick={() => selectVoice(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="mkt-tts-actions">
        <DemoPlayStopButton
          active={mainActive}
          loading={mainLoading}
          variant="primary"
          label="Play"
          stopLabel="Stop"
          onStop={stop}
          onPlay={() => {
            void play({
              id: 'hero-tts',
              text: text || meta.text,
              voiceId: voice,
              lang: meta.lang,
              label: selected?.label,
            });
          }}
        />
        <DemoPlayStopButton
          active={previewActive}
          loading={previewLoading}
          disabled={!selected}
          variant="secondary"
          label="Preview voice"
          stopLabel="Stop"
          onStop={stop}
          onPlay={() => {
            // Preview voice always uses the native sample for that language.
            void play({
              id: previewId,
              text: meta.text,
              voiceId: voice,
              lang: meta.lang,
              label: selected?.label,
              forceNative: true,
            });
          }}
        />
        <p className="mkt-tts-hint" role="status" aria-live="polite">
          {error ??
            status ??
            `Press Play to hear this script in ${selected?.label ?? 'the selected voice'} (${meta.lang}).`}
        </p>
      </div>
    </div>
  );
}
