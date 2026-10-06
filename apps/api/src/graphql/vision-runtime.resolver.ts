import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetVisionRuntimeEngineQuery } from '../vision-runtime/application/messages';
import { GqlVisionRuntimeEngine } from './gql.types';

@Resolver()
export class VisionRuntimeGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => GqlVisionRuntimeEngine, { name: 'visionRuntimeEngine' })
  async visionRuntimeEngine(): Promise<GqlVisionRuntimeEngine> {
    const catalog = await this.queries.execute(new GetVisionRuntimeEngineQuery());
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
