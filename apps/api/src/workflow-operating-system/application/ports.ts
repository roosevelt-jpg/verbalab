/** Application ports for Workflow Operating System (VL-338). */

export type WorkflowOperatingSystemProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type WorkflowOperatingSystemEngineBundle = ReturnType<
  import('../workflow-operating-system.service').WorkflowOperatingSystemService['engine']
>;

export interface WorkflowOperatingSystemCatalogPort {
  engine(): WorkflowOperatingSystemEngineBundle;
  listProducts(): WorkflowOperatingSystemProductRow[];
}

export const WORKFLOW_OPERATING_SYSTEM_CATALOG_PORT = Symbol('WORKFLOW_OPERATING_SYSTEM_CATALOG_PORT');
