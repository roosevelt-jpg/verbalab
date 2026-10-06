/** Application ports for AI Operations Dashboard. */

export type AiOperationsDashboardProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type AiOperationsDashboardEngineBundle = ReturnType<
  import('../ai-operations-dashboard.service').AiOperationsDashboardService['engine']
>;

export interface AiOperationsDashboardCatalogPort {
  engine: AiOperationsDashboardEngineBundle;
  listProducts: AiOperationsDashboardProductRow[];
}

export const AI_OPERATIONS_DASHBOARD_CATALOG_PORT = Symbol('AI_OPERATIONS_DASHBOARD_CATALOG_PORT');
