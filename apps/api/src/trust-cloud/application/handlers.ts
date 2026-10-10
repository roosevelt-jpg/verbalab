import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetTrustCloudEngineQuery, ListTrustCloudProductsQuery } from './messages';
import {
  TRUST_CLOUD_CATALOG_PORT,
  TrustCloudCatalogPort,
  TrustCloudEngineBundle,
  TrustCloudProductRow,
} from './ports';

@QueryHandler(GetTrustCloudEngineQuery)
export class GetTrustCloudEngineHandler implements IQueryHandler<GetTrustCloudEngineQuery> {
  constructor(
    @Inject(TRUST_CLOUD_CATALOG_PORT)
    private readonly catalog: TrustCloudCatalogPort,
  ) {}

  execute(): Promise<TrustCloudEngineBundle> {
    return Promise.resolve(this.catalog.engine());
  }
}

@QueryHandler(ListTrustCloudProductsQuery)
export class ListTrustCloudProductsHandler implements IQueryHandler<ListTrustCloudProductsQuery> {
  constructor(
    @Inject(TRUST_CLOUD_CATALOG_PORT)
    private readonly catalog: TrustCloudCatalogPort,
  ) {}

  execute(): Promise<TrustCloudProductRow[]> {
    return Promise.resolve(this.catalog.listProducts());
  }
}

export const TRUST_CLOUD_HANDLERS = [GetTrustCloudEngineHandler, ListTrustCloudProductsHandler];
