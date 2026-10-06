import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetAfricanKnowledgeGraphEngineQuery, ListAfricanKnowledgeGraphProductsQuery } from './messages';
import {
  AFRICAN_KNOWLEDGE_GRAPH_CATALOG_PORT,
  AfricanKnowledgeGraphCatalogPort,
  AfricanKnowledgeGraphEngineBundle,
  AfricanKnowledgeGraphProductRow,
} from './ports';

@QueryHandler(GetAfricanKnowledgeGraphEngineQuery)
export class GetAfricanKnowledgeGraphEngineHandler
  implements IQueryHandler<GetAfricanKnowledgeGraphEngineQuery>
{
  constructor(
    @Inject(AFRICAN_KNOWLEDGE_GRAPH_CATALOG_PORT)
    private readonly catalog: AfricanKnowledgeGraphCatalogPort,
  ) {}

  execute: Promise<AfricanKnowledgeGraphEngineBundle> {
    return Promise.resolve(this.catalog.engine);
  }
}

@QueryHandler(ListAfricanKnowledgeGraphProductsQuery)
export class ListAfricanKnowledgeGraphProductsHandler
  implements IQueryHandler<ListAfricanKnowledgeGraphProductsQuery>
{
  constructor(
    @Inject(AFRICAN_KNOWLEDGE_GRAPH_CATALOG_PORT)
    private readonly catalog: AfricanKnowledgeGraphCatalogPort,
  ) {}

  execute: Promise<AfricanKnowledgeGraphProductRow[]> {
    return Promise.resolve(this.catalog.listProducts);
  }
}

export const AFRICAN_KNOWLEDGE_GRAPH_HANDLERS = [GetAfricanKnowledgeGraphEngineHandler, ListAfricanKnowledgeGraphProductsHandler];
