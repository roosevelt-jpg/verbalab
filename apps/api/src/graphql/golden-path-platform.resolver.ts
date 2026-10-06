import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetGoldenPathPlatformEngineQuery } from '../golden-path-platform/application/messages';
import { GqlGoldenPathPlatformEngine } from './gql.types';

@Resolver()
export class GoldenPathPlatformGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => GqlGoldenPathPlatformEngine, { name: 'goldenPathPlatformEngine' })
  async goldenPathPlatformEngine(): Promise<GqlGoldenPathPlatformEngine> {
    const catalog = await this.queries.execute(new GetGoldenPathPlatformEngineQuery());
    return {
      product: catalog.product,
      note: catalog.note,
      scaffoldingOs: catalog.honesty.scaffoldingOs,
    };
  }
}
