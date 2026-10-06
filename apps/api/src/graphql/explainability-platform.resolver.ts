import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetExplainabilityPlatformEngineQuery } from '../explainability-platform/application/messages';
import { GqlExplainabilityPlatformEngine } from './gql.types';

@Resolver
export class ExplainabilityPlatformGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query( => GqlExplainabilityPlatformEngine, { name: 'explainabilityPlatformEngine' })
  async explainabilityPlatformEngine: Promise<GqlExplainabilityPlatformEngine> {
    const catalog = await this.queries.execute(new GetExplainabilityPlatformEngineQuery);
    return {
      product: catalog.product,
      note: catalog.note,
      shapOs: catalog.honesty.shapOs,
    };
  }
}
