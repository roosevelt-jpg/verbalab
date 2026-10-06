import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  GetInferenceProductsBundleQuery,
  ListInferenceProductsQuery,
} from './messages';
import {
  INFERENCE_CATALOG_PORT,
  InferenceCatalogPort,
  InferenceProductRow,
  InferenceProductsBundle,
} from './ports';

@QueryHandler(ListInferenceProductsQuery)
export class ListInferenceProductsHandler
  implements IQueryHandler<ListInferenceProductsQuery>
{
  constructor(
    @Inject(INFERENCE_CATALOG_PORT) private readonly catalog: InferenceCatalogPort,
  ) {}

  execute: Promise<InferenceProductRow[]> {
    return Promise.resolve(this.catalog.listProducts);
  }
}

@QueryHandler(GetInferenceProductsBundleQuery)
export class GetInferenceProductsBundleHandler
  implements IQueryHandler<GetInferenceProductsBundleQuery>
{
  constructor(
    @Inject(INFERENCE_CATALOG_PORT) private readonly catalog: InferenceCatalogPort,
  ) {}

  execute: Promise<InferenceProductsBundle> {
    return Promise.resolve(this.catalog.products);
  }
}

export const INFERENCE_CLOUD_HANDLERS = [
  ListInferenceProductsHandler,
  GetInferenceProductsBundleHandler,
];
