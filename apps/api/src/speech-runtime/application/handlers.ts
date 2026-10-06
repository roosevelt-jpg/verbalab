import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetSpeechRuntimeEngineQuery, ListSpeechRuntimeProductsQuery } from './messages';
import {
  SPEECH_RUNTIME_CATALOG_PORT,
  SpeechRuntimeCatalogPort,
  SpeechRuntimeEngineBundle,
  SpeechRuntimeProductRow,
} from './ports';

@QueryHandler(GetSpeechRuntimeEngineQuery)
export class GetSpeechRuntimeEngineHandler
  implements IQueryHandler<GetSpeechRuntimeEngineQuery>
{
  constructor(
    @Inject(SPEECH_RUNTIME_CATALOG_PORT)
    private readonly catalog: SpeechRuntimeCatalogPort,
  ) {}

  execute(): Promise<SpeechRuntimeEngineBundle> {
    return Promise.resolve(this.catalog.engine());
  }
}

@QueryHandler(ListSpeechRuntimeProductsQuery)
export class ListSpeechRuntimeProductsHandler
  implements IQueryHandler<ListSpeechRuntimeProductsQuery>
{
  constructor(
    @Inject(SPEECH_RUNTIME_CATALOG_PORT)
    private readonly catalog: SpeechRuntimeCatalogPort,
  ) {}

  execute(): Promise<SpeechRuntimeProductRow[]> {
    return Promise.resolve(this.catalog.listProducts());
  }
}

export const SPEECH_RUNTIME_HANDLERS = [GetSpeechRuntimeEngineHandler, ListSpeechRuntimeProductsHandler];
