import { Query, Resolver } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { GetAfricanKnowledgeGraphEngineQuery } from '../african-knowledge-graph/application/messages';
import { GqlAfricanKnowledgeGraphEngine } from './gql.types';

@Resolver()
export class AfricanKnowledgeGraphGraphqlResolver {
  constructor(private readonly queries: QueryBus) {}

  @Query(() => GqlAfricanKnowledgeGraphEngine, { name: 'africanKnowledgeGraphEngine' })
  async africanKnowledgeGraphEngine(): Promise<GqlAfricanKnowledgeGraphEngine> {
    const catalog = await this.queries.execute(new GetAfricanKnowledgeGraphEngineQuery());
    return {
      product: catalog.product,
      note: catalog.note,
      neo4jOs: catalog.honesty.neo4jOs,
    };
  }
}
