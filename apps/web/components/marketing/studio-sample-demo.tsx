'use client';

import { DemoPlayStopButton } from '@/components/media/demo-play-stop-button';
import { useDemoPlayer } from './use-demo-player';

export function StudioSampleDemo({
  sample,
  chips,
}: {
  sample: string;
  chips: string[];
}) {
  const { play, stop, playingId, loadingId, status, error } = useDemoPlayer();
  const chipVoice: Record<string, { voiceId: string; lang: string }> = {
    English: { voiceId: 'abe', lang: 'en-US' },
    Swahili: { voiceId: 'amara', lang: 'sw' },
    Yoruba: { voiceId: 'yo-ng-male', lang: 'yo' },
    French: { voiceId: 'fr-sn-female', lang: 'fr-FR' },
    Amharic: { voiceId: 'am-et-female', lang: 'am' },
  };

  return (
    <div className="mkt-fake-ui mkt-studio-demo">
      <div className="mkt-fake-ui-bar">Studio sample</div>
      <p className="mkt-fake-ui-script">{sample}</p>
      <div className="mkt-fake-chips">
        {chips.map((chip, i) => {
          const meta = chipVoice[chip] ?? { voiceId: 'amara', lang: 'en-US' };
          const id = `studio-${chip}`;
          const active = playingId === id;
          const loading = loadingId === id;
          return (
            <DemoPlayStopButton
              key={chip}
              active={active}
              loading={loading}
              variant="chip"
              className={active || i === 1 ? 'is-on' : undefined}
              label={chip}
              stopLabel={chip}
              ariaLabel={active || loading ? `Stop ${chip}` : `Play ${chip}`}
              onStop={stop}
              onPlay={() => {
                void play({
                  id,
                  text: sample,
                  voiceId: meta.voiceId,
                  lang: meta.lang,
                  label: chip,
                });
              }}
            />
          );
        })}
      </div>
      <div className="mkt-tts-actions" style={{ marginTop: 12 }}>
        <DemoPlayStopButton
          active={playingId === 'studio-main'}
          loading={loadingId === 'studio-main'}
          variant="primary"
          label="Play sample"
          stopLabel="Stop"
          onStop={stop}
          onPlay={() => {
            void play({
              id: 'studio-main',
              text: sample,
              voiceId: 'amara',
              lang: 'sw',
            });
          }}
        />
        <p className="mkt-tts-hint" role="status" aria-live="polite">
          {error ?? status ?? 'Tap a language chip or Play sample to hear the studio draft.'}
        </p>
      </div>
    </div>
  );
}
