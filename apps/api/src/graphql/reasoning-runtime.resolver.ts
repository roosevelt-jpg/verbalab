import { Query, Resolver } from '@nestjs/graphql';
import { ReasoningRuntimeService } from '../reasoning-runtime/reasoning-runtime.service';
import { GqlReasoningRuntimeEngine } from './gql.types';

@Resolver
export class ReasoningRuntimeGraphqlResolver {
  constructor(private readonly runtime: ReasoningRuntimeService) {}

  @Query( => GqlReasoningRuntimeEngine, { name: 'reasoningRuntimeEngine' })
  reasoningRuntimeEngine: GqlReasoningRuntimeEngine {
    const c = this.runtime.engine;
    return {
      product: c.product,
      note: c.note,
      capabilities: c.capabilities,
      customReasonerKernel: c.honesty.customReasonerKernel,
      symbolicReasonerOs: c.honesty.symbolicReasonerOs,
      fullTreeOfThought: c.honesty.fullTreeOfThought,
      toolExecution: c.honesty.toolExecution,
      agentOs: c.honesty.agentOs,
      llmAsJudgeEvalLab: c.honesty.llmAsJudgeEvalLab,
      droolsPegaBrms: c.honesty.droolsPegaBrms,
      regeneratesReasoningCloud: c.honesty.regeneratesReasoningCloud,
      extendsReasoningCloud: c.honesty.extendsReasoningCloud,
      orgWorkspaceScoped: c.honesty.orgWorkspaceScoped,
      storesHistoryInMemoryCloud: c.honesty.storesHistoryInMemoryCloud,
      mode: c.mode,
      maxHistoryPerWorkspace: c.ceilings.maxHistoryPerWorkspace,
    };
  }
}
