import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { ListPlatformEngineeringCloudProductsQuery } from '../platform-engineering-cloud/application/messages';
import { GqlPlatformEngineeringCloudProduct } from './gql.types';

@Resolver
export class PlatformEngineeringCloudGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query( => [GqlPlatformEngineeringCloudProduct], { name: 'platformEngineeringCloudProducts' })
  async platformEngineeringCloudProducts: Promise<GqlPlatformEngineeringCloudProduct[]> {
    return this.queries.execute(new ListPlatformEngineeringCloudProductsQuery);
  }
}
