/** Application ports for Voice Cloud. Implemented by Nest adapters. */

export type VoiceProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type VoiceArchitectureNotes = ReturnType<
  typeof import('../voice-products.catalog').voiceArchitectureNotes
>;

export type VoiceProductsBundle = {
  products: VoiceProductRow[];
  architecture: VoiceArchitectureNotes;
  docs: string;
};

export interface VoiceCatalogPort {
  products(): VoiceProductsBundle;
  listProducts(): VoiceProductRow[];
}

export const VOICE_CATALOG_PORT = Symbol('VOICE_CATALOG_PORT');
