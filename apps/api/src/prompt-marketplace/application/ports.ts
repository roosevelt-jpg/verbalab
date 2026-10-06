/** Application ports for Prompt Marketplace. */

export type PromptMarketplaceEngineBundle = ReturnType<
  import('../prompt-marketplace.service').PromptMarketplaceService['engine']
>;

export interface PromptMarketplaceCatalogPort {
  engine: PromptMarketplaceEngineBundle;
}

export const PROMPT_MARKETPLACE_CATALOG_PORT = Symbol('PROMPT_MARKETPLACE_CATALOG_PORT');
