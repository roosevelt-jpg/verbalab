import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetAiEngineeringStandardsEngineQuery, ListAiEngineeringStandardsProductsQuery } from './messages';
import {
  AI_ENGINEERING_STANDARDS_CATALOG_PORT,
  AiEngineeringStandardsCatalogPort,
  AiEngineeringStandardsEngineBundle,
  AiEngineeringStandardsProductRow,
} from './ports';

@QueryHandler(GetAiEngineeringStandardsEngineQuery)
export class GetAiEngineeringStandardsEngineHandler
  implements IQueryHandler<GetAiEngineeringStandardsEngineQuery>
{
  constructor(
    @Inject(AI_ENGINEERING_STANDARDS_CATALOG_PORT)
    private readonly catalog: AiEngineeringStandardsCatalogPort,
  ) {}

  execute: Promise<AiEngineeringStandardsEngineBundle> {
    return Promise.resolve(this.catalog.engine);
  }
}

@QueryHandler(ListAiEngineeringStandardsProductsQuery)
export class ListAiEngineeringStandardsProductsHandler
  implements IQueryHandler<ListAiEngineeringStandardsProductsQuery>
{
  constructor(
    @Inject(AI_ENGINEERING_STANDARDS_CATALOG_PORT)
    private readonly catalog: AiEngineeringStandardsCatalogPort,
  ) {}

  execute: Promise<AiEngineeringStandardsProductRow[]> {
    return Promise.resolve(this.catalog.listProducts);
  }
}

export const AI_ENGINEERING_STANDARDS_HANDLERS = [GetAiEngineeringStandardsEngineHandler, ListAiEngineeringStandardsProductsHandler];
