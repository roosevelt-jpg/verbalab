import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetEngineeringQualityPlatformEngineQuery, ListEngineeringQualityPlatformProductsQuery } from './messages';
import {
  ENGINEERING_QUALITY_PLATFORM_CATALOG_PORT,
  EngineeringQualityPlatformCatalogPort,
  EngineeringQualityPlatformEngineBundle,
  EngineeringQualityPlatformProductRow,
} from './ports';

@QueryHandler(GetEngineeringQualityPlatformEngineQuery)
export class GetEngineeringQualityPlatformEngineHandler
  implements IQueryHandler<GetEngineeringQualityPlatformEngineQuery>
{
  constructor(
    @Inject(ENGINEERING_QUALITY_PLATFORM_CATALOG_PORT)
    private readonly catalog: EngineeringQualityPlatformCatalogPort,
  ) {}

  execute(): Promise<EngineeringQualityPlatformEngineBundle> {
    return Promise.resolve(this.catalog.engine());
  }
}

@QueryHandler(ListEngineeringQualityPlatformProductsQuery)
export class ListEngineeringQualityPlatformProductsHandler
  implements IQueryHandler<ListEngineeringQualityPlatformProductsQuery>
{
  constructor(
    @Inject(ENGINEERING_QUALITY_PLATFORM_CATALOG_PORT)
    private readonly catalog: EngineeringQualityPlatformCatalogPort,
  ) {}

  execute(): Promise<EngineeringQualityPlatformProductRow[]> {
    return Promise.resolve(this.catalog.listProducts());
  }
}

export const ENGINEERING_QUALITY_PLATFORM_HANDLERS = [GetEngineeringQualityPlatformEngineHandler, ListEngineeringQualityPlatformProductsHandler];
