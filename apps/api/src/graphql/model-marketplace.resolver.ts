import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetModelMarketplaceEngineQuery } from '../model-marketplace/application/messages';
import {
  GqlModelMarketplaceCapability,
  GqlModelMarketplaceEngine,
} from './gql.types';

@Resolver
export class ModelMarketplaceGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query( => GqlModelMarketplaceEngine, { name: 'modelMarketplaceEngine' })
  async modelMarketplaceEngine: Promise<GqlModelMarketplaceEngine> {
    const catalog = await this.queries.execute(new GetModelMarketplaceEngineQuery);
    return {
      product: catalog.product,
      note: catalog.note,
      capabilities: catalog.capabilities as GqlModelMarketplaceCapability[],
      huggingFaceOs: catalog.honesty.huggingFaceOs,
      weightHostingOs: catalog.honesty.weightHostingOs,
      storesRawCardData: catalog.honesty.storesRawCardData,
      stripeOrEquivalentRequired: catalog.honesty.stripeOrEquivalentRequired,
    };
  }
}
