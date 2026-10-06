import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetOpenSciencePlatformEngineQuery } from '../open-science-platform/application/messages';
import { GqlOpenSciencePlatformEngine } from './gql.types';

@Resolver()
export class OpenSciencePlatformGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => GqlOpenSciencePlatformEngine, { name: 'openSciencePlatformEngine' })
  async openSciencePlatformEngine(): Promise<GqlOpenSciencePlatformEngine> {
    const catalog = await this.queries.execute(new GetOpenSciencePlatformEngineQuery());
    return {
      product: catalog.product,
      note: catalog.note,
      traditionalKnowledgeConsentRequired: catalog.honesty.traditionalKnowledgeConsentRequired,
    };
  }
}
