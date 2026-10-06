/** Application ports for Global Routing Controller. */

export type GlobalRoutingControllerProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type GlobalRoutingControllerEngineBundle = ReturnType<
  import('../global-routing-controller.service').GlobalRoutingControllerService['engine']
>;

export interface GlobalRoutingControllerCatalogPort {
  engine: GlobalRoutingControllerEngineBundle;
  listProducts: GlobalRoutingControllerProductRow[];
}

export const GLOBAL_ROUTING_CONTROLLER_CATALOG_PORT = Symbol('GLOBAL_ROUTING_CONTROLLER_CATALOG_PORT');
