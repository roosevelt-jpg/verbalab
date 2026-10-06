import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetTranslationRuntimeEngineQuery, ListTranslationRuntimeProductsQuery } from './messages';
import {
  TRANSLATION_RUNTIME_CATALOG_PORT,
  TranslationRuntimeCatalogPort,
  TranslationRuntimeEngineBundle,
  TranslationRuntimeProductRow,
} from './ports';

@QueryHandler(GetTranslationRuntimeEngineQuery)
export class GetTranslationRuntimeEngineHandler
  implements IQueryHandler<GetTranslationRuntimeEngineQuery>
{
  constructor(
    @Inject(TRANSLATION_RUNTIME_CATALOG_PORT)
    private readonly catalog: TranslationRuntimeCatalogPort,
  ) {}

  execute: Promise<TranslationRuntimeEngineBundle> {
    return Promise.resolve(this.catalog.engine);
  }
}

@QueryHandler(ListTranslationRuntimeProductsQuery)
export class ListTranslationRuntimeProductsHandler
  implements IQueryHandler<ListTranslationRuntimeProductsQuery>
{
  constructor(
    @Inject(TRANSLATION_RUNTIME_CATALOG_PORT)
    private readonly catalog: TranslationRuntimeCatalogPort,
  ) {}

  execute: Promise<TranslationRuntimeProductRow[]> {
    return Promise.resolve(this.catalog.listProducts);
  }
}

export const TRANSLATION_RUNTIME_HANDLERS = [GetTranslationRuntimeEngineHandler, ListTranslationRuntimeProductsHandler];
