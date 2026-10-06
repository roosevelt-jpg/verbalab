/** Application ports for Experiment Platform. */

export type ExperimentPlatformProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type ExperimentPlatformEngineBundle = ReturnType<
  import('../experiment-platform.service').ExperimentPlatformService['engine']
>;

export interface ExperimentPlatformCatalogPort {
  engine(): ExperimentPlatformEngineBundle;
  listProducts(): ExperimentPlatformProductRow[];
}

export const EXPERIMENT_PLATFORM_CATALOG_PORT = Symbol('EXPERIMENT_PLATFORM_CATALOG_PORT');
