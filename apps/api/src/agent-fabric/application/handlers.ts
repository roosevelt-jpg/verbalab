import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  GetAgentFabricProductsBundleQuery,
  ListAgentFabricCapabilitiesQuery,
  ListAgentFabricRoutesQuery,
} from './messages';
import {
  AGENT_FABRIC_CATALOG_PORT,
  AgentFabricCapabilityRow,
  AgentFabricCatalogPort,
  AgentFabricProductsBundle,
  AgentFabricRouteRow,
} from './ports';

@QueryHandler(ListAgentFabricCapabilitiesQuery)
export class ListAgentFabricCapabilitiesHandler
  implements IQueryHandler<ListAgentFabricCapabilitiesQuery>
{
  constructor(
    @Inject(AGENT_FABRIC_CATALOG_PORT)
    private readonly catalog: AgentFabricCatalogPort,
  ) {}

  execute(): Promise<AgentFabricCapabilityRow[]> {
    return Promise.resolve(this.catalog.listCapabilities());
  }
}

@QueryHandler(ListAgentFabricRoutesQuery)
export class ListAgentFabricRoutesHandler
  implements IQueryHandler<ListAgentFabricRoutesQuery>
{
  constructor(
    @Inject(AGENT_FABRIC_CATALOG_PORT)
    private readonly catalog: AgentFabricCatalogPort,
  ) {}

  execute(): Promise<AgentFabricRouteRow[]> {
    return Promise.resolve(this.catalog.listRoutes());
  }
}

@QueryHandler(GetAgentFabricProductsBundleQuery)
export class GetAgentFabricProductsBundleHandler
  implements IQueryHandler<GetAgentFabricProductsBundleQuery>
{
  constructor(
    @Inject(AGENT_FABRIC_CATALOG_PORT)
    private readonly catalog: AgentFabricCatalogPort,
  ) {}

  execute(): Promise<AgentFabricProductsBundle> {
    return Promise.resolve(this.catalog.products());
  }
}

export const AGENT_FABRIC_HANDLERS = [
  ListAgentFabricCapabilitiesHandler,
  ListAgentFabricRoutesHandler,
  GetAgentFabricProductsBundleHandler,
];
