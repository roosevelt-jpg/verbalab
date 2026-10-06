import { Query, Resolver } from '@nestjs/graphql';
import { WorkflowRuntimeService } from '../workflow-runtime/workflow-runtime.service';
import { GqlWorkflowRuntimeEngine } from './gql.types';

@Resolver
export class WorkflowRuntimeGraphqlResolver {
  constructor(private readonly runtime: WorkflowRuntimeService) {}

  @Query( => GqlWorkflowRuntimeEngine, { name: 'workflowRuntimeEngine' })
  workflowRuntimeEngine: GqlWorkflowRuntimeEngine {
    const c = this.runtime.engine;
    return {
      product: c.product,
      note: c.note,
      capabilities: c.capabilities,
      openToolExecution: c.honesty.openToolExecution,
      liveStepExecution: c.honesty.liveStepExecution,
      temporalOs: c.honesty.temporalOs,
      airflowOs: c.honesty.airflowOs,
      distributedWorkflowOs: c.honesty.distributedWorkflowOs,
      extendsWorkflowsProduct: c.honesty.extendsWorkflowsProduct,
      regeneratesWorkflowsProduct: c.honesty.regeneratesWorkflowsProduct,
      scopedPermissionsRequired: c.honesty.scopedPermissionsRequired,
      sandboxRequired: c.honesty.sandboxRequired,
      policyHardGateRequired: c.honesty.policyHardGateRequired,
      policyRuntimeWired: c.honesty.policyRuntimeWired,
      localPermissionHardGate: c.honesty.localPermissionHardGate,
      orgWorkspaceScoped: c.honesty.orgWorkspaceScoped,
      mode: c.mode,
      maxWorkflowsPerWorkspace: c.ceilings.maxWorkflowsPerWorkspace,
    };
  }
}
