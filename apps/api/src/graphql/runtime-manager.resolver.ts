import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetRuntimeManagerEngineQuery } from '../runtime-manager/application/messages';
import { GqlRuntimeManagerEngine } from './gql.types';

@Resolver()
export class RuntimeManagerGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => GqlRuntimeManagerEngine, { name: 'runtimeManagerEngine' })
  async runtimeManagerEngine(): Promise<GqlRuntimeManagerEngine> {
    const catalog = await this.queries.execute(new GetRuntimeManagerEngineQuery());
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
