import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  GetFoundationModelCloudProductsBundleQuery,
  ListFoundationModelCloudProductsQuery,
} from './messages';
import {
  FOUNDATION_MODEL_CLOUD_CATALOG_PORT,
  FoundationModelCloudCatalogPort,
  FmcProductRow,
  FmcProductsBundle,
} from './ports';

@QueryHandler(ListFoundationModelCloudProductsQuery)
export class ListFoundationModelCloudProductsHandler
  implements IQueryHandler<ListFoundationModelCloudProductsQuery>
{
  constructor(
    @Inject(FOUNDATION_MODEL_CLOUD_CATALOG_PORT)
    private readonly catalog: FoundationModelCloudCatalogPort,
  ) {}

  execute: Promise<FmcProductRow[]> {
    return Promise.resolve(this.catalog.listProducts);
  }
}

@QueryHandler(GetFoundationModelCloudProductsBundleQuery)
export class GetFoundationModelCloudProductsBundleHandler
  implements IQueryHandler<GetFoundationModelCloudProductsBundleQuery>
{
  constructor(
    @Inject(FOUNDATION_MODEL_CLOUD_CATALOG_PORT)
    private readonly catalog: FoundationModelCloudCatalogPort,
  ) {}

  execute: Promise<FmcProductsBundle> {
    return Promise.resolve(this.catalog.products);
  }
}

export const FOUNDATION_MODEL_CLOUD_HANDLERS = [
  ListFoundationModelCloudProductsHandler,
  GetFoundationModelCloudProductsBundleHandler,
];
