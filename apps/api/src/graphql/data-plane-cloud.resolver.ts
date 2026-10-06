import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { ListDataPlaneCloudProductsQuery } from '../data-plane-cloud/application/messages';
import { GqlDataPlaneCloudProduct } from './gql.types';

@Resolver
export class DataPlaneCloudGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query( => [GqlDataPlaneCloudProduct], { name: 'dataPlaneCloudProducts' })
  async dataPlaneCloudProducts: Promise<GqlDataPlaneCloudProduct[]> {
    return this.queries.execute(new ListDataPlaneCloudProductsQuery);
  }
}
