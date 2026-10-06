'use client';

import { AgentChatDemo } from '@/components/marketing/agent-chat-demo';
import { HeroTtsCard } from '@/components/marketing/hero-tts-card';
import { TranslatePlayDemo } from '@/components/marketing/translate-play-demo';
import { VoiceChipRow } from '@/components/marketing/voice-chip-row';
import { CMS_DEFAULTS } from '@/data/cms-defaults';

const SAMPLE_VOICES = CMS_DEFAULTS.console.sampleVoices.map((v) => ({
  id: v.id,
  label: v.label,
  sample: `Habari — ${v.label}. ${v.ethnicContext}.`,
  lang:
    v.id.startsWith('sw')
      ? 'sw'
      : v.id.startsWith('yo')
        ? 'yo'
        : v.id.startsWith('am')
          ? 'am'
          : v.id.startsWith('zu')
            ? 'zu'
            : v.id.startsWith('ar')
              ? 'ar-EG'
              : v.id.startsWith('fr')
                ? 'fr-FR'
                : 'en-US',
}));

/** Interactive demos injected on CMS marketing pages by slug. */
export function CmsPageDemos({ slug }: { slug: string }) {
  if (slug === 'lugemi-voice' || slug === 'lugemi-studio' || slug === 'creative') {
    return (
      <div className="mkt-page-demos">
        <HeroTtsCard demo={CMS_DEFAULTS.hero.demo} />
        <div style={{ marginTop: '1.25rem' }}>
          <p className="mkt-tts-label">Try region voices</p>
          <VoiceChipRow voices={SAMPLE_VOICES} />
        </div>
      </div>
    );
  }

  if (slug === 'lugemi-agents' || slug === 'trade' || slug === 'customer-experience') {
    return (
      <div className="mkt-page-demos">
        <AgentChatDemo
          title="Agent transcript · East Africa trade desk"
          userText="Habari — naweza kupata bei za usafirishaji?"
          agentText="Karibu. Ninaweza kukusaidia na bei, malipo, na ratiba ya usafirishaji."
        />
      </div>
    );
  }

  if (slug === 'lugemi-translate' || slug === 'education') {
    return (
      <div className="mkt-page-demos">
        <TranslatePlayDemo />
      </div>
    );
  }

  if (slug === 'lugemi-speech') {
    return (
      <div className="mkt-page-demos">
        <AgentChatDemo
          title="Speech → agent reply"
          userText="Habari, naomba msaada kwa lugha yangu."
          agentText="Karibu. Ninaweza kusikiliza na kujibu kwa Kiswahili au Kiingereza."
          userVoiceId="user"
          agentVoiceId="amara"
        />
        <div style={{ marginTop: '1.25rem' }}>
          <VoiceChipRow voices={SAMPLE_VOICES.slice(0, 4)} />
        </div>
      </div>
    );
  }

  if (slug === 'lugemi-api') {
    return (
      <div className="mkt-page-demos">
        <TranslatePlayDemo compact />
      </div>
    );
  }

  if (slug === 'research' || slug === 'about' || slug === 'updates') {
    return (
      <div className="mkt-page-demos">
        <TranslatePlayDemo compact />
        <div style={{ marginTop: '1.25rem' }}>
          <p className="mkt-tts-label">Sample Africa-first voices</p>
          <VoiceChipRow voices={SAMPLE_VOICES.slice(0, 4)} />
        </div>
      </div>
    );
  }

  if (slug === 'safety' || slug === 'policies') {
    return (
      <div className="mkt-page-demos">
        <AgentChatDemo
          title="Disclosure-aware speaking turn"
          userText="Can you repeat that in Twi for my customer?"
          agentText="Aane — me bɛka bio wɔ Twi mu. Generated speech stays labeled when it could be mistaken for a live person."
          userVoiceId="user"
          agentVoiceId="abe"
        />
      </div>
    );
  }

  return null;
}
