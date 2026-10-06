/** Application ports for Language Cloud. Implemented by Nest service adapters. */

export type AuthContext = {
  organizationId: string;
  workspaceId: string;
  apiKeyId?: string;
  userId?: string;
  ip?: string;
};

export type LanguageRow = {
  code: string;
  nameEn: string;
  nameNative: string | null;
  script: string | null;
  familyCode?: string | null;
  rtl: boolean;
  tier: string;
};

export type DialectRow = {
  code: string;
  languageCode: string;
  nameEn: string;
  region: string | null;
  cueTerms: string[];
};

export type AccentRow = {
  code: string;
  languageCode: string;
  nameEn: string;
  region: string | null;
  relatedDialectCode: string | null;
};

export type LocaleRow = {
  languageCode: string;
  bcp47: string | null;
  currencyCode: string | null;
  culturalNotes: string | null;
};

export type CountryRow = {
  code: string;
  nameEn: string;
  region: string | null;
  currencyCode: string | null;
  primaryLanguages: string[];
  bcp47Tags: string[];
};

export type StyleProfileRow = {
  id: string;
  name: string;
  description: string;
};

export type DialectDetectResult = {
  language: string;
  dialect: string | null;
  dialectName: string | null;
  confidence: number;
  provider: string;
  note: string;
};

export type GrammarCheckResult = {
  language: string;
  corrected: string;
  changed: boolean;
  issueCount: number;
  provider: string;
  note: string;
  issues: Array<{
    type: string;
    severity: string;
    message: string;
    suggestion: string | null;
  }>;
};

export type StyleRewriteResult = {
  profile: string;
  rewritten: string;
  changed: boolean;
  changeCount: number;
  provider: string;
  note: string;
};

export interface LanguageRegistryPort {
  listLanguages: Promise<LanguageRow[]>;
  listLocalePacks: Promise<LocaleRow[]>;
  listCountryPacks(region?: string): Promise<CountryRow[]>;
  listStyleProfiles: StyleProfileRow[];
  listLanguageProducts: Array<{
    id: string;
    name: string;
    status: string;
    api: string | null;
    console: string | null;
    notes: string;
  }>;
}

export interface DialectPort {
  list(language?: string): Promise<DialectRow[]>;
  detect(input: { text: string; language?: string } & AuthContext): Promise<DialectDetectResult>;
}

export interface AccentPort {
  list(language?: string): Promise<AccentRow[]>;
}

export interface GrammarPort {
  check(input: { text: string; language?: string } & AuthContext): Promise<GrammarCheckResult>;
}

export interface StylePort {
  rewrite(
    input: { text: string; profile: string; language?: string } & AuthContext,
  ): Promise<StyleRewriteResult>;
}

export const LANGUAGE_REGISTRY_PORT = Symbol('LANGUAGE_REGISTRY_PORT');
export const DIALECT_PORT = Symbol('DIALECT_PORT');
export const ACCENT_PORT = Symbol('ACCENT_PORT');
export const GRAMMAR_PORT = Symbol('GRAMMAR_PORT');
export const STYLE_PORT = Symbol('STYLE_PORT');
