/** Application ports for VAIOS Foundation (VL-334). */

export type VaiosProductRow = {
  id: string;
  name: string;
  status: string;
  api: string | null;
  console: string | null;
  notes: string;
};

export type VaiosEngineBundle = ReturnType<
  import('../vaios.service').VaiosService['products']
>;

export interface VaiosCatalogPort {
  engine(): VaiosEngineBundle;
  listProducts(): VaiosProductRow[];
}

export const VAIOS_CATALOG_PORT = Symbol('VAIOS_CATALOG_PORT');
