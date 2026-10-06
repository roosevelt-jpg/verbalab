import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetBenchmarkPlatformEngineQuery } from '../benchmark-platform/application/messages';
import { GqlBenchmarkPlatformEngine } from './gql.types';

@Resolver
export class BenchmarkPlatformGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query( => GqlBenchmarkPlatformEngine, { name: 'benchmarkPlatformEngine' })
  async benchmarkPlatformEngine: Promise<GqlBenchmarkPlatformEngine> {
    const catalog = await this.queries.execute(new GetBenchmarkPlatformEngineQuery);
    return {
      product: catalog.product,
      note: catalog.note,
      publicLeaderboardOs: catalog.honesty.publicLeaderboardOs,
    };
  }
}
