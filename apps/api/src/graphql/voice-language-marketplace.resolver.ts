import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetVoiceLanguageMarketplaceEngineQuery } from '../voice-language-marketplace/application/messages';
import {
  GqlVoiceLanguageMarketplaceCapability,
  GqlVoiceLanguageMarketplaceEngine,
} from './gql.types';

@Resolver()
export class VoiceLanguageMarketplaceGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => GqlVoiceLanguageMarketplaceEngine, { name: 'voiceLanguageMarketplaceEngine' })
  async voiceLanguageMarketplaceEngine(): Promise<GqlVoiceLanguageMarketplaceEngine> {
    const catalog = await this.queries.execute(new GetVoiceLanguageMarketplaceEngineQuery());
    return {
      product: catalog.product,
      note: catalog.note,
      capabilities: catalog.capabilities as GqlVoiceLanguageMarketplaceCapability[],
      elevenLabsOs: catalog.honesty.elevenLabsOs,
      voiceCdnOs: catalog.honesty.voiceCdnOs,
      celebrityWithoutRights: catalog.honesty.celebrityWithoutRights,
      crossTenantCloneSynthesis: catalog.honesty.crossTenantCloneSynthesis,
      storesRawCardData: catalog.honesty.storesRawCardData,
      stripeOrEquivalentRequired: catalog.honesty.stripeOrEquivalentRequired,
    };
  }
}
