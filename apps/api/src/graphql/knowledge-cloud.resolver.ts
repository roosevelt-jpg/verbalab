import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { ListKnowledgeProductsQuery } from '../knowledge-cloud/application/messages';
import { GqlKnowledgeProduct } from './gql.types';

@Resolver()
export class KnowledgeCloudGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => [GqlKnowledgeProduct], { name: 'knowledgeProducts' })
  knowledgeProducts(): Promise<GqlKnowledgeProduct[]> {
    return this.queries.execute(new ListKnowledgeProductsQuery());
  }
}
