import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  GetVoiceProductsBundleQuery,
  ListVoiceProductsQuery,
} from './messages';
import {
  VOICE_CATALOG_PORT,
  VoiceCatalogPort,
  VoiceProductRow,
  VoiceProductsBundle,
} from './ports';

@QueryHandler(ListVoiceProductsQuery)
export class ListVoiceProductsHandler implements IQueryHandler<ListVoiceProductsQuery> {
  constructor(
    @Inject(VOICE_CATALOG_PORT) private readonly catalog: VoiceCatalogPort,
  ) {}

  execute: Promise<VoiceProductRow[]> {
    return Promise.resolve(this.catalog.listProducts);
  }
}

@QueryHandler(GetVoiceProductsBundleQuery)
export class GetVoiceProductsBundleHandler
  implements IQueryHandler<GetVoiceProductsBundleQuery>
{
  constructor(
    @Inject(VOICE_CATALOG_PORT) private readonly catalog: VoiceCatalogPort,
  ) {}

  execute: Promise<VoiceProductsBundle> {
    return Promise.resolve(this.catalog.products);
  }
}

export const VOICE_CLOUD_HANDLERS = [
  ListVoiceProductsHandler,
  GetVoiceProductsBundleHandler,
];
