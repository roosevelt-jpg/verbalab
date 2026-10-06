/** Shared CMS types for Lugemi marketing + site pages. */

export type CmsLink = { label: string; href: string };

export type CmsMedia = {
  imageUrl?: string;
  videoUrl?: string;
  alt?: string;
};

export type CmsNavLink = CmsLink & { external?: boolean };

export type CmsProductCard = {
  id: string;
  tag: string;
  name: string;
  body: string;
  href: string;
  art: 'voice' | 'speech' | 'translate' | 'agents' | 'api' | 'coverage';
  media?: CmsMedia;
};

export type CmsUseCase = {
  title: string;
  body: string;
  tone: 'gold' | 'blue' | 'rose' | 'teal' | 'green' | 'violet';
  art: 'voice' | 'speech' | 'translate' | 'agents' | 'api' | 'coverage';
  media?: CmsMedia;
};

export type CmsShipWay = {
  title: string;
  body: string;
  tags: string[];
  href: string;
};

export type CmsFeature = { title: string; body: string; media?: CmsMedia };

export type CmsSectionBlock = {
  kicker: string;
  title: string;
  lede: string;
};

export type CmsPageSection = {
  id: string;
  title: string;
  body: string;
  media?: CmsMedia;
};

export type CmsPage = {
  slug: string;
  title: string;
  eyebrow?: string;
  lead: string;
  body: string;
  media?: CmsMedia;
  sections?: CmsPageSection[];
  primaryCta?: CmsLink;
  secondaryCta?: CmsLink;
  showInFooter?: boolean;
  footerColumn?: string;
};

export type CmsFooterColumn = {
  id: string;
  title: string;
  links: CmsLink[];
};

export type CmsHeroDemo = {
  title: string;
  badge: string;
  defaultText: string;
  playHint: string;
  voices: { id: string; label: string }[];
};

export type CmsDocument = {
  version: number;
  updatedAt: string;
  brand: {
    name: string;
    domain: string;
    tagline: string;
    positioning: string;
  };
  nav: {
    centerLinks: CmsNavLink[];
    actions: {
      console: CmsLink;
      login: CmsLink;
      signup: CmsLink;
    };
  };
  hero: {
    eyebrow: string;
    brand: string;
    headline: string;
    lead: string;
    primaryCta: CmsLink;
    secondaryCta: CmsLink;
    media?: CmsMedia;
    demo: CmsHeroDemo;
  };
  languageBar: { languages: string[] };
  products: CmsSectionBlock & { items: CmsProductCard[] };
  useCases: CmsSectionBlock & { items: CmsUseCase[] };
  hubs: CmsSectionBlock & { items: CmsShipWay[] };
  creative: CmsSectionBlock & {
    features: CmsFeature[];
    moduleTitle: string;
    moduleBody: string;
    moduleCta: CmsLink;
    studioSample: string;
    languageChips: string[];
    media?: CmsMedia;
  };
  agents: CmsSectionBlock & {
    features: CmsFeature[];
    moduleTitle: string;
    moduleBody: string;
    moduleCta: CmsLink;
    transcriptTitle: string;
    transcriptUser: string;
    transcriptAgent: string;
    media?: CmsMedia;
  };
  api: CmsSectionBlock & {
    tabs: CmsLink[];
    primaryCta: CmsLink;
    secondaryCta: CmsLink;
    snippet: string;
  };
  impact: CmsSectionBlock & { items: CmsFeature[] };
  research: CmsSectionBlock & {
    items: { year: string; title: string; body: string }[];
    cta: CmsLink;
  };
  safety: CmsSectionBlock & { items: CmsFeature[] };
  updates: CmsSectionBlock & { items: CmsFeature[] };
  banner: {
    title: string;
    body: string;
    primaryCta: CmsLink;
    secondaryCta: CmsLink;
  };
  footer: {
    mission: string;
    columns: CmsFooterColumn[];
    copyright: string;
    metaNote: string;
    supportFab: CmsLink;
  };
  mediaLibrary: {
    id: string;
    label: string;
    kind: 'image' | 'video';
    url: string;
    alt?: string;
  }[];
  pages: CmsPage[];
  /** Console / hub defaults still editable from Admin */
  console: {
    dashboardWelcome: {
      title: string;
      lead: string;
      starterCards: { title: string; body: string; href: string }[];
    };
    docsIntro: { title: string; lead: string };
    playgroundDefaults: { text: string; source: string; target: string };
    hubDefaults: {
      catalogTitle: string;
      catalogLead: string;
      items: { id: string; title: string; body: string }[];
    };
    samplePrompts: { id: string; label: string; text: string; language: string }[];
    sampleVoices: {
      id: string;
      label: string;
      language: string;
      region: string;
      ethnicContext: string;
      voiceId: string;
    }[];
    agentTemplates: {
      id: string;
      name: string;
      language: string;
      accent: string;
      culturalContext: string;
      script: string;
      goal: string;
    }[];
    apiSnippets: { speech: string; translate: string; agentSimulate: string };
  };
};
