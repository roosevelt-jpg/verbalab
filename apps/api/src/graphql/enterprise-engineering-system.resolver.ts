import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { ListEnterpriseEngineeringSystemProductsQuery } from '../enterprise-engineering-system/application/messages';
import { GqlEnterpriseEngineeringSystemProduct } from './gql.types';

@Resolver()
export class EnterpriseEngineeringSystemGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => [GqlEnterpriseEngineeringSystemProduct], { name: 'enterpriseEngineeringSystemProducts' })
  async enterpriseEngineeringSystemProducts(): Promise<GqlEnterpriseEngineeringSystemProduct[]> {
    return this.queries.execute(new ListEnterpriseEngineeringSystemProductsQuery());
  }
}
