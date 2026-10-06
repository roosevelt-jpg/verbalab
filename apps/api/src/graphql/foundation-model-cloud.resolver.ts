import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { ListFoundationModelCloudProductsQuery } from '../foundation-model-cloud/application/messages';
import { GqlFoundationModelCloudProduct } from './gql.types';

@Resolver
export class FoundationModelCloudGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query( => [GqlFoundationModelCloudProduct], {
    name: 'foundationModelCloudProducts',
  })
  foundationModelCloudProducts: Promise<GqlFoundationModelCloudProduct[]> {
    return this.queries.execute(new ListFoundationModelCloudProductsQuery);
  }
}
