import { Query, Resolver } from '@nestjs/graphql';
import { AgentRuntimeService } from '../agent-runtime/agent-runtime.service';
import { GqlAgentRuntimeEngine } from './gql.types';

@Resolver
export class AgentRuntimeGraphqlResolver {
  constructor(private readonly runtime: AgentRuntimeService) {}

  @Query( => GqlAgentRuntimeEngine, { name: 'agentRuntimeEngine' })
  agentRuntimeEngine: GqlAgentRuntimeEngine {
    const c = this.runtime.engine;
    return {
      product: c.product,
      note: c.note,
      capabilities: c.capabilities,
      openToolExecution: c.honesty.openToolExecution,
      liveExternalActionsByDefault: c.honesty.liveExternalActionsByDefault,
      langGraphOs: c.honesty.langGraphOs,
      autoGptOs: c.honesty.autoGptOs,
      scopedPermissionsRequired: c.honesty.scopedPermissionsRequired,
      sandboxRequired: c.honesty.sandboxRequired,
      policyHardGateRequired: c.honesty.policyHardGateRequired,
      policyRuntimeWired: c.honesty.policyRuntimeWired,
      localPermissionHardGate: c.honesty.localPermissionHardGate,
      orgWorkspaceScoped: c.honesty.orgWorkspaceScoped,
      mode: c.mode,
      maxAgentsPerWorkspace: c.ceilings.maxAgentsPerWorkspace,
    };
  }
}
