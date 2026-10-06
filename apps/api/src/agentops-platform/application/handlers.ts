import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetAgentopsPlatformEngineQuery, ListAgentopsPlatformProductsQuery } from './messages';
import {
  AGENTOPS_PLATFORM_CATALOG_PORT,
  AgentopsPlatformCatalogPort,
  AgentopsPlatformEngineBundle,
  AgentopsPlatformProductRow,
} from './ports';

@QueryHandler(GetAgentopsPlatformEngineQuery)
export class GetAgentopsPlatformEngineHandler
  implements IQueryHandler<GetAgentopsPlatformEngineQuery>
{
  constructor(
    @Inject(AGENTOPS_PLATFORM_CATALOG_PORT)
    private readonly catalog: AgentopsPlatformCatalogPort,
  ) {}

  execute: Promise<AgentopsPlatformEngineBundle> {
    return Promise.resolve(this.catalog.engine);
  }
}

@QueryHandler(ListAgentopsPlatformProductsQuery)
export class ListAgentopsPlatformProductsHandler
  implements IQueryHandler<ListAgentopsPlatformProductsQuery>
{
  constructor(
    @Inject(AGENTOPS_PLATFORM_CATALOG_PORT)
    private readonly catalog: AgentopsPlatformCatalogPort,
  ) {}

  execute: Promise<AgentopsPlatformProductRow[]> {
    return Promise.resolve(this.catalog.listProducts);
  }
}

export const AGENTOPS_PLATFORM_HANDLERS = [GetAgentopsPlatformEngineHandler, ListAgentopsPlatformProductsHandler];
