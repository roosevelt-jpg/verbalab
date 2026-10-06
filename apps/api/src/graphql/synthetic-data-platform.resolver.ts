import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetSyntheticDataPlatformEngineQuery } from '../synthetic-data-platform/application/messages';
import { GqlSyntheticDataPlatformEngine } from './gql.types';

@Resolver
export class SyntheticDataPlatformGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query( => GqlSyntheticDataPlatformEngine, { name: 'syntheticDataPlatformEngine' })
  async syntheticDataPlatformEngine: Promise<GqlSyntheticDataPlatformEngine> {
    const catalog = await this.queries.execute(new GetSyntheticDataPlatformEngineQuery);
    return {
      product: catalog.product,
      note: catalog.note,
      syntheticLabelRequired: catalog.honesty.syntheticLabelRequired,
    };
  }
}
