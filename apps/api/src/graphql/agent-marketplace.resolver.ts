import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetAgentMarketplaceEngineQuery } from '../agent-marketplace/application/messages';
import {
  GqlAgentMarketplaceCapability,
  GqlAgentMarketplaceEngine,
} from './gql.types';

@Resolver()
export class AgentMarketplaceGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => GqlAgentMarketplaceEngine, { name: 'agentMarketplaceEngine' })
  async agentMarketplaceEngine(): Promise<GqlAgentMarketplaceEngine> {
    const catalog = await this.queries.execute(new GetAgentMarketplaceEngineQuery());
    return {
      product: catalog.product,
      note: catalog.note,
      capabilities: catalog.capabilities as GqlAgentMarketplaceCapability[],
      liveToolExecution: catalog.honesty.liveToolExecution,
      sandboxRequired: catalog.honesty.sandboxRequired,
      agentPolicyHardGateRequired: catalog.honesty.agentPolicyHardGateRequired,
      storesRawCardData: catalog.honesty.storesRawCardData,
      stripeOrEquivalentRequired: catalog.honesty.stripeOrEquivalentRequired,
    };
  }
}
