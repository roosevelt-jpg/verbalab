import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetConnectorMarketplaceEngineQuery } from '../connector-marketplace/application/messages';
import {
  GqlConnectorMarketplaceCapability,
  GqlConnectorMarketplaceEngine,
} from './gql.types';

@Resolver
export class ConnectorMarketplaceGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query( => GqlConnectorMarketplaceEngine, { name: 'connectorMarketplaceEngine' })
  async connectorMarketplaceEngine: Promise<GqlConnectorMarketplaceEngine> {
    const catalog = await this.queries.execute(new GetConnectorMarketplaceEngineQuery);
    return {
      product: catalog.product,
      note: catalog.note,
      capabilities: catalog.capabilities as GqlConnectorMarketplaceCapability[],
      liveConnectorExecution: catalog.honesty.liveConnectorExecution,
      sandboxRequired: catalog.honesty.sandboxRequired,
      fabricPolicyHardGateRequired: catalog.honesty.fabricPolicyHardGateRequired,
      ipaasOs: catalog.honesty.ipaasOs,
      storesRawCardData: catalog.honesty.storesRawCardData,
      stripeOrEquivalentRequired: catalog.honesty.stripeOrEquivalentRequired,
    };
  }
}
