import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetAiSafetyPlatformEngineQuery } from '../ai-safety-platform/application/messages';
import { GqlAiSafetyPlatformEngine } from './gql.types';

@Resolver()
export class AiSafetyPlatformGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => GqlAiSafetyPlatformEngine, { name: 'aiSafetyPlatformEngine' })
  async aiSafetyPlatformEngine(): Promise<GqlAiSafetyPlatformEngine> {
    const catalog = await this.queries.execute(new GetAiSafetyPlatformEngineQuery());
    return {
      product: catalog.product,
      note: catalog.note,
      policyRuntimeIntegrated: catalog.honesty.policyRuntimeIntegrated,
    };
  }
}
