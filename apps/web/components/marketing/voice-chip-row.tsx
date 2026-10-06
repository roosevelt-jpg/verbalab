'use client';

import { useDemoPlayer } from './use-demo-player';

export function VoiceChipRow({
  voices,
}: {
  voices: Array<{ id: string; label: string; sample?: string; lang?: string }>;
}) {
  const { play, stop, playingId } = useDemoPlayer();

  return (
    <div className="mkt-voice-play-row">
      {voices.map((v) => {
        const sample =
          v.sample ??
          `Hello from ${v.label}. This is a Lugemi voice preview for speaking agents.`;
        const active = playingId === `chip-${v.id}`;
        return (
          <button
            key={v.id}
            type="button"
            className={active ? 'mkt-voice-chip is-active' : 'mkt-voice-chip'}
            aria-pressed={active}
            onClick={() => {
              if (active) {
                stop();
                return;
              }
              void play({
                id: `chip-${v.id}`,
                text: sample,
                voiceId: v.id,
                lang: v.lang,
                label: v.label,
              });
            }}
          >
            {active ? `▶ ${v.label}` : `▶ ${v.label}`}
          </button>
        );
      })}
    </div>
  );
}
