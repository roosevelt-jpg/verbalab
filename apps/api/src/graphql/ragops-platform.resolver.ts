import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetRagopsPlatformEngineQuery } from '../ragops-platform/application/messages';
import { GqlRagopsPlatformEngine } from './gql.types';

@Resolver
export class RagopsPlatformGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query( => GqlRagopsPlatformEngine, { name: 'ragopsPlatformEngine' })
  async ragopsPlatformEngine: Promise<GqlRagopsPlatformEngine> {
    const catalog = await this.queries.execute(new GetRagopsPlatformEngineQuery);
    return {
      product: catalog.product,
      note: catalog.note,
      vectorDbOs: catalog.honesty.vectorDbOs,
    };
  }
}
