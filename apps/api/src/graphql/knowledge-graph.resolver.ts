import { Query, Resolver } from '@nestjs/graphql';
import { KnowledgeGraphService } from '../knowledge-graph/knowledge-graph.service';
import { GqlKnowledgeGraphEngine } from './gql.types';

@Resolver()
export class KnowledgeGraphGraphqlResolver {
  constructor(private readonly knowledgeGraph: KnowledgeGraphService) {}

  @Query(() => GqlKnowledgeGraphEngine, { name: 'knowledgeGraphEngine' })
  knowledgeGraphEngine(): GqlKnowledgeGraphEngine {
    const c = this.knowledgeGraph.engine();
    return {
      product: c.product,
      note: c.note,
      capabilities: c.capabilities,
      neo4jParity: c.honesty.neo4jParity,
      ontologyPlatform: c.honesty.ontologyPlatform,
      preferRag: c.honesty.preferRag,
    };
  }
}
