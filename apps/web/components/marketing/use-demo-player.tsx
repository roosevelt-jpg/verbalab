'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { DemoPlayStopButton } from '@/components/media/demo-play-stop-button';
import { pauseDemoSpeech, playDemoSpeech, stopDemoSpeech } from '@/lib/demo-speech';
import { resolveDemoPreview } from '@/lib/native-demo-scripts';
import { loadStudioApiKeySecret } from '@/lib/studio-api-key';

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
      text?: string;
      voiceId?: string;
      lang?: string;
      label?: string;
      /**
       * When true, ignore caller text and speak the native sample for the
       * voice language. Use for voice-library previews — not for translate/
       * chat turns that already have language-true copy.
       */
      forceNative?: boolean;
      /** Optional Clerk JWT; applied Studio machine key wins when present. */
      token?: string | null;
    }) => {
      const token = ++gen.current;
      stopDemoSpeech();
      setError(null);
      setPlayingId(input.id);
      setLoadingId(input.id);
      setStatus('Loading…');
      try {
        const machineKey = loadStudioApiKeySecret() || null;
        const preview = resolveDemoPreview({
          voiceId: input.voiceId,
          lang: input.lang,
          text: input.text,
          forceNative: input.forceNative === true || !input.text?.trim(),
        });
        const result = await playDemoSpeech({
          text: preview.text,
          voiceId: preview.voiceId,
          lang: preview.lang,
          label: input.label,
          token: machineKey || input.token || null,
          onStarted: () => {
            if (token !== gen.current) return;
            setLoadingId(null);
            setStatus('Playing…');
          },
        });
        // Hard stop + short gap so the next clip (to-language) never overlaps.
        stopDemoSpeech();
        await pauseDemoSpeech(300);
        if (token !== gen.current) return;
        const quality =
          result.mode === 'neural'
            ? 'neural Echo'
            : result.mode === 'studio'
              ? 'Studio Echo'
              : 'Echo';
        const via =
          result.speechEngine === 'native_speech_engine' || result.mode === 'server'
            ? 'Native Speech Engine'
            : quality;
        const remap = result.remapped
          ? ` · remapped from ${result.requestedVoice ?? 'requested pack'} (native L1 weights not live)`
          : '';
        setStatus(`Played via ${via} · ${result.profile.label}${remap}`);
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
  forceNative = true,
}: {
  text?: string;
  voiceId?: string;
  lang?: string;
  label?: string;
  id?: string;
  className?: string;
  children?: React.ReactNode;
  variant?: 'icon' | 'chip' | 'primary' | 'secondary';
  /** Default true: preview always speaks the native sample for the voice. */
  forceNative?: boolean;
}) {
  const { play, stop, playingId, loadingId } = useDemoPlayer();
  const preview = resolveDemoPreview({ voiceId, lang, text, forceNative });
  const btnId = id ?? `play-${voiceId ?? 'default'}-${preview.text.slice(0, 12)}`;
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
        void play({
          id: btnId,
          text: preview.text,
          voiceId: preview.voiceId,
          lang: preview.lang,
          label,
          forceNative,
        });
      }}
    />
  );
}
