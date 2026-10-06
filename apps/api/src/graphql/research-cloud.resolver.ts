import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { ListResearchCloudProductsQuery } from '../research-cloud/application/messages';
import { GqlResearchCloudProduct } from './gql.types';

@Resolver
export class ResearchCloudGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query( => [GqlResearchCloudProduct], { name: 'researchCloudProducts' })
  researchCloudProducts: Promise<GqlResearchCloudProduct[]> {
    return this.queries.execute(new ListResearchCloudProductsQuery);
  }
}
