/** Application ports for AI Publication Platform (VL-276). */

export type AiPublicationPlatformProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type AiPublicationPlatformEngineBundle = ReturnType<
  import('../ai-publication-platform.service').AiPublicationPlatformService['engine']
>;

export interface AiPublicationPlatformCatalogPort {
  engine(): AiPublicationPlatformEngineBundle;
  listProducts(): AiPublicationPlatformProductRow[];
}

export const AI_PUBLICATION_PLATFORM_CATALOG_PORT = Symbol('AI_PUBLICATION_PLATFORM_CATALOG_PORT');
