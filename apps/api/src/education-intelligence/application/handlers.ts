import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetEducationIntelligenceEngineQuery, ListEducationIntelligenceProductsQuery } from './messages';
import {
  EDUCATION_INTELLIGENCE_CATALOG_PORT,
  EducationIntelligenceCatalogPort,
  EducationIntelligenceEngineBundle,
  EducationIntelligenceProductRow,
} from './ports';

@QueryHandler(GetEducationIntelligenceEngineQuery)
export class GetEducationIntelligenceEngineHandler
  implements IQueryHandler<GetEducationIntelligenceEngineQuery>
{
  constructor(
    @Inject(EDUCATION_INTELLIGENCE_CATALOG_PORT)
    private readonly catalog: EducationIntelligenceCatalogPort,
  ) {}

  execute(): Promise<EducationIntelligenceEngineBundle> {
    return Promise.resolve(this.catalog.engine());
  }
}

@QueryHandler(ListEducationIntelligenceProductsQuery)
export class ListEducationIntelligenceProductsHandler
  implements IQueryHandler<ListEducationIntelligenceProductsQuery>
{
  constructor(
    @Inject(EDUCATION_INTELLIGENCE_CATALOG_PORT)
    private readonly catalog: EducationIntelligenceCatalogPort,
  ) {}

  execute(): Promise<EducationIntelligenceProductRow[]> {
    return Promise.resolve(this.catalog.listProducts());
  }
}

export const EDUCATION_INTELLIGENCE_HANDLERS = [GetEducationIntelligenceEngineHandler, ListEducationIntelligenceProductsHandler];
