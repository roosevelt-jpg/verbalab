import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { ListTrustCloudProductsQuery } from '../trust-cloud/application/messages';
import { GqlTrustCloudProduct } from './gql.types';

@Resolver()
export class TrustCloudGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => [GqlTrustCloudProduct], { name: 'trustCloudProducts' })
  async trustCloudProducts(): Promise<GqlTrustCloudProduct[]> {
    return this.queries.execute(new ListTrustCloudProductsQuery());
  }
}
