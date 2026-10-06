import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetCreatorEconomyEngineQuery } from './messages';
import {
  CREATOR_ECONOMY_CATALOG_PORT,
  CreatorEconomyCatalogPort,
  CreatorEconomyEngineBundle,
} from './ports';

@QueryHandler(GetCreatorEconomyEngineQuery)
export class GetCreatorEconomyEngineHandler
  implements IQueryHandler<GetCreatorEconomyEngineQuery>
{
  constructor(
    @Inject(CREATOR_ECONOMY_CATALOG_PORT)
    private readonly catalog: CreatorEconomyCatalogPort,
  ) {}

  execute: Promise<CreatorEconomyEngineBundle> {
    return Promise.resolve(this.catalog.engine);
  }
}

export const CREATOR_ECONOMY_HANDLERS = [GetCreatorEconomyEngineHandler];
