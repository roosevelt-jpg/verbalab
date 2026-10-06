/** Application ports for Speech Cloud (VL-150). Implemented by Nest adapters. */

export type SpeechProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type SpeechArchitectureNotes = ReturnType<
  typeof import('../speech-products.catalog').speechArchitectureNotes
>;

export type SpeechProductsBundle = {
  products: SpeechProductRow[];
  architecture: SpeechArchitectureNotes;
  docs: string;
};

export interface SpeechCatalogPort {
  products(): SpeechProductsBundle;
  listProducts(): SpeechProductRow[];
}

export const SPEECH_CATALOG_PORT = Symbol('SPEECH_CATALOG_PORT');
