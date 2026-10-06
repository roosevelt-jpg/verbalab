import { HttpStatus, Injectable } from '@nestjs/common';
import { ApiException } from '../common/errors/api-exception';
import { PolicyRuntimeService } from '../policy-runtime/policy-runtime.service';
import {
  WORKFLOW_DENIED_ACTIONS,
  WORKFLOW_PERMISSIONS,
  WorkflowPermission,
} from './workflow-runtime.catalog';

/**
 * Local allowlist + Policy Runtime hard gate (VL-220 / VL-222).
 */
@Injectable()
export class WorkflowPolicyGate {
  constructor(private readonly policyRuntime: PolicyRuntimeService) {}

  async assertAllowed(input: {
    organizationId: string;
    workspaceId: string;
    workflowId: string;
    action: string;
    permissions: string[];
  }): Promise<{
    allowed: true;
    action: WorkflowPermission;
    policy: 'policy-runtime';
    hardGate: true;
  }> {
    const action = (input.action ?? '').trim();
    if (!action) {
      throw new ApiException(
        'workflow_policy_denied',
        'action is required',
        HttpStatus.FORBIDDEN,
      );
    }

    if ((WORKFLOW_DENIED_ACTIONS as readonly string[]).includes(action)) {
      throw new ApiException(
        'workflow_policy_denied',
        `Action "${action}" is globally forbidden in Workflow Runtime sandbox (hard gate).`,
        HttpStatus.FORBIDDEN,
      );
    }

    if (!(WORKFLOW_PERMISSIONS as readonly string[]).includes(action)) {
      throw new ApiException(
        'workflow_policy_denied',
        `Action "${action}" is not a grantable Workflow Runtime permission.`,
        HttpStatus.FORBIDDEN,
      );
    }

    if (!input.permissions.includes(action)) {
      throw new ApiException(
        'workflow_policy_denied',
        `Workflow ${input.workflowId} lacks permission "${action}" (hard allowlist gate).`,
        HttpStatus.FORBIDDEN,
      );
    }

    await this.policyRuntime.assertHardGate({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      runtime: 'workflow-runtime',
      subjectId: input.workflowId,
      action,
      permissions: input.permissions,
    });

    return {
      allowed: true,
      action: action as WorkflowPermission,
      policy: 'policy-runtime',
      hardGate: true,
    };
  }

  normalizePermissions(raw: string[] | undefined): WorkflowPermission[] {
    const list = Array.isArray(raw) ? raw : [];
    const out: WorkflowPermission[] = [];
    for (const p of list) {
      const id = String(p).trim();
      if (
        (WORKFLOW_PERMISSIONS as readonly string[]).includes(id) &&
        !out.includes(id as WorkflowPermission)
      ) {
        out.push(id as WorkflowPermission);
      }
    }
    if (out.length === 0) {
      return ['reason.plan', 'memory.search'];
    }
    return out;
  }
}
