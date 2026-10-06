/** Application ports for Voice & Language Marketplace. */

export type VoiceLanguageMarketplaceEngineBundle = ReturnType<
  import('../voice-language-marketplace.service').VoiceLanguageMarketplaceService['engine']
>;

export interface VoiceLanguageMarketplaceCatalogPort {
  engine: VoiceLanguageMarketplaceEngineBundle;
}

export const VOICE_LANGUAGE_MARKETPLACE_CATALOG_PORT = Symbol('VOICE_LANGUAGE_MARKETPLACE_CATALOG_PORT');
