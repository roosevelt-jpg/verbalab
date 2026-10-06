import { HttpStatus, Injectable } from '@nestjs/common';
import { ApiException } from '../common/errors/api-exception';
import { PolicyRuntimeService } from '../policy-runtime/policy-runtime.service';
import {
  AGENT_DENIED_ACTIONS,
  AGENT_PERMISSIONS,
  AgentPermission,
} from './agent-runtime.catalog';

/**
 * Local allowlist + Policy Runtime hard gate (VL-219 / VL-222).
 */
@Injectable()
export class AgentPolicyGate {
  constructor(private readonly policyRuntime: PolicyRuntimeService) {}

  async assertAllowed(input: {
    organizationId: string;
    workspaceId: string;
    agentId: string;
    action: string;
    permissions: string[];
  }): Promise<{
    allowed: true;
    action: AgentPermission;
    policy: 'policy-runtime';
    hardGate: true;
  }> {
    const action = (input.action ?? '').trim();
    if (!action) {
      throw new ApiException(
        'agent_policy_denied',
        'action is required',
        HttpStatus.FORBIDDEN,
      );
    }

    if ((AGENT_DENIED_ACTIONS as readonly string[]).includes(action)) {
      throw new ApiException(
        'agent_policy_denied',
        `Action "${action}" is globally forbidden in Agent Runtime sandbox (hard gate).`,
        HttpStatus.FORBIDDEN,
      );
    }

    if (!(AGENT_PERMISSIONS as readonly string[]).includes(action)) {
      throw new ApiException(
        'agent_policy_denied',
        `Action "${action}" is not a grantable Agent Runtime permission.`,
        HttpStatus.FORBIDDEN,
      );
    }

    if (!input.permissions.includes(action)) {
      throw new ApiException(
        'agent_policy_denied',
        `Agent ${input.agentId} lacks permission "${action}" (hard allowlist gate).`,
        HttpStatus.FORBIDDEN,
      );
    }

    // Shared Policy Runtime hard gate (VL-222) — blocks, does not only log.
    await this.policyRuntime.assertHardGate({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      runtime: 'agent-runtime',
      subjectId: input.agentId,
      action,
      permissions: input.permissions,
    });

    return {
      allowed: true,
      action: action as AgentPermission,
      policy: 'policy-runtime',
      hardGate: true,
    };
  }

  normalizePermissions(raw: string[] | undefined): AgentPermission[] {
    const list = Array.isArray(raw) ? raw : [];
    const out: AgentPermission[] = [];
    for (const p of list) {
      const id = String(p).trim();
      if ((AGENT_PERMISSIONS as readonly string[]).includes(id) && !out.includes(id as AgentPermission)) {
        out.push(id as AgentPermission);
      }
    }
    if (out.length === 0) {
      return ['reason.plan', 'memory.search'];
    }
    return out;
  }
}
