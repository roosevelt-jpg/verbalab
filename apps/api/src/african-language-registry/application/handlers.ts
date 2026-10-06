import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetAfricanLanguageRegistryEngineQuery, ListAfricanLanguageRegistryProductsQuery } from './messages';
import {
  AFRICAN_LANGUAGE_REGISTRY_CATALOG_PORT,
  AfricanLanguageRegistryCatalogPort,
  AfricanLanguageRegistryEngineBundle,
  AfricanLanguageRegistryProductRow,
} from './ports';

@QueryHandler(GetAfricanLanguageRegistryEngineQuery)
export class GetAfricanLanguageRegistryEngineHandler
  implements IQueryHandler<GetAfricanLanguageRegistryEngineQuery>
{
  constructor(
    @Inject(AFRICAN_LANGUAGE_REGISTRY_CATALOG_PORT)
    private readonly catalog: AfricanLanguageRegistryCatalogPort,
  ) {}

  execute: Promise<AfricanLanguageRegistryEngineBundle> {
    return Promise.resolve(this.catalog.engine);
  }
}

@QueryHandler(ListAfricanLanguageRegistryProductsQuery)
export class ListAfricanLanguageRegistryProductsHandler
  implements IQueryHandler<ListAfricanLanguageRegistryProductsQuery>
{
  constructor(
    @Inject(AFRICAN_LANGUAGE_REGISTRY_CATALOG_PORT)
    private readonly catalog: AfricanLanguageRegistryCatalogPort,
  ) {}

  execute: Promise<AfricanLanguageRegistryProductRow[]> {
    return Promise.resolve(this.catalog.listProducts);
  }
}

export const AFRICAN_LANGUAGE_REGISTRY_HANDLERS = [GetAfricanLanguageRegistryEngineHandler, ListAfricanLanguageRegistryProductsHandler];
