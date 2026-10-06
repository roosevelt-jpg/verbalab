'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { playDemoSpeech, stopDemoSpeech } from '@/lib/demo-speech';

export function useDemoPlayer() {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const gen = useRef(0);

  useEffect(() => () => stopDemoSpeech(), []);

  const play = useCallback(
    async (input: {
      id: string;
      text: string;
      voiceId?: string;
      lang?: string;
      label?: string;
    }) => {
      const token = ++gen.current;
      stopDemoSpeech();
      setError(null);
      setPlayingId(input.id);
      setStatus('Playing…');
      try {
        const result = await playDemoSpeech({
          text: input.text,
          voiceId: input.voiceId,
          lang: input.lang,
          label: input.label,
        });
        if (token !== gen.current) return;
        setStatus(
          result.mode === 'server'
            ? `Played with Lugemi demo TTS · ${result.profile.label}`
            : `Played in browser · ${result.profile.label} (${result.profile.lang})`,
        );
      } catch (err) {
        if (token !== gen.current) return;
        setError(err instanceof Error ? err.message : 'Playback failed');
        setStatus(null);
      } finally {
        if (token === gen.current) setPlayingId(null);
      }
    },
    [],
  );

  const stop = useCallback(() => {
    gen.current += 1;
    stopDemoSpeech();
    setPlayingId(null);
    setStatus('Stopped');
  }, []);

  return { play, stop, playingId, status, error, isPlaying: playingId !== null };
}

export function VoicePlayButton({
  text,
  voiceId,
  lang,
  label,
  id,
  className = 'vl-btn vl-btn-primary',
  children,
  size = 'md',
}: {
  text: string;
  voiceId?: string;
  lang?: string;
  label?: string;
  id?: string;
  className?: string;
  children?: React.ReactNode;
  size?: 'sm' | 'md';
}) {
  const { play, stop, playingId, isPlaying } = useDemoPlayer();
  const btnId = id ?? `play-${voiceId ?? 'default'}-${text.slice(0, 12)}`;
  const active = playingId === btnId;

  return (
    <button
      type="button"
      className={className}
      style={size === 'sm' ? { padding: '0.35rem 0.75rem', fontSize: '0.85rem' } : undefined}
      aria-pressed={active}
      onClick={() => {
        if (active || (isPlaying && playingId === btnId)) {
          stop();
          return;
        }
        void play({ id: btnId, text, voiceId, lang, label });
      }}
    >
      {active ? 'Stop' : (children ?? 'Play')}
    </button>
  );
}
