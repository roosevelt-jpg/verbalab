/** Application ports for AI Scheduler. */

export type AiSchedulerProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type AiSchedulerEngineBundle = ReturnType<
  import('../ai-scheduler.service').AiSchedulerService['engine']
>;

export interface AiSchedulerCatalogPort {
  engine: AiSchedulerEngineBundle;
  listProducts: AiSchedulerProductRow[];
}

export const AI_SCHEDULER_CATALOG_PORT = Symbol('AI_SCHEDULER_CATALOG_PORT');
