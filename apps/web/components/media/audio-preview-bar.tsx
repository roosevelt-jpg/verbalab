'use client';

import { useEffect, useRef, useState } from 'react';
import { DemoPlayStopButton } from '@/components/media/demo-play-stop-button';

/**
 * Play / Stop icon controls wired to an HTMLAudioElement for console / studio previews.
 * Keeps native controls as a progressive-enhancement fallback.
 */
export function AudioPreviewBar({
  src,
  label = 'Play preview',
  showNative = true,
}: {
  src: string;
  label?: string;
  showNative?: boolean;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPlaying(false);
    setLoading(false);
    setError(null);
    const el = audioRef.current;
    if (el) {
      el.pause();
      el.currentTime = 0;
    }
  }, [src]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    const onPlay = () => {
      setPlaying(true);
      setLoading(false);
    };
    const onPause = () => setPlaying(false);
    const onEnded = () => {
      setPlaying(false);
      setLoading(false);
    };
    const onWaiting = () => setLoading(true);
    const onCanPlay = () => setLoading(false);
    const onError = () => {
      setPlaying(false);
      setLoading(false);
      setError('Playback failed');
    };

    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);
    el.addEventListener('ended', onEnded);
    el.addEventListener('waiting', onWaiting);
    el.addEventListener('canplay', onCanPlay);
    el.addEventListener('error', onError);
    return () => {
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
      el.removeEventListener('ended', onEnded);
      el.removeEventListener('waiting', onWaiting);
      el.removeEventListener('canplay', onCanPlay);
      el.removeEventListener('error', onError);
    };
  }, [src]);

  async function play() {
    const el = audioRef.current;
    if (!el) return;
    setError(null);
    setLoading(true);
    try {
      el.currentTime = 0;
      await el.play();
    } catch {
      setLoading(false);
      setPlaying(false);
      setError('Playback failed');
    }
  }

  function stop() {
    const el = audioRef.current;
    if (!el) return;
    el.pause();
    el.currentTime = 0;
    setPlaying(false);
    setLoading(false);
  }

  return (
    <div className="lg-audio-preview-bar">
      <div className="lg-audio-preview-bar__controls">
        <DemoPlayStopButton
          active={playing}
          loading={loading}
          onPlay={() => void play()}
          onStop={stop}
          label={label}
          stopLabel="Stop"
          variant="primary"
        />
        {error ? (
          <p className="lg-audio-preview-bar__status" role="alert">
            {error}
          </p>
        ) : null}
      </div>
      <audio
        ref={audioRef}
        src={src}
        controls={showNative}
        preload="metadata"
        style={showNative ? { width: '100%' } : { display: 'none' }}
      />
    </div>
  );
}
