import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetKnowledgeRuntimeEngineQuery, ListKnowledgeRuntimeProductsQuery } from './messages';
import {
  KNOWLEDGE_RUNTIME_CATALOG_PORT,
  KnowledgeRuntimeCatalogPort,
  KnowledgeRuntimeEngineBundle,
  KnowledgeRuntimeProductRow,
} from './ports';

@QueryHandler(GetKnowledgeRuntimeEngineQuery)
export class GetKnowledgeRuntimeEngineHandler
  implements IQueryHandler<GetKnowledgeRuntimeEngineQuery>
{
  constructor(
    @Inject(KNOWLEDGE_RUNTIME_CATALOG_PORT)
    private readonly catalog: KnowledgeRuntimeCatalogPort,
  ) {}

  execute(): Promise<KnowledgeRuntimeEngineBundle> {
    return Promise.resolve(this.catalog.engine());
  }
}

@QueryHandler(ListKnowledgeRuntimeProductsQuery)
export class ListKnowledgeRuntimeProductsHandler
  implements IQueryHandler<ListKnowledgeRuntimeProductsQuery>
{
  constructor(
    @Inject(KNOWLEDGE_RUNTIME_CATALOG_PORT)
    private readonly catalog: KnowledgeRuntimeCatalogPort,
  ) {}

  execute(): Promise<KnowledgeRuntimeProductRow[]> {
    return Promise.resolve(this.catalog.listProducts());
  }
}

export const KNOWLEDGE_RUNTIME_HANDLERS = [GetKnowledgeRuntimeEngineHandler, ListKnowledgeRuntimeProductsHandler];
