/**
 * Compatibility layer: console surfaces still import SITE_CONTENT.
 * Source of truth is the CMS document (defaults + cms-store.json overrides).
 */
import { CMS_DEFAULTS } from './cms-defaults';
import type { CmsDocument } from './cms-types';

export type ProductCard = {
  id: string;
  name: string;
  body: string;
  href: string;
  art: 'voice' | 'speech' | 'translate' | 'agents' | 'api' | 'coverage';
};

export type AgentTemplate = CmsDocument['console']['agentTemplates'][number];
export type SampleVoice = CmsDocument['console']['sampleVoices'][number];
export type HubCatalogItem = CmsDocument['console']['hubDefaults']['items'][number];

export type SiteContent = {
  brand: CmsDocument['brand'];
  hero: {
    eyebrow: string;
    brand: string;
    headline: string;
    lead: string;
    primaryCta: { label: string; href: string };
    secondaryCta: { label: string; href: string };
  };
  products: ProductCard[];
  samplePrompts: CmsDocument['console']['samplePrompts'];
  sampleVoices: SampleVoice[];
  agentTemplates: AgentTemplate[];
  apiSnippets: CmsDocument['console']['apiSnippets'];
  safety: { title: string; body: string }[];
  dashboardWelcome: CmsDocument['console']['dashboardWelcome'];
  docsIntro: CmsDocument['console']['docsIntro'];
  playgroundDefaults: CmsDocument['console']['playgroundDefaults'];
  hubDefaults: CmsDocument['console']['hubDefaults'];
  social: { label: string; href: string }[];
};

function toSiteContent(doc: CmsDocument): SiteContent {
  return {
    brand: doc.brand,
    hero: {
      eyebrow: doc.hero.eyebrow,
      brand: doc.hero.brand,
      headline: doc.hero.headline,
      lead: doc.hero.lead,
      primaryCta: doc.hero.primaryCta,
      secondaryCta: doc.hero.secondaryCta,
    },
    products: doc.products.items.map((p) => ({
      id: p.id,
      name: p.name,
      body: p.body,
      href: p.href,
      art: p.art,
    })),
    samplePrompts: doc.console.samplePrompts,
    sampleVoices: doc.console.sampleVoices,
    agentTemplates: doc.console.agentTemplates,
    apiSnippets: doc.console.apiSnippets,
    safety: doc.safety.items,
    dashboardWelcome: doc.console.dashboardWelcome,
    docsIntro: doc.console.docsIntro,
    playgroundDefaults: doc.console.playgroundDefaults,
    hubDefaults: doc.console.hubDefaults,
    social: doc.footer.columns.find((c) => c.id === 'socials')?.links ?? [],
  };
}

/** Synchronous defaults for client components that cannot await CMS. */
export const SITE_CONTENT: SiteContent = toSiteContent(CMS_DEFAULTS);

/** Per-hub lede overrides keyed by route segment (e.g. trust-cloud). */
export const HUB_LEDES: Record<string, string> = {
  'agentops-platform':
    'Operate speaking-agent fleets: run health, turn quality, and permission audits for multilingual voice agents.',
  'agent-runtime':
    'Sandbox agents with hard permission allowlists — the runtime layer behind Lugemi speaking agents.',
  'agent-operating-system':
    'Unify agent lifecycle, memory, and voice I/O so developers ship talk-ready agents in every language.',
  'agent-marketplace':
    'Discover and license agent templates tuned for African languages, accents, and cultural contexts.',
  voice:
    'Voice FAQ agents that speak and listen — bilingual demo path with STT, FAQ model, and TTS.',
  'voice-studio':
    'Craft lexemes, presets, and region-aware voices for agents that sound native to their audience.',
  'neural-tts':
    'Neural TTS for own:* voices — Africa-first accents with cultural metadata on every render.',
  speech:
    'Speech Cloud hub: STT, TTS, interpreter, and voice studio for speaking-agent pipelines.',
  'trust-cloud':
    'Safety, privacy, and compliance controls for generative speech and speaking agents.',
  coverage:
    'Registry and evaluated pairs — Africa-first catalog with honest per-task availability.',
};
