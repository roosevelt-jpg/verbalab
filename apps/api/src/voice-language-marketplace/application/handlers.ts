import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetVoiceLanguageMarketplaceEngineQuery } from './messages';
import {
  VOICE_LANGUAGE_MARKETPLACE_CATALOG_PORT,
  VoiceLanguageMarketplaceCatalogPort,
  VoiceLanguageMarketplaceEngineBundle,
} from './ports';

@QueryHandler(GetVoiceLanguageMarketplaceEngineQuery)
export class GetVoiceLanguageMarketplaceEngineHandler
  implements IQueryHandler<GetVoiceLanguageMarketplaceEngineQuery>
{
  constructor(
    @Inject(VOICE_LANGUAGE_MARKETPLACE_CATALOG_PORT)
    private readonly catalog: VoiceLanguageMarketplaceCatalogPort,
  ) {}

  execute(): Promise<VoiceLanguageMarketplaceEngineBundle> {
    return Promise.resolve(this.catalog.engine());
  }
}

export const VOICE_LANGUAGE_MARKETPLACE_HANDLERS = [GetVoiceLanguageMarketplaceEngineHandler];
