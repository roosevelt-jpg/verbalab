import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetWorkflowMarketplaceEngineQuery } from '../workflow-marketplace/application/messages';
import {
  GqlWorkflowMarketplaceCapability,
  GqlWorkflowMarketplaceEngine,
} from './gql.types';

@Resolver
export class WorkflowMarketplaceGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query( => GqlWorkflowMarketplaceEngine, { name: 'workflowMarketplaceEngine' })
  async workflowMarketplaceEngine: Promise<GqlWorkflowMarketplaceEngine> {
    const catalog = await this.queries.execute(new GetWorkflowMarketplaceEngineQuery);
    return {
      product: catalog.product,
      note: catalog.note,
      capabilities: catalog.capabilities as GqlWorkflowMarketplaceCapability[],
      liveStepExecution: catalog.honesty.liveStepExecution,
      sandboxRequired: catalog.honesty.sandboxRequired,
      workflowPolicyHardGateRequired: catalog.honesty.workflowPolicyHardGateRequired,
      storesRawCardData: catalog.honesty.storesRawCardData,
      stripeOrEquivalentRequired: catalog.honesty.stripeOrEquivalentRequired,
    };
  }
}
