import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetControlPlaneAnalyticsEngineQuery } from '../control-plane-analytics/application/messages';
import { GqlControlPlaneAnalyticsEngine } from './gql.types';

@Resolver()
export class ControlPlaneAnalyticsGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => GqlControlPlaneAnalyticsEngine, { name: 'controlPlaneAnalyticsEngine' })
  async controlPlaneAnalyticsEngine(): Promise<GqlControlPlaneAnalyticsEngine> {
    const catalog = await this.queries.execute(new GetControlPlaneAnalyticsEngineQuery());
    return {
      product: catalog.product,
      note: catalog.note,
      aggregatesSiblingHubs: catalog.honesty.aggregatesSiblingHubs,
    };
  }
}
