'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { DemoPlayStopButton } from '@/components/media/demo-play-stop-button';
import { playDemoSpeech, stopDemoSpeech } from '@/lib/demo-speech';

export function useDemoPlayer() {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
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
      setLoadingId(input.id);
      setStatus('Loading…');
      try {
        const result = await playDemoSpeech({
          text: input.text,
          voiceId: input.voiceId,
          lang: input.lang,
          label: input.label,
          onStarted: () => {
            if (token !== gen.current) return;
            setLoadingId(null);
            setStatus('Playing…');
          },
        });
        if (token !== gen.current) return;
        setStatus(`Played with a Lugemi native voice · ${result.profile.label}`);
      } catch (err) {
        if (token !== gen.current) return;
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Playback failed');
        setStatus(null);
      } finally {
        if (token === gen.current) {
          setPlayingId(null);
          setLoadingId(null);
        }
      }
    },
    [],
  );

  const stop = useCallback(() => {
    gen.current += 1;
    stopDemoSpeech();
    setPlayingId(null);
    setLoadingId(null);
    setStatus('Stopped');
  }, []);

  return {
    play,
    stop,
    playingId,
    loadingId,
    status,
    error,
    isPlaying: playingId !== null,
    isLoading: loadingId !== null,
  };
}

export function VoicePlayButton({
  text,
  voiceId,
  lang,
  label,
  id,
  className,
  children,
  variant = 'primary',
}: {
  text: string;
  voiceId?: string;
  lang?: string;
  label?: string;
  id?: string;
  className?: string;
  children?: React.ReactNode;
  variant?: 'icon' | 'chip' | 'primary' | 'secondary';
}) {
  const { play, stop, playingId, loadingId } = useDemoPlayer();
  const btnId = id ?? `play-${voiceId ?? 'default'}-${text.slice(0, 12)}`;
  const active = playingId === btnId;
  const loading = loadingId === btnId;
  const labelText = typeof children === 'string' ? children : 'Play';

  return (
    <DemoPlayStopButton
      active={active}
      loading={loading}
      className={className}
      variant={variant}
      label={labelText}
      stopLabel="Stop"
      ariaLabel={active || loading ? 'Stop playback' : `Play ${label ?? labelText}`}
      onStop={stop}
      onPlay={() => {
        void play({ id: btnId, text, voiceId, lang, label });
      }}
    />
  );
}
