import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetGlobalRoutingControllerEngineQuery } from '../global-routing-controller/application/messages';
import { GqlGlobalRoutingControllerEngine } from './gql.types';

@Resolver
export class GlobalRoutingControllerGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query( => GqlGlobalRoutingControllerEngine, { name: 'globalRoutingControllerEngine' })
  async globalRoutingControllerEngine: Promise<GqlGlobalRoutingControllerEngine> {
    const catalog = await this.queries.execute(new GetGlobalRoutingControllerEngineQuery);
    return {
      product: catalog.product,
      note: catalog.note,
      istioOs: catalog.honesty.istioOs,
    };
  }
}
