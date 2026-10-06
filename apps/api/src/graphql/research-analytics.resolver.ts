import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetResearchAnalyticsEngineQuery } from '../research-analytics/application/messages';
import { GqlResearchAnalyticsEngine } from './gql.types';

@Resolver()
export class ResearchAnalyticsGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => GqlResearchAnalyticsEngine, { name: 'researchAnalyticsEngine' })
  async researchAnalyticsEngine(): Promise<GqlResearchAnalyticsEngine> {
    const catalog = await this.queries.execute(new GetResearchAnalyticsEngineQuery());
    return {
      product: catalog.product,
      note: catalog.note,
      aiSovereigntyOs: catalog.honesty.aiSovereigntyOs,
    };
  }
}
