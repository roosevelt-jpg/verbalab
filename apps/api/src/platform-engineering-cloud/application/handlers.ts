import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetPlatformEngineeringCloudEngineQuery, ListPlatformEngineeringCloudProductsQuery } from './messages';
import {
  PLATFORM_ENGINEERING_CLOUD_CATALOG_PORT,
  PlatformEngineeringCloudCatalogPort,
  PlatformEngineeringCloudEngineBundle,
  PlatformEngineeringCloudProductRow,
} from './ports';

@QueryHandler(GetPlatformEngineeringCloudEngineQuery)
export class GetPlatformEngineeringCloudEngineHandler
  implements IQueryHandler<GetPlatformEngineeringCloudEngineQuery>
{
  constructor(
    @Inject(PLATFORM_ENGINEERING_CLOUD_CATALOG_PORT)
    private readonly catalog: PlatformEngineeringCloudCatalogPort,
  ) {}

  execute(): Promise<PlatformEngineeringCloudEngineBundle> {
    return Promise.resolve(this.catalog.engine());
  }
}

@QueryHandler(ListPlatformEngineeringCloudProductsQuery)
export class ListPlatformEngineeringCloudProductsHandler
  implements IQueryHandler<ListPlatformEngineeringCloudProductsQuery>
{
  constructor(
    @Inject(PLATFORM_ENGINEERING_CLOUD_CATALOG_PORT)
    private readonly catalog: PlatformEngineeringCloudCatalogPort,
  ) {}

  execute(): Promise<PlatformEngineeringCloudProductRow[]> {
    return Promise.resolve(this.catalog.listProducts());
  }
}

export const PLATFORM_ENGINEERING_CLOUD_HANDLERS = [GetPlatformEngineeringCloudEngineHandler, ListPlatformEngineeringCloudProductsHandler];
