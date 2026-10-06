import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { ListInferenceProductsQuery } from '../inference-cloud/application/messages';
import { GqlInferenceProduct } from './gql.types';

@Resolver()
export class InferenceCloudGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => [GqlInferenceProduct], { name: 'inferenceProducts' })
  inferenceProducts(): Promise<GqlInferenceProduct[]> {
    return this.queries.execute(new ListInferenceProductsQuery());
  }
}
