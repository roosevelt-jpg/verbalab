import { Query, Resolver } from '@nestjs/graphql';
import { KnowledgeMemoryService } from '../knowledge-memory/knowledge-memory.service';
import { GqlKnowledgeMemoryEngine } from './gql.types';

@Resolver
export class KnowledgeMemoryGraphqlResolver {
  constructor(private readonly knowledgeMemory: KnowledgeMemoryService) {}

  @Query( => GqlKnowledgeMemoryEngine, { name: 'knowledgeMemoryEngine' })
  knowledgeMemoryEngine: GqlKnowledgeMemoryEngine {
    const c = this.knowledgeMemory.engine;
    return {
      product: c.product,
      note: c.note,
      capabilities: c.capabilities,
      mem0Os: c.honesty.mem0Os,
      regeneratesMemoryCloud: c.honesty.regeneratesMemoryCloud,
      extendsVl183: c.honesty.extendsVl183,
      distinctFromMemoryCloud: c.honesty.distinctFromMemoryCloud,
      orgWorkspaceScoped: c.honesty.orgWorkspaceScoped,
    };
  }
}
