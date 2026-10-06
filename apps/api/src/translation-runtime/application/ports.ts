/** Application ports for Translation Runtime (VL-325). */

export type TranslationRuntimeProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type TranslationRuntimeEngineBundle = ReturnType<
  import('../translation-runtime.service').TranslationRuntimeService['engine']
>;

export interface TranslationRuntimeCatalogPort {
  engine(): TranslationRuntimeEngineBundle;
  listProducts(): TranslationRuntimeProductRow[];
}

export const TRANSLATION_RUNTIME_CATALOG_PORT = Symbol('TRANSLATION_RUNTIME_CATALOG_PORT');
