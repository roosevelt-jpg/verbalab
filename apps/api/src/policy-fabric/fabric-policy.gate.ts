import { HttpStatus, Injectable } from '@nestjs/common';
import { ApiException } from '../common/errors/api-exception';
import { PolicyRuntimeService } from '../policy-runtime/policy-runtime.service';
import { FABRIC_BUSES, FABRIC_GLOBAL_DENIES } from './policy-fabric.catalog';

export type FabricBus = (typeof FABRIC_BUSES)[number];

/**
 * Fabric-wide hard gate.
 * Blocks denied fabric actions with 403 — never log-only.
 */
@Injectable()
export class FabricPolicyGate {
  private asserts = 0;
  private denies = 0;

  constructor(private readonly policyRuntime: PolicyRuntimeService) {}

  /** Test hook. */
  resetCounters() {
    this.asserts = 0;
    this.denies = 0;
  }

  counters() {
    return { asserts: this.asserts, denies: this.denies };
  }

  async assertAllowed(input: {
    organizationId: string;
    workspaceId: string;
    bus: string;
    action: string;
    subjectId?: string;
    permissions?: string[];
  }): Promise<{
    allowed: true;
    action: string;
    bus: string;
    engine: 'policy-fabric';
    hardGate: true;
    logOnly: false;
  }> {
    this.asserts += 1;
    const action = (input.action ?? '').trim();
    const bus = (input.bus ?? '').trim();

    if (!action) {
      this.denies += 1;
      throw new ApiException(
        'policy_fabric_denied',
        'action is required (Policy Fabric hard gate)',
        HttpStatus.FORBIDDEN,
      );
    }

    if (!bus || !(FABRIC_BUSES as readonly string[]).includes(bus)) {
      this.denies += 1;
      throw new ApiException(
        'policy_fabric_denied',
        `Unknown fabric bus "${bus}" (Policy Fabric hard gate)`,
        HttpStatus.FORBIDDEN,
      );
    }

    if ((FABRIC_GLOBAL_DENIES as readonly string[]).includes(action)) {
      this.denies += 1;
      throw new ApiException(
        'policy_fabric_denied',
        `Action "${action}" is globally denied by Policy Fabric (hard gate — not log-only).`,
        HttpStatus.FORBIDDEN,
      );
    }

    // Delegate to Policy Runtime hard gate for org/global runtime denies.
    await this.policyRuntime.assertHardGate({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      runtime: 'agent-runtime',
      subjectId: input.subjectId ?? `fabric:${bus}`,
      action,
      permissions: input.permissions ?? [action],
    });

    return {
      allowed: true,
      action,
      bus,
      engine: 'policy-fabric',
      hardGate: true,
      logOnly: false,
    };
  }
}
