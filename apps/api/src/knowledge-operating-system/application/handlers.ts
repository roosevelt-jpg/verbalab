import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetKnowledgeOperatingSystemEngineQuery, ListKnowledgeOperatingSystemProductsQuery } from './messages';
import {
  KNOWLEDGE_OPERATING_SYSTEM_CATALOG_PORT,
  KnowledgeOperatingSystemCatalogPort,
  KnowledgeOperatingSystemEngineBundle,
  KnowledgeOperatingSystemProductRow,
} from './ports';

@QueryHandler(GetKnowledgeOperatingSystemEngineQuery)
export class GetKnowledgeOperatingSystemEngineHandler
  implements IQueryHandler<GetKnowledgeOperatingSystemEngineQuery>
{
  constructor(
    @Inject(KNOWLEDGE_OPERATING_SYSTEM_CATALOG_PORT)
    private readonly catalog: KnowledgeOperatingSystemCatalogPort,
  ) {}

  execute: Promise<KnowledgeOperatingSystemEngineBundle> {
    return Promise.resolve(this.catalog.engine);
  }
}

@QueryHandler(ListKnowledgeOperatingSystemProductsQuery)
export class ListKnowledgeOperatingSystemProductsHandler
  implements IQueryHandler<ListKnowledgeOperatingSystemProductsQuery>
{
  constructor(
    @Inject(KNOWLEDGE_OPERATING_SYSTEM_CATALOG_PORT)
    private readonly catalog: KnowledgeOperatingSystemCatalogPort,
  ) {}

  execute: Promise<KnowledgeOperatingSystemProductRow[]> {
    return Promise.resolve(this.catalog.listProducts);
  }
}

export const KNOWLEDGE_OPERATING_SYSTEM_HANDLERS = [GetKnowledgeOperatingSystemEngineHandler, ListKnowledgeOperatingSystemProductsHandler];
