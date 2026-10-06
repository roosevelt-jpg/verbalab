import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { ListMlopsLlmopsCloudProductsQuery } from '../mlops-llmops-cloud/application/messages';
import { GqlMlopsLlmopsCloudProduct } from './gql.types';

@Resolver
export class MlopsLlmopsCloudGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query( => [GqlMlopsLlmopsCloudProduct], { name: 'mlopsLlmopsCloudProducts' })
  mlopsLlmopsCloudProducts: Promise<GqlMlopsLlmopsCloudProduct[]> {
    return this.queries.execute(new ListMlopsLlmopsCloudProductsQuery);
  }
}
