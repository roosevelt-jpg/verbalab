import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetVoiceRuntimeEngineQuery, ListVoiceRuntimeProductsQuery } from './messages';
import {
  VOICE_RUNTIME_CATALOG_PORT,
  VoiceRuntimeCatalogPort,
  VoiceRuntimeEngineBundle,
  VoiceRuntimeProductRow,
} from './ports';

@QueryHandler(GetVoiceRuntimeEngineQuery)
export class GetVoiceRuntimeEngineHandler
  implements IQueryHandler<GetVoiceRuntimeEngineQuery>
{
  constructor(
    @Inject(VOICE_RUNTIME_CATALOG_PORT)
    private readonly catalog: VoiceRuntimeCatalogPort,
  ) {}

  execute(): Promise<VoiceRuntimeEngineBundle> {
    return Promise.resolve(this.catalog.engine());
  }
}

@QueryHandler(ListVoiceRuntimeProductsQuery)
export class ListVoiceRuntimeProductsHandler
  implements IQueryHandler<ListVoiceRuntimeProductsQuery>
{
  constructor(
    @Inject(VOICE_RUNTIME_CATALOG_PORT)
    private readonly catalog: VoiceRuntimeCatalogPort,
  ) {}

  execute(): Promise<VoiceRuntimeProductRow[]> {
    return Promise.resolve(this.catalog.listProducts());
  }
}

export const VOICE_RUNTIME_HANDLERS = [GetVoiceRuntimeEngineHandler, ListVoiceRuntimeProductsHandler];
