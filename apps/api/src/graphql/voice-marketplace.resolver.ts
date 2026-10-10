import { Query, Resolver } from '@nestjs/graphql';
import { VoiceMarketplaceService } from '../voice-marketplace/voice-marketplace.service';
import {
  GqlVoiceMarketplaceCapability,
  GqlVoiceMarketplaceEngine,
} from './gql.types';

@Resolver()
export class VoiceMarketplaceGraphqlResolver {
  constructor(private readonly marketplace: VoiceMarketplaceService) {}

  @Query(() => GqlVoiceMarketplaceEngine, { name: 'voiceMarketplaceEngine' })
  voiceMarketplaceEngine(): GqlVoiceMarketplaceEngine {
    const catalog = this.marketplace.engine();
    return {
      product: catalog.product,
      note: catalog.note,
      capabilities: catalog.capabilities as GqlVoiceMarketplaceCapability[],
      celebrityWithoutRights: catalog.architecture.celebrityWithoutRights,
      crossTenantCloneSynthesis: catalog.architecture.crossTenantCloneSynthesis,
      languagePackCount: catalog.languagePackCount,
    };
  }
}
