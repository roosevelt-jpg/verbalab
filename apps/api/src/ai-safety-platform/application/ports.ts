/** Application ports for AI Safety Platform. */

export type AiSafetyPlatformProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type AiSafetyPlatformEngineBundle = ReturnType<
  import('../ai-safety-platform.service').AiSafetyPlatformService['engine']
>;

export interface AiSafetyPlatformCatalogPort {
  engine: AiSafetyPlatformEngineBundle;
  listProducts: AiSafetyPlatformProductRow[];
}

export const AI_SAFETY_PLATFORM_CATALOG_PORT = Symbol('AI_SAFETY_PLATFORM_CATALOG_PORT');
