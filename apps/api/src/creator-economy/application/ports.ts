/** Application ports for Creator Economy. */

export type CreatorEconomyEngineBundle = ReturnType<
  import('../creator-economy.service').CreatorEconomyService['engine']
>;

export interface CreatorEconomyCatalogPort {
  engine(): CreatorEconomyEngineBundle;
}

export const CREATOR_ECONOMY_CATALOG_PORT = Symbol('CREATOR_ECONOMY_CATALOG_PORT');
