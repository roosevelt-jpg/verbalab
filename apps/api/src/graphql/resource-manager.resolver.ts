import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetResourceManagerEngineQuery } from '../resource-manager/application/messages';
import { GqlResourceManagerEngine } from './gql.types';

@Resolver
export class ResourceManagerGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query( => GqlResourceManagerEngine, { name: 'resourceManagerEngine' })
  async resourceManagerEngine: Promise<GqlResourceManagerEngine> {
    const catalog = await this.queries.execute(new GetResourceManagerEngineQuery);
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
