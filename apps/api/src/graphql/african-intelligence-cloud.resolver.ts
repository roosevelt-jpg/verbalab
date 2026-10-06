import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { ListAfricanIntelligenceCloudProductsQuery } from '../african-intelligence-cloud/application/messages';
import { GqlAfricanIntelligenceCloudProduct } from './gql.types';

@Resolver()
export class AfricanIntelligenceCloudGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => [GqlAfricanIntelligenceCloudProduct], { name: 'africanIntelligenceCloudProducts' })
  africanIntelligenceCloudProducts(): Promise<GqlAfricanIntelligenceCloudProduct[]> {
    return this.queries.execute(new ListAfricanIntelligenceCloudProductsQuery());
  }
}
