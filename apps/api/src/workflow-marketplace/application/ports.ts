/** Application ports for Workflow Marketplace. */

export type WorkflowMarketplaceEngineBundle = ReturnType<
  import('../workflow-marketplace.service').WorkflowMarketplaceService['engine']
>;

export interface WorkflowMarketplaceCatalogPort {
  engine: WorkflowMarketplaceEngineBundle;
}

export const WORKFLOW_MARKETPLACE_CATALOG_PORT = Symbol('WORKFLOW_MARKETPLACE_CATALOG_PORT');
