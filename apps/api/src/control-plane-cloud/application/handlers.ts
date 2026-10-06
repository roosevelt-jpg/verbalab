import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetControlPlaneCloudEngineQuery, ListControlPlaneCloudProductsQuery } from './messages';
import {
  CONTROL_PLANE_CLOUD_CATALOG_PORT,
  ControlPlaneCloudCatalogPort,
  ControlPlaneCloudEngineBundle,
  ControlPlaneCloudProductRow,
} from './ports';

@QueryHandler(GetControlPlaneCloudEngineQuery)
export class GetControlPlaneCloudEngineHandler
  implements IQueryHandler<GetControlPlaneCloudEngineQuery>
{
  constructor(
    @Inject(CONTROL_PLANE_CLOUD_CATALOG_PORT)
    private readonly catalog: ControlPlaneCloudCatalogPort,
  ) {}

  execute: Promise<ControlPlaneCloudEngineBundle> {
    return Promise.resolve(this.catalog.engine);
  }
}

@QueryHandler(ListControlPlaneCloudProductsQuery)
export class ListControlPlaneCloudProductsHandler
  implements IQueryHandler<ListControlPlaneCloudProductsQuery>
{
  constructor(
    @Inject(CONTROL_PLANE_CLOUD_CATALOG_PORT)
    private readonly catalog: ControlPlaneCloudCatalogPort,
  ) {}

  execute: Promise<ControlPlaneCloudProductRow[]> {
    return Promise.resolve(this.catalog.listProducts);
  }
}

export const CONTROL_PLANE_CLOUD_HANDLERS = [GetControlPlaneCloudEngineHandler, ListControlPlaneCloudProductsHandler];
