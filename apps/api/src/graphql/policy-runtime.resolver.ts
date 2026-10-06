import { Query, Resolver } from '@nestjs/graphql';
import { PolicyRuntimeService } from '../policy-runtime/policy-runtime.service';
import { GqlPolicyRuntimeEngine } from './gql.types';

@Resolver
export class PolicyRuntimeGraphqlResolver {
  constructor(private readonly runtime: PolicyRuntimeService) {}

  @Query( => GqlPolicyRuntimeEngine, { name: 'policyRuntimeEngine' })
  policyRuntimeEngine: GqlPolicyRuntimeEngine {
    const c = this.runtime.engine;
    return {
      product: c.product,
      note: c.note,
      capabilities: c.capabilities,
      hardGate: c.honesty.hardGate,
      logOnly: c.honesty.logOnly,
      logOnlyForbidden: c.honesty.logOnlyForbidden,
      opaOs: c.honesty.opaOs,
      cedarOs: c.honesty.cedarOs,
      enterpriseGrcOs: c.honesty.enterpriseGrcOs,
      wiredIntoAgentRuntime: c.honesty.wiredIntoAgentRuntime,
      wiredIntoWorkflowRuntime: c.honesty.wiredIntoWorkflowRuntime,
      wiredIntoPluginRuntime: c.honesty.wiredIntoPluginRuntime,
      orgWorkspaceScoped: c.honesty.orgWorkspaceScoped,
      mode: c.mode,
      maxPoliciesPerWorkspace: c.ceilings.maxPoliciesPerWorkspace,
    };
  }
}
