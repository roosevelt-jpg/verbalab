/** Application ports for Speech Runtime (VL-326). */

export type SpeechRuntimeProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type SpeechRuntimeEngineBundle = ReturnType<
  import('../speech-runtime.service').SpeechRuntimeService['engine']
>;

export interface SpeechRuntimeCatalogPort {
  engine(): SpeechRuntimeEngineBundle;
  listProducts(): SpeechRuntimeProductRow[];
}

export const SPEECH_RUNTIME_CATALOG_PORT = Symbol('SPEECH_RUNTIME_CATALOG_PORT');
