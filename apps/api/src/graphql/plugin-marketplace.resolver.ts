import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetPluginMarketplaceEngineQuery } from '../plugin-marketplace/application/messages';
import {
  GqlPluginMarketplaceCapability,
  GqlPluginMarketplaceEngine,
} from './gql.types';

@Resolver()
export class PluginMarketplaceGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => GqlPluginMarketplaceEngine, { name: 'pluginMarketplaceEngine' })
  async pluginMarketplaceEngine(): Promise<GqlPluginMarketplaceEngine> {
    const catalog = await this.queries.execute(new GetPluginMarketplaceEngineQuery());
    return {
      product: catalog.product,
      note: catalog.note,
      capabilities: catalog.capabilities as GqlPluginMarketplaceCapability[],
      liveCodeExecution: catalog.honesty.liveCodeExecution,
      sandboxRequired: catalog.honesty.sandboxRequired,
      pluginPolicyHardGateRequired: catalog.honesty.pluginPolicyHardGateRequired,
    };
  }
}
