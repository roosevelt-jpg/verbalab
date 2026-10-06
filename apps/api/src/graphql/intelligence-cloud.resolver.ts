import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { ListIntelligenceProductsQuery } from '../intelligence-cloud/application/messages';
import { GqlIntelligenceProduct } from './gql.types';

@Resolver
export class IntelligenceCloudGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query( => [GqlIntelligenceProduct], { name: 'intelligenceProducts' })
  intelligenceProducts: Promise<GqlIntelligenceProduct[]> {
    return this.queries.execute(new ListIntelligenceProductsQuery);
  }
}
