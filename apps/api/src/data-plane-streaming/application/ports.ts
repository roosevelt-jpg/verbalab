/** Application ports for Data Plane Streaming. */

export type DataPlaneStreamingProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type DataPlaneStreamingEngineBundle = ReturnType<
  import('../data-plane-streaming.service').DataPlaneStreamingService['engine']
>;

export interface DataPlaneStreamingCatalogPort {
  engine: DataPlaneStreamingEngineBundle;
  listProducts: DataPlaneStreamingProductRow[];
}

export const DATA_PLANE_STREAMING_CATALOG_PORT = Symbol('DATA_PLANE_STREAMING_CATALOG_PORT');
