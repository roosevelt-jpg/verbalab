import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetPromptMarketplaceEngineQuery } from '../prompt-marketplace/application/messages';
import {
  GqlPromptMarketplaceCapability,
  GqlPromptMarketplaceEngine,
} from './gql.types';

@Resolver
export class PromptMarketplaceGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query( => GqlPromptMarketplaceEngine, { name: 'promptMarketplaceEngine' })
  async promptMarketplaceEngine: Promise<GqlPromptMarketplaceEngine> {
    const catalog = await this.queries.execute(new GetPromptMarketplaceEngineQuery);
    return {
      product: catalog.product,
      note: catalog.note,
      capabilities: catalog.capabilities as GqlPromptMarketplaceCapability[],
      promptMeshOs: catalog.honesty.promptMeshOs,
      autoPromptResearchOs: catalog.honesty.autoPromptResearchOs,
      storesRawCardData: catalog.honesty.storesRawCardData,
      stripeOrEquivalentRequired: catalog.honesty.stripeOrEquivalentRequired,
    };
  }
}
