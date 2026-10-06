import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { ListEcosystemProductsQuery } from '../ecosystem-cloud/application/messages';
import { GqlEcosystemProduct } from './gql.types';

@Resolver
export class EcosystemCloudGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query( => [GqlEcosystemProduct], { name: 'ecosystemProducts' })
  ecosystemProducts: Promise<GqlEcosystemProduct[]> {
    return this.queries.execute(new ListEcosystemProductsQuery);
  }
}
