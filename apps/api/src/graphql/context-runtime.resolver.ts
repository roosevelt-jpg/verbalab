import { Query, Resolver } from '@nestjs/graphql';
import { ContextRuntimeService } from '../context-runtime/context-runtime.service';
import { GqlContextRuntimeEngine } from './gql.types';

@Resolver()
export class ContextRuntimeGraphqlResolver {
  constructor(private readonly runtime: ContextRuntimeService) {}

  @Query(() => GqlContextRuntimeEngine, { name: 'contextRuntimeEngine' })
  contextRuntimeEngine(): GqlContextRuntimeEngine {
    const c = this.runtime.engine();
    return {
      product: c.product,
      note: c.note,
      capabilities: c.capabilities,
      infiniteContextWindow: c.honesty.infiniteContextWindow,
      llmSummarization: c.honesty.llmSummarization,
      realtimePush: c.honesty.realtimePush,
      regeneratesContextEngine: c.honesty.regeneratesContextEngine,
      extendsContextEngine: c.honesty.extendsContextEngine,
      orgWorkspaceScoped: c.honesty.orgWorkspaceScoped,
      redisContextCacheOs: c.honesty.redisContextCacheOs,
      usesIntelligentCacheContextNamespace: c.honesty.usesIntelligentCacheContextNamespace,
      modelRouterOs: c.honesty.modelRouterOs,
      mode: c.mode,
      maxChars: c.ceilings.maxChars,
    };
  }
}
