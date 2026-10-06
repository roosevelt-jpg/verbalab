/** Application ports for Voice Runtime. */

export type VoiceRuntimeProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type VoiceRuntimeEngineBundle = ReturnType<
  import('../voice-runtime.service').VoiceRuntimeService['engine']
>;

export interface VoiceRuntimeCatalogPort {
  engine(): VoiceRuntimeEngineBundle;
  listProducts(): VoiceRuntimeProductRow[];
}

export const VOICE_RUNTIME_CATALOG_PORT = Symbol('VOICE_RUNTIME_CATALOG_PORT');
