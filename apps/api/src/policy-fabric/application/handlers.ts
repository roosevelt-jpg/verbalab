import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  GetPolicyFabricProductsBundleQuery,
  ListPolicyFabricCapabilitiesQuery,
  ListPolicyFabricRoutesQuery,
} from './messages';
import {
  POLICY_FABRIC_CATALOG_PORT,
  PolicyFabricCapabilityRow,
  PolicyFabricCatalogPort,
  PolicyFabricProductsBundle,
  PolicyFabricRouteRow,
} from './ports';

@QueryHandler(ListPolicyFabricCapabilitiesQuery)
export class ListPolicyFabricCapabilitiesHandler
  implements IQueryHandler<ListPolicyFabricCapabilitiesQuery>
{
  constructor(
    @Inject(POLICY_FABRIC_CATALOG_PORT)
    private readonly catalog: PolicyFabricCatalogPort,
  ) {}

  execute(): Promise<PolicyFabricCapabilityRow[]> {
    return Promise.resolve(this.catalog.listCapabilities());
  }
}

@QueryHandler(ListPolicyFabricRoutesQuery)
export class ListPolicyFabricRoutesHandler
  implements IQueryHandler<ListPolicyFabricRoutesQuery>
{
  constructor(
    @Inject(POLICY_FABRIC_CATALOG_PORT)
    private readonly catalog: PolicyFabricCatalogPort,
  ) {}

  execute(): Promise<PolicyFabricRouteRow[]> {
    return Promise.resolve(this.catalog.listRoutes());
  }
}

@QueryHandler(GetPolicyFabricProductsBundleQuery)
export class GetPolicyFabricProductsBundleHandler
  implements IQueryHandler<GetPolicyFabricProductsBundleQuery>
{
  constructor(
    @Inject(POLICY_FABRIC_CATALOG_PORT)
    private readonly catalog: PolicyFabricCatalogPort,
  ) {}

  execute(): Promise<PolicyFabricProductsBundle> {
    return Promise.resolve(this.catalog.products());
  }
}

export const POLICY_FABRIC_HANDLERS = [
  ListPolicyFabricCapabilitiesHandler,
  ListPolicyFabricRoutesHandler,
  GetPolicyFabricProductsBundleHandler,
];
