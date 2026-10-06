import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetEmbeddingRuntimeEngineQuery, ListEmbeddingRuntimeProductsQuery } from './messages';
import {
  EMBEDDING_RUNTIME_CATALOG_PORT,
  EmbeddingRuntimeCatalogPort,
  EmbeddingRuntimeEngineBundle,
  EmbeddingRuntimeProductRow,
} from './ports';

@QueryHandler(GetEmbeddingRuntimeEngineQuery)
export class GetEmbeddingRuntimeEngineHandler
  implements IQueryHandler<GetEmbeddingRuntimeEngineQuery>
{
  constructor(
    @Inject(EMBEDDING_RUNTIME_CATALOG_PORT)
    private readonly catalog: EmbeddingRuntimeCatalogPort,
  ) {}

  execute: Promise<EmbeddingRuntimeEngineBundle> {
    return Promise.resolve(this.catalog.engine);
  }
}

@QueryHandler(ListEmbeddingRuntimeProductsQuery)
export class ListEmbeddingRuntimeProductsHandler
  implements IQueryHandler<ListEmbeddingRuntimeProductsQuery>
{
  constructor(
    @Inject(EMBEDDING_RUNTIME_CATALOG_PORT)
    private readonly catalog: EmbeddingRuntimeCatalogPort,
  ) {}

  execute: Promise<EmbeddingRuntimeProductRow[]> {
    return Promise.resolve(this.catalog.listProducts);
  }
}

export const EMBEDDING_RUNTIME_HANDLERS = [GetEmbeddingRuntimeEngineHandler, ListEmbeddingRuntimeProductsHandler];
