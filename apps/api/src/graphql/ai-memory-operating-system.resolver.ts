import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetAiMemoryOperatingSystemEngineQuery } from '../ai-memory-operating-system/application/messages';
import { GqlAiMemoryOperatingSystemEngine } from './gql.types';

@Resolver()
export class AiMemoryOperatingSystemGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => GqlAiMemoryOperatingSystemEngine, { name: 'aiMemoryOperatingSystemEngine' })
  async aiMemoryOperatingSystemEngine(): Promise<GqlAiMemoryOperatingSystemEngine> {
    const catalog = await this.queries.execute(new GetAiMemoryOperatingSystemEngineQuery());
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
