import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { VoiceLanguageMarketplaceModule } from '../voice-language-marketplace.module';
import { VOICE_LANGUAGE_MARKETPLACE_CATALOG_PORT } from './ports';
import { NestVoiceLanguageMarketplaceCatalogAdapter } from './nest-voice-language-marketplace-catalog.adapter';
import { VOICE_LANGUAGE_MARKETPLACE_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, VoiceLanguageMarketplaceModule],
  providers: [
    NestVoiceLanguageMarketplaceCatalogAdapter,
    {
      provide: VOICE_LANGUAGE_MARKETPLACE_CATALOG_PORT,
      useExisting: NestVoiceLanguageMarketplaceCatalogAdapter,
    },
    ...VOICE_LANGUAGE_MARKETPLACE_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class VoiceLanguageMarketplaceApplicationModule {}
