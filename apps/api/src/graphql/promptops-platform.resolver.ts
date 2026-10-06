import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetPromptopsPlatformEngineQuery } from '../promptops-platform/application/messages';
import { GqlPromptopsPlatformEngine } from './gql.types';

@Resolver
export class PromptopsPlatformGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query( => GqlPromptopsPlatformEngine, { name: 'promptopsPlatformEngine' })
  async promptopsPlatformEngine: Promise<GqlPromptopsPlatformEngine> {
    const catalog = await this.queries.execute(new GetPromptopsPlatformEngineQuery);
    return {
      product: catalog.product,
      note: catalog.note,
      langSmithOs: catalog.honesty.langSmithOs,
    };
  }
}
