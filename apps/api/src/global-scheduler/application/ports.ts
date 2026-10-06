/** Application ports for Global Scheduler. */

export type GlobalSchedulerProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type GlobalSchedulerEngineBundle = ReturnType<
  import('../global-scheduler.service').GlobalSchedulerService['engine']
>;

export interface GlobalSchedulerCatalogPort {
  engine: GlobalSchedulerEngineBundle;
  listProducts: GlobalSchedulerProductRow[];
}

export const GLOBAL_SCHEDULER_CATALOG_PORT = Symbol('GLOBAL_SCHEDULER_CATALOG_PORT');
