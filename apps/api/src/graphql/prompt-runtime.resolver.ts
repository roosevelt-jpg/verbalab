import { Query, Resolver } from '@nestjs/graphql';
import { PromptRuntimeService } from '../prompt-runtime/prompt-runtime.service';
import { GqlPromptRuntimeEngine } from './gql.types';

@Resolver
export class PromptRuntimeGraphqlResolver {
  constructor(private readonly runtime: PromptRuntimeService) {}

  @Query( => GqlPromptRuntimeEngine, { name: 'promptRuntimeEngine' })
  promptRuntimeEngine: GqlPromptRuntimeEngine {
    const c = this.runtime.engine;
    return {
      product: c.product,
      note: c.note,
      capabilities: c.capabilities,
      autoPromptResearchLab: c.honesty.autoPromptResearchLab,
      llmAsJudgeEvalLab: c.honesty.llmAsJudgeEvalLab,
      promptMeshOs: c.honesty.promptMeshOs,
      redisPromptCacheOs: c.honesty.redisPromptCacheOs,
      callsLlmOnExecute: c.honesty.callsLlmOnExecute,
      regeneratesPromptIntelligence: c.honesty.regeneratesPromptIntelligence,
      regeneratesVl086: c.honesty.regeneratesVl086,
      extendsPromptIntelligence: c.honesty.extendsPromptIntelligence,
      extendsVersionedPrompts: c.honesty.extendsVersionedPrompts,
      orgWorkspaceScoped: c.honesty.orgWorkspaceScoped,
      usesIntelligentCachePromptNamespace: c.honesty.usesIntelligentCachePromptNamespace,
      mode: c.mode,
      maxRenderedChars: c.ceilings.maxRenderedChars,
    };
  }
}
