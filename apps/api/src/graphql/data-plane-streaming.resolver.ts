import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetDataPlaneStreamingEngineQuery } from '../data-plane-streaming/application/messages';
import { GqlDataPlaneStreamingEngine } from './gql.types';

@Resolver
export class DataPlaneStreamingGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query( => GqlDataPlaneStreamingEngine, { name: 'dataPlaneStreamingEngine' })
  async dataPlaneStreamingEngine: Promise<GqlDataPlaneStreamingEngine> {
    const catalog = await this.queries.execute(new GetDataPlaneStreamingEngineQuery);
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
