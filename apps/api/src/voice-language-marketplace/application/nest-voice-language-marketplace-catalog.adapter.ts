import { Injectable } from '@nestjs/common';
import { VoiceLanguageMarketplaceService } from '../voice-language-marketplace.service';
import {
  VoiceLanguageMarketplaceCatalogPort,
  VoiceLanguageMarketplaceEngineBundle,
} from './ports';

@Injectable()
export class NestVoiceLanguageMarketplaceCatalogAdapter implements VoiceLanguageMarketplaceCatalogPort {
  constructor(private readonly marketplace: VoiceLanguageMarketplaceService) {}

  engine(): VoiceLanguageMarketplaceEngineBundle {
    return this.marketplace.engine();
  }
}
