import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetReliabilityEngineeringEngineQuery, ListReliabilityEngineeringProductsQuery } from './messages';
import {
  RELIABILITY_ENGINEERING_CATALOG_PORT,
  ReliabilityEngineeringCatalogPort,
  ReliabilityEngineeringEngineBundle,
  ReliabilityEngineeringProductRow,
} from './ports';

@QueryHandler(GetReliabilityEngineeringEngineQuery)
export class GetReliabilityEngineeringEngineHandler
  implements IQueryHandler<GetReliabilityEngineeringEngineQuery>
{
  constructor(
    @Inject(RELIABILITY_ENGINEERING_CATALOG_PORT)
    private readonly catalog: ReliabilityEngineeringCatalogPort,
  ) {}

  execute: Promise<ReliabilityEngineeringEngineBundle> {
    return Promise.resolve(this.catalog.engine);
  }
}

@QueryHandler(ListReliabilityEngineeringProductsQuery)
export class ListReliabilityEngineeringProductsHandler
  implements IQueryHandler<ListReliabilityEngineeringProductsQuery>
{
  constructor(
    @Inject(RELIABILITY_ENGINEERING_CATALOG_PORT)
    private readonly catalog: ReliabilityEngineeringCatalogPort,
  ) {}

  execute: Promise<ReliabilityEngineeringProductRow[]> {
    return Promise.resolve(this.catalog.listProducts);
  }
}

export const RELIABILITY_ENGINEERING_HANDLERS = [GetReliabilityEngineeringEngineHandler, ListReliabilityEngineeringProductsHandler];
