import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  GetKnowledgeProductsBundleQuery,
  ListKnowledgeProductsQuery,
} from './messages';
import {
  KNOWLEDGE_CATALOG_PORT,
  KnowledgeCatalogPort,
  KnowledgeProductRow,
  KnowledgeProductsBundle,
} from './ports';

@QueryHandler(ListKnowledgeProductsQuery)
export class ListKnowledgeProductsHandler
  implements IQueryHandler<ListKnowledgeProductsQuery>
{
  constructor(
    @Inject(KNOWLEDGE_CATALOG_PORT) private readonly catalog: KnowledgeCatalogPort,
  ) {}

  execute: Promise<KnowledgeProductRow[]> {
    return Promise.resolve(this.catalog.listProducts);
  }
}

@QueryHandler(GetKnowledgeProductsBundleQuery)
export class GetKnowledgeProductsBundleHandler
  implements IQueryHandler<GetKnowledgeProductsBundleQuery>
{
  constructor(
    @Inject(KNOWLEDGE_CATALOG_PORT) private readonly catalog: KnowledgeCatalogPort,
  ) {}

  execute: Promise<KnowledgeProductsBundle> {
    return Promise.resolve(this.catalog.products);
  }
}

export const KNOWLEDGE_CLOUD_HANDLERS = [
  ListKnowledgeProductsHandler,
  GetKnowledgeProductsBundleHandler,
];
