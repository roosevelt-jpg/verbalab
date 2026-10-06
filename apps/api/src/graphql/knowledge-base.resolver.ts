import { Query, Resolver } from '@nestjs/graphql';
import { KnowledgeBaseService } from '../knowledge-base/knowledge-base.service';
import { GqlKnowledgeBaseEngine } from './gql.types';

@Resolver()
export class KnowledgeBaseGraphqlResolver {
  constructor(private readonly knowledgeBase: KnowledgeBaseService) {}

  @Query(() => GqlKnowledgeBaseEngine, { name: 'knowledgeBaseEngine' })
  knowledgeBaseEngine(): GqlKnowledgeBaseEngine {
    const c = this.knowledgeBase.engine();
    return {
      product: c.product,
      note: c.note,
      capabilities: c.capabilities,
      confluenceOs: c.honesty.confluenceOs,
      orgWorkspaceScoped: c.honesty.orgWorkspaceScoped,
      extendsVl062: c.honesty.extendsVl062,
    };
  }
}
