/** Application ports for Event Fabric (VL-240). */

export type EventFabricCapabilityRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  notes: string;
};

export type EventFabricBrokerRow = {
  id: string;
  name: string;
  status: string;
  protocol: string;
  notes: string;
};

export type EventFabricProductsBundle = ReturnType<
  import('../event-fabric.service').EventFabricService['products']
>;

export interface EventFabricCatalogPort {
  products(): EventFabricProductsBundle;
  listCapabilities(): EventFabricCapabilityRow[];
  listBrokers(): EventFabricBrokerRow[];
}

export const EVENT_FABRIC_CATALOG_PORT = Symbol('EVENT_FABRIC_CATALOG_PORT');
