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

const VOICE_DEMO_SLUGS = new Set([
  'lugemi-voice',
  'lugemi-studio',
  'creative',
  'text-to-speech',
  'voice-changer',
  'voice-cloning',
  'voice-isolator',
  'voice-design',
  'ai-voice-generator',
  'ai-music-generator',
  'text-to-sound-effects',
  'ads-engine',
  'dubbing',
  'ai-video-generator',
  'ai-image-generator',
]);

const AGENT_DEMO_SLUGS = new Set([
  'lugemi-agents',
  'trade',
  'customer-experience',
  'voice-agents',
  'conversational-ai',
  'telecommunications',
  'financial-services',
  'healthcare',
  'government',
  'technology',
  'retail',
  'travel',
  'customer-support',
  'chatbots',
  'integrations',
]);

const TRANSLATE_DEMO_SLUGS = new Set([
  'lugemi-translate',
  'education',
  'translate-api',
  'dubbing-api',
  'openapi-explorer',
  'marketplace',
  'enterprise',
  'trust-center',
]);

const API_DEMO_SLUGS = new Set([
  'lugemi-api',
  'agents-api',
  'speech-engine',
  'tts-api',
  'stt-api',
  'sound-effects-api',
  'music-api',
  'ios-sdk',
  'android-sdk',
  'api-key',
]);

/** Interactive demos injected on CMS marketing pages by slug. */
export function CmsPageDemos({ slug }: { slug: string }) {
  if (VOICE_DEMO_SLUGS.has(slug)) {
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

  if (AGENT_DEMO_SLUGS.has(slug)) {
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

  if (TRANSLATE_DEMO_SLUGS.has(slug)) {
    return (
      <div className="mkt-page-demos">
        <TranslatePlayDemo />
      </div>
    );
  }

  if (slug === 'lugemi-speech' || slug === 'speech-to-text') {
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

  if (API_DEMO_SLUGS.has(slug)) {
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
