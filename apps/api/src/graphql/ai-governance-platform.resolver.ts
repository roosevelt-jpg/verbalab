import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetAiGovernancePlatformEngineQuery } from '../ai-governance-platform/application/messages';
import { GqlAiGovernancePlatformEngine } from './gql.types';

@Resolver()
export class AiGovernancePlatformGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => GqlAiGovernancePlatformEngine, { name: 'aiGovernancePlatformEngine' })
  async aiGovernancePlatformEngine(): Promise<GqlAiGovernancePlatformEngine> {
    const catalog = await this.queries.execute(new GetAiGovernancePlatformEngineQuery());
    return {
      product: catalog.product,
      note: catalog.note,
      humanSignOffRequired: catalog.honesty.humanSignOffRequired,
    };
  }
}
