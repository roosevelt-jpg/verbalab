import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetTrustAnalyticsEngineQuery } from '../trust-analytics/application/messages';
import { GqlTrustAnalyticsEngine } from './gql.types';

@Resolver()
export class TrustAnalyticsGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => GqlTrustAnalyticsEngine, { name: 'trustAnalyticsEngine' })
  async trustAnalyticsEngine(): Promise<GqlTrustAnalyticsEngine> {
    const catalog = await this.queries.execute(new GetTrustAnalyticsEngineQuery());
    return {
      product: catalog.product,
      note: catalog.note,
      siemOs: catalog.honesty.siemOs,
    };
  }
}
