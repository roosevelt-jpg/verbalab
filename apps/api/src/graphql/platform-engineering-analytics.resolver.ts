import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetPlatformEngineeringAnalyticsEngineQuery } from '../platform-engineering-analytics/application/messages';
import { GqlPlatformEngineeringAnalyticsEngine } from './gql.types';

@Resolver
export class PlatformEngineeringAnalyticsGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query( => GqlPlatformEngineeringAnalyticsEngine, { name: 'platformEngineeringAnalyticsEngine' })
  async platformEngineeringAnalyticsEngine: Promise<GqlPlatformEngineeringAnalyticsEngine> {
    const catalog = await this.queries.execute(new GetPlatformEngineeringAnalyticsEngineQuery);
    return {
      product: catalog.product,
      note: catalog.note,
      devopsIntelligenceOs: catalog.honesty.devopsIntelligenceOs,
    };
  }
}
