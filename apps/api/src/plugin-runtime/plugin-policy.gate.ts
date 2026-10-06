import { HttpStatus, Injectable } from '@nestjs/common';
import { ApiException } from '../common/errors/api-exception';
import { PolicyRuntimeService } from '../policy-runtime/policy-runtime.service';
import {
  PLUGIN_DENIED_ACTIONS,
  PLUGIN_PERMISSIONS,
  PluginPermission,
} from './plugin-runtime.catalog';

/**
 * Local allowlist + Policy Runtime hard gate.
 */
@Injectable
export class PluginPolicyGate {
  constructor(private readonly policyRuntime: PolicyRuntimeService) {}

  async assertAllowed(input: {
    organizationId: string;
    workspaceId: string;
    pluginId: string;
    action: string;
    permissions: string[];
  }): Promise<{
    allowed: true;
    action: PluginPermission;
    policy: 'policy-runtime';
    hardGate: true;
  }> {
    const action = (input.action ?? '').trim;
    if (!action) {
      throw new ApiException(
        'plugin_policy_denied',
        'action is required',
        HttpStatus.FORBIDDEN,
      );
    }

    if ((PLUGIN_DENIED_ACTIONS as readonly string[]).includes(action)) {
      throw new ApiException(
        'plugin_policy_denied',
        `Action "${action}" is globally forbidden in Plugin Runtime sandbox (hard gate).`,
        HttpStatus.FORBIDDEN,
      );
    }

    if (!(PLUGIN_PERMISSIONS as readonly string[]).includes(action)) {
      throw new ApiException(
        'plugin_policy_denied',
        `Action "${action}" is not a grantable Plugin Runtime permission.`,
        HttpStatus.FORBIDDEN,
      );
    }

    if (!input.permissions.includes(action)) {
      throw new ApiException(
        'plugin_policy_denied',
        `Plugin ${input.pluginId} lacks permission "${action}" (hard allowlist gate).`,
        HttpStatus.FORBIDDEN,
      );
    }

    await this.policyRuntime.assertHardGate({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      runtime: 'plugin-runtime',
      subjectId: input.pluginId,
      action,
      permissions: input.permissions,
    });

    return {
      allowed: true,
      action: action as PluginPermission,
      policy: 'policy-runtime',
      hardGate: true,
    };
  }

  normalizePermissions(raw: string[] | undefined): PluginPermission[] {
    const list = Array.isArray(raw) ? raw : [];
    const out: PluginPermission[] = [];
    for (const p of list) {
      const id = String(p).trim;
      if (
        (PLUGIN_PERMISSIONS as readonly string[]).includes(id) &&
        !out.includes(id as PluginPermission)
      ) {
        out.push(id as PluginPermission);
      }
    }
    if (out.length === 0) {
      return ['plugin.read', 'memory.search'];
    }
    return out;
  }
}
