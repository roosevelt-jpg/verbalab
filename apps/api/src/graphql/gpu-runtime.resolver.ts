import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetGpuRuntimeEngineQuery } from '../gpu-runtime/application/messages';
import { GqlGpuRuntimeEngine } from './gql.types';

@Resolver()
export class GpuRuntimeGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => GqlGpuRuntimeEngine, { name: 'gpuRuntimeEngine' })
  async gpuRuntimeEngine(): Promise<GqlGpuRuntimeEngine> {
    const catalog = await this.queries.execute(new GetGpuRuntimeEngineQuery());
    return {
      product: catalog.product,
      note: catalog.note,
      thinExecutionLayer: catalog.honesty.thinExecutionLayer,
      duplicatesProductLogic: catalog.honesty.duplicatesProductLogic,
      managesOrgsPoliciesBilling: catalog.honesty.managesOrgsPoliciesBilling,
      serviceMeshOs: catalog.honesty.serviceMeshOs,
    };
  }
}
