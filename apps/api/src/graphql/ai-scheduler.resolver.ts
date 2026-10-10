import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetAiSchedulerEngineQuery } from '../ai-scheduler/application/messages';
import { GqlAiSchedulerEngine } from './gql.types';

@Resolver()
export class AiSchedulerGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => GqlAiSchedulerEngine, { name: 'aiSchedulerEngine' })
  async aiSchedulerEngine(): Promise<GqlAiSchedulerEngine> {
    const catalog = await this.queries.execute(new GetAiSchedulerEngineQuery());
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
