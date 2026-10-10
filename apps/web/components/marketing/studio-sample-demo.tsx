'use client';

import { useState } from 'react';
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
  const [script, setScript] = useState(sample);
  // Each chip speaks a line written in that language, never the English draft read with a foreign accent.
  // Only demo-safe languages (eSpeak/neural). Yoruba/Zulu stay catalogued but off demos until weights publish.
  const chipVoice: Record<string, { voiceId: string; lang: string; text: string }> = {
    English: { voiceId: 'en-ng-female', lang: 'en-NG', text: sample },
    Swahili: {
      voiceId: 'amara',
      lang: 'sw-KE',
      text: 'Habari — chapa yako inaweza kuzungumza na wateja kwa Kiswahili na Kifaransa kutoka rasimu moja.',
    },
    Afrikaans: {
      voiceId: 'af-za-female',
      lang: 'af-ZA',
      text: 'Goeiedag — jou handelsmerk kan met kliënte praat in Swahili, Afrikaans en Frans vanaf een konsep.',
    },
    French: {
      voiceId: 'fr-fr-female',
      lang: 'fr-FR',
      text: 'Bonjour — votre marque peut parler à vos clients en swahili, en afrikaans et en français à partir d’un seul brouillon.',
    },
    Amharic: {
      voiceId: 'am-et-female',
      lang: 'am-ET',
      text: 'ሰላም — የእርስዎ ብራንድ ከአንድ ረቂቅ ብቻ ደንበኞችን በስዋሂሊ፣ በአፍሪካንስ እና በፈረንሳይኛ ማነጋገር ይችላል።',
    },
  };

  return (
    <div className="mkt-fake-ui mkt-studio-demo">
      <div className="mkt-fake-ui-bar">Studio sample</div>
      <p className="mkt-fake-ui-script">{script}</p>
      <div className="mkt-fake-chips">
        {chips.map((chip, i) => {
          const meta = chipVoice[chip] ?? { voiceId: 'en-ng-female', lang: 'en-NG', text: sample };
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
                setScript(meta.text);
                void play({
                  id,
                  text: meta.text,
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
            setScript(sample);
            void play({
              id: 'studio-main',
              text: sample,
              voiceId: 'abe',
              lang: 'en-NG',
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
