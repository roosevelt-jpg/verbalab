import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetAgentopsPlatformEngineQuery } from '../agentops-platform/application/messages';
import { GqlAgentopsPlatformEngine } from './gql.types';

@Resolver
export class AgentopsPlatformGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query( => GqlAgentopsPlatformEngine, { name: 'agentopsPlatformEngine' })
  async agentopsPlatformEngine: Promise<GqlAgentopsPlatformEngine> {
    const catalog = await this.queries.execute(new GetAgentopsPlatformEngineQuery);
    return {
      product: catalog.product,
      note: catalog.note,
      policyViolationsVisible: catalog.honesty.policyViolationsVisible,
    };
  }
}
