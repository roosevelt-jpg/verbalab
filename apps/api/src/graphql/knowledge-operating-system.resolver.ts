import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetKnowledgeOperatingSystemEngineQuery } from '../knowledge-operating-system/application/messages';
import { GqlKnowledgeOperatingSystemEngine } from './gql.types';

@Resolver
export class KnowledgeOperatingSystemGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query( => GqlKnowledgeOperatingSystemEngine, { name: 'knowledgeOperatingSystemEngine' })
  async knowledgeOperatingSystemEngine: Promise<GqlKnowledgeOperatingSystemEngine> {
    const catalog = await this.queries.execute(new GetKnowledgeOperatingSystemEngineQuery);
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
