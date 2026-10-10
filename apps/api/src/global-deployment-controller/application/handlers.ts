import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetGlobalDeploymentControllerEngineQuery, ListGlobalDeploymentControllerProductsQuery } from './messages';
import {
  GLOBAL_DEPLOYMENT_CONTROLLER_CATALOG_PORT,
  GlobalDeploymentControllerCatalogPort,
  GlobalDeploymentControllerEngineBundle,
  GlobalDeploymentControllerProductRow,
} from './ports';

@QueryHandler(GetGlobalDeploymentControllerEngineQuery)
export class GetGlobalDeploymentControllerEngineHandler
  implements IQueryHandler<GetGlobalDeploymentControllerEngineQuery>
{
  constructor(
    @Inject(GLOBAL_DEPLOYMENT_CONTROLLER_CATALOG_PORT)
    private readonly catalog: GlobalDeploymentControllerCatalogPort,
  ) {}

  execute(): Promise<GlobalDeploymentControllerEngineBundle> {
    return Promise.resolve(this.catalog.engine());
  }
}

@QueryHandler(ListGlobalDeploymentControllerProductsQuery)
export class ListGlobalDeploymentControllerProductsHandler
  implements IQueryHandler<ListGlobalDeploymentControllerProductsQuery>
{
  constructor(
    @Inject(GLOBAL_DEPLOYMENT_CONTROLLER_CATALOG_PORT)
    private readonly catalog: GlobalDeploymentControllerCatalogPort,
  ) {}

  execute(): Promise<GlobalDeploymentControllerProductRow[]> {
    return Promise.resolve(this.catalog.listProducts());
  }
}

export const GLOBAL_DEPLOYMENT_CONTROLLER_HANDLERS = [GetGlobalDeploymentControllerEngineHandler, ListGlobalDeploymentControllerProductsHandler];
