/** Application ports for Global Deployment Controller. */

export type GlobalDeploymentControllerProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type GlobalDeploymentControllerEngineBundle = ReturnType<
  import('../global-deployment-controller.service').GlobalDeploymentControllerService['engine']
>;

export interface GlobalDeploymentControllerCatalogPort {
  engine: GlobalDeploymentControllerEngineBundle;
  listProducts: GlobalDeploymentControllerProductRow[];
}

export const GLOBAL_DEPLOYMENT_CONTROLLER_CATALOG_PORT = Symbol('GLOBAL_DEPLOYMENT_CONTROLLER_CATALOG_PORT');
