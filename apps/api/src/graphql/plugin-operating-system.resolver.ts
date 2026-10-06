import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetPluginOperatingSystemEngineQuery } from '../plugin-operating-system/application/messages';
import { GqlPluginOperatingSystemEngine } from './gql.types';

@Resolver()
export class PluginOperatingSystemGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => GqlPluginOperatingSystemEngine, { name: 'pluginOperatingSystemEngine' })
  async pluginOperatingSystemEngine(): Promise<GqlPluginOperatingSystemEngine> {
    const catalog = await this.queries.execute(new GetPluginOperatingSystemEngineQuery());
    return {
      product: catalog.product,
      note: catalog.note,
      unifyingOrchestrationLayer: catalog.honesty.unifyingOrchestrationLayer,
      duplicatesKernelOrFabric: catalog.honesty.duplicatesKernelOrFabric,
      notLinux: catalog.honesty.notLinux,
      notKubernetes: catalog.honesty.notKubernetes,
      literalOsKernel: catalog.honesty.literalOsKernel,
      enterpriseEngineeringSystemOs: catalog.honesty.enterpriseEngineeringSystemOs,
    };
  }
}
