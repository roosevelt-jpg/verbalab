import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetAgentOperatingSystemEngineQuery, ListAgentOperatingSystemProductsQuery } from './messages';
import {
  AGENT_OPERATING_SYSTEM_CATALOG_PORT,
  AgentOperatingSystemCatalogPort,
  AgentOperatingSystemEngineBundle,
  AgentOperatingSystemProductRow,
} from './ports';

@QueryHandler(GetAgentOperatingSystemEngineQuery)
export class GetAgentOperatingSystemEngineHandler
  implements IQueryHandler<GetAgentOperatingSystemEngineQuery>
{
  constructor(
    @Inject(AGENT_OPERATING_SYSTEM_CATALOG_PORT)
    private readonly catalog: AgentOperatingSystemCatalogPort,
  ) {}

  execute(): Promise<AgentOperatingSystemEngineBundle> {
    return Promise.resolve(this.catalog.engine());
  }
}

@QueryHandler(ListAgentOperatingSystemProductsQuery)
export class ListAgentOperatingSystemProductsHandler
  implements IQueryHandler<ListAgentOperatingSystemProductsQuery>
{
  constructor(
    @Inject(AGENT_OPERATING_SYSTEM_CATALOG_PORT)
    private readonly catalog: AgentOperatingSystemCatalogPort,
  ) {}

  execute(): Promise<AgentOperatingSystemProductRow[]> {
    return Promise.resolve(this.catalog.listProducts());
  }
}

export const AGENT_OPERATING_SYSTEM_HANDLERS = [GetAgentOperatingSystemEngineHandler, ListAgentOperatingSystemProductsHandler];
