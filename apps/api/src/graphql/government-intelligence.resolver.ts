import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetGovernmentIntelligenceEngineQuery } from '../government-intelligence/application/messages';
import { GqlGovernmentIntelligenceEngine } from './gql.types';

@Resolver()
export class GovernmentIntelligenceGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => GqlGovernmentIntelligenceEngine, { name: 'governmentIntelligenceEngine' })
  async governmentIntelligenceEngine(): Promise<GqlGovernmentIntelligenceEngine> {
    const catalog = await this.queries.execute(new GetGovernmentIntelligenceEngineQuery());
    return {
      product: catalog.product,
      note: catalog.note,
      officialGuidanceMustBeSourced: catalog.honesty.officialGuidanceMustBeSourced,
    };
  }
}
