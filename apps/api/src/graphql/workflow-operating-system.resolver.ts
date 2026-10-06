import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetWorkflowOperatingSystemEngineQuery } from '../workflow-operating-system/application/messages';
import { GqlWorkflowOperatingSystemEngine } from './gql.types';

@Resolver
export class WorkflowOperatingSystemGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query( => GqlWorkflowOperatingSystemEngine, { name: 'workflowOperatingSystemEngine' })
  async workflowOperatingSystemEngine: Promise<GqlWorkflowOperatingSystemEngine> {
    const catalog = await this.queries.execute(new GetWorkflowOperatingSystemEngineQuery);
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
