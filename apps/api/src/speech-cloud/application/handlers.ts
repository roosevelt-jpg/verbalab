import { Inject, Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  GetSpeechProductsBundleQuery,
  ListSpeechProductsQuery,
} from './messages';
import {
  SPEECH_CATALOG_PORT,
  SpeechCatalogPort,
  SpeechProductRow,
  SpeechProductsBundle,
} from './ports';

@QueryHandler(ListSpeechProductsQuery)
export class ListSpeechProductsHandler implements IQueryHandler<ListSpeechProductsQuery> {
  constructor(
    @Inject(SPEECH_CATALOG_PORT) private readonly catalog: SpeechCatalogPort,
  ) {}

  execute: Promise<SpeechProductRow[]> {
    return Promise.resolve(this.catalog.listProducts);
  }
}

@QueryHandler(GetSpeechProductsBundleQuery)
export class GetSpeechProductsBundleHandler
  implements IQueryHandler<GetSpeechProductsBundleQuery>
{
  constructor(
    @Inject(SPEECH_CATALOG_PORT) private readonly catalog: SpeechCatalogPort,
  ) {}

  execute: Promise<SpeechProductsBundle> {
    return Promise.resolve(this.catalog.products);
  }
}

export const SPEECH_CLOUD_HANDLERS = [
  ListSpeechProductsHandler,
  GetSpeechProductsBundleHandler,
];
