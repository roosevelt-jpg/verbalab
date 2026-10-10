'use client';

import { DemoPlayStopButton } from '@/components/media/demo-play-stop-button';
import { useDemoPlayer } from './use-demo-player';

export function VoiceChipRow({
  voices,
}: {
  voices: Array<{ id: string; label: string; sample?: string; lang?: string }>;
}) {
  const { play, stop, playingId, loadingId, status, error } = useDemoPlayer();

  return (
    <div className="mkt-voice-play-row">
      {voices.map((v) => {
        const sample =
          v.sample ??
          `Hello from ${v.label}. This is a Lugemi voice preview for speaking agents.`;
        const id = `chip-${v.id}`;
        const active = playingId === id;
        const loading = loadingId === id;
        return (
          <DemoPlayStopButton
            key={v.id}
            active={active}
            loading={loading}
            variant="chip"
            label={v.label}
            stopLabel={v.label}
            ariaLabel={active || loading ? `Stop ${v.label}` : `Play ${v.label}`}
            onStop={stop}
            onPlay={() => {
              void play({
                id,
                text: sample,
                voiceId: v.id,
                lang: v.lang,
                label: v.label,
              });
            }}
          />
        );
      })}
      {error || status ? (
        <p className="mkt-tts-hint" role="status" aria-live="polite" style={{ flexBasis: '100%' }}>
          {error ?? status}
        </p>
      ) : null}
    </div>
  );
}
