import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetAgentOperatingSystemEngineQuery } from '../agent-operating-system/application/messages';
import { GqlAgentOperatingSystemEngine } from './gql.types';

@Resolver
export class AgentOperatingSystemGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query( => GqlAgentOperatingSystemEngine, { name: 'agentOperatingSystemEngine' })
  async agentOperatingSystemEngine: Promise<GqlAgentOperatingSystemEngine> {
    const catalog = await this.queries.execute(new GetAgentOperatingSystemEngineQuery);
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
