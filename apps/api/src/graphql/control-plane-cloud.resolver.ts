import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { ListControlPlaneCloudProductsQuery } from '../control-plane-cloud/application/messages';
import { GqlControlPlaneCloudProduct } from './gql.types';

@Resolver
export class ControlPlaneCloudGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query( => [GqlControlPlaneCloudProduct], { name: 'controlPlaneCloudProducts' })
  async controlPlaneCloudProducts: Promise<GqlControlPlaneCloudProduct[]> {
    return this.queries.execute(new ListControlPlaneCloudProductsQuery);
  }
}
