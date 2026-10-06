/** Application ports for Vision Runtime (VL-328). */

export type VisionRuntimeProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type VisionRuntimeEngineBundle = ReturnType<
  import('../vision-runtime.service').VisionRuntimeService['engine']
>;

export interface VisionRuntimeCatalogPort {
  engine(): VisionRuntimeEngineBundle;
  listProducts(): VisionRuntimeProductRow[];
}

export const VISION_RUNTIME_CATALOG_PORT = Symbol('VISION_RUNTIME_CATALOG_PORT');
