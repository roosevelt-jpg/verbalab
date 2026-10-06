import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetAgentMarketplaceEngineQuery } from './messages';
import {
  AGENT_MARKETPLACE_CATALOG_PORT,
  AgentMarketplaceCatalogPort,
  AgentMarketplaceEngineBundle,
} from './ports';

@QueryHandler(GetAgentMarketplaceEngineQuery)
export class GetAgentMarketplaceEngineHandler
  implements IQueryHandler<GetAgentMarketplaceEngineQuery>
{
  constructor(
    @Inject(AGENT_MARKETPLACE_CATALOG_PORT)
    private readonly catalog: AgentMarketplaceCatalogPort,
  ) {}

  execute: Promise<AgentMarketplaceEngineBundle> {
    return Promise.resolve(this.catalog.engine);
  }
}

export const AGENT_MARKETPLACE_HANDLERS = [GetAgentMarketplaceEngineHandler];
