import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { ListVaiosProductsQuery } from '../vaios/application/messages';
import { GqlVaiosProduct } from './gql.types';

@Resolver
export class VaiosGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query( => [GqlVaiosProduct], { name: 'vaiosProducts' })
  async vaiosProducts: Promise<GqlVaiosProduct[]> {
    return this.queries.execute(new ListVaiosProductsQuery);
  }
}
