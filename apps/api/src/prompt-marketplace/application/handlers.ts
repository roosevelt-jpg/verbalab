import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetPromptMarketplaceEngineQuery } from './messages';
import {
  PROMPT_MARKETPLACE_CATALOG_PORT,
  PromptMarketplaceCatalogPort,
  PromptMarketplaceEngineBundle,
} from './ports';

@QueryHandler(GetPromptMarketplaceEngineQuery)
export class GetPromptMarketplaceEngineHandler
  implements IQueryHandler<GetPromptMarketplaceEngineQuery>
{
  constructor(
    @Inject(PROMPT_MARKETPLACE_CATALOG_PORT)
    private readonly catalog: PromptMarketplaceCatalogPort,
  ) {}

  execute(): Promise<PromptMarketplaceEngineBundle> {
    return Promise.resolve(this.catalog.engine());
  }
}

export const PROMPT_MARKETPLACE_HANDLERS = [GetPromptMarketplaceEngineHandler];
