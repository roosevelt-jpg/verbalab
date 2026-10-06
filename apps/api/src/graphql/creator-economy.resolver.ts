import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetCreatorEconomyEngineQuery } from '../creator-economy/application/messages';
import { GqlCreatorEconomyCapability, GqlCreatorEconomyEngine } from './gql.types';

@Resolver
export class CreatorEconomyGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query( => GqlCreatorEconomyEngine, { name: 'creatorEconomyEngine' })
  async creatorEconomyEngine: Promise<GqlCreatorEconomyEngine> {
    const catalog = await this.queries.execute(new GetCreatorEconomyEngineQuery);
    return {
      product: catalog.product,
      note: catalog.note,
      capabilities: catalog.capabilities as GqlCreatorEconomyCapability[],
      paymentProcessorOs: catalog.honesty.paymentProcessorOs,
      taxHandlingComplete: catalog.honesty.taxHandlingComplete,
      disputeChargebackComplete: catalog.honesty.disputeChargebackComplete,
      creatorPayoutMathVerifiedLive: catalog.honesty.creatorPayoutMathVerifiedLive,
      creatorPayoutMathHandCheckedInTests: catalog.honesty.creatorPayoutMathHandCheckedInTests,
      storesRawCardData: catalog.honesty.storesRawCardData,
      stripeOrEquivalentRequired: catalog.honesty.stripeOrEquivalentRequired,
    };
  }
}
