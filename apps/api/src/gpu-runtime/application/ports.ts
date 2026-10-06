/** Application ports for GPU Runtime. */

export type GpuRuntimeProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type GpuRuntimeEngineBundle = ReturnType<
  import('../gpu-runtime.service').GpuRuntimeService['engine']
>;

export interface GpuRuntimeCatalogPort {
  engine: GpuRuntimeEngineBundle;
  listProducts: GpuRuntimeProductRow[];
}

export const GPU_RUNTIME_CATALOG_PORT = Symbol('GPU_RUNTIME_CATALOG_PORT');
