import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { UsageService } from '../usage/usage.service';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { PolicyRuntimeService } from '../policy-runtime/policy-runtime.service';
import { EventFabricBus } from '../event-fabric/event-fabric.bus';
import { FabricPolicyGate } from './fabric-policy.gate';
import {
  FABRIC_BUSES,
  FABRIC_GLOBAL_DENIES,
  policyFabricArchitectureNotes,
  policyFabricCapabilityCatalog,
  policyFabricHonesty,
  policyFabricPipelines,
  policyFabricRoutingTable,
  policyFabricVersions,
} from './policy-fabric.catalog';

type AuthCtx = {
  organizationId: string;
  workspaceId: string;
  apiKeyId?: string;
  userId?: string;
  ip?: string;
};

type DistRecord = {
  id: string;
  organizationId: string;
  workspaceId: string;
  targets: string[];
  kinds: string[];
  status: 'planned' | 'published';
  at: string;
};

@Injectable()
export class PolicyFabricService {
  private routePlans = 0;
  private pipelines = 0;
  private evaluations = 0;
  private syncs = 0;
  private federations = 0;
  private distributions = 0;
  private eventPublishes = 0;
  private readonly distLog: DistRecord[] = [];

  constructor(
    private readonly prisma: PrismaService,
    private readonly usage: UsageService,
    private readonly policyRuntime: PolicyRuntimeService,
    private readonly fabricGate: FabricPolicyGate,
    private readonly eventBus: EventFabricBus,
  ) {}

  /** Test hook. */
  resetCounters() {
    this.routePlans = 0;
    this.pipelines = 0;
    this.evaluations = 0;
    this.syncs = 0;
    this.federations = 0;
    this.distributions = 0;
    this.eventPublishes = 0;
    this.distLog.length = 0;
    this.fabricGate.resetCounters();
  }

  products() {
    return {
      product: 'Lugemi Policy Fabric',
      products: policyFabricCapabilityCatalog(),
      routes: policyFabricRoutingTable(),
      pipelines: policyFabricPipelines(),
      versions: policyFabricVersions(),
      buses: FABRIC_BUSES.map((id) => ({ id })),
      globalDenies: FABRIC_GLOBAL_DENIES.map((id) => ({ id })),
      policyRuntime: this.policyRuntime.engine(),
      architecture: policyFabricArchitectureNotes(),
      honesty: policyFabricHonesty(),
      safety: {
        hardGate: true,
        logOnlyMode: false,
        fabricWidePolicyHardGateRequired: true,
        policyLogOnlyForbidden: true,
        note:
          'Policy Fabric hard-gates fabric buses. Denies return 403. Log-only mode is forbidden.',
      },
      docs: '/docs/POLICY_FABRIC.md',
      note:
        'Policy Fabric. Fabric-wide hard gate over Policy Runtime. Not OPA/Cedar/GRC OS.',
    };
  }

  routes() {
    return {
      routes: policyFabricRoutingTable(),
      honesty: policyFabricHonesty(),
      docs: '/docs/POLICY_FABRIC.md',
      note: 'Static policy-kind → Runtime/Fabric handoff catalog.',
    };
  }

  route(input: { kinds?: string[] }) {
    this.routePlans += 1;
    const table = policyFabricRoutingTable();
    const kinds = input.kinds?.length
      ? input.kinds.map((k) => k.toLowerCase())
      : table.map((r) => r.kind);
    const selected = table.filter((r) => kinds.includes(r.kind));
    const missing = kinds.filter((k) => !table.some((r) => r.kind === k));
    return {
      plan: selected,
      missing,
      honesty: policyFabricHonesty(),
      note: 'Policy Router plan — enforcement is via assert/FabricPolicyGate.',
    };
  }

  pipeline(input: { pipelineId?: string; steps?: string[] }) {
    this.pipelines += 1;
    const catalog = policyFabricPipelines();
    const chosen =
      catalog.find((p) => p.id === input.pipelineId) ??
      (input.steps?.length
        ? {
            id: 'custom',
            name: 'Custom Pipeline',
            steps: input.steps.map((s) => s.toLowerCase()),
            notes: 'Caller-supplied step list.',
          }
        : catalog[0]!);

    const routed = this.route({ kinds: chosen.steps });
    return {
      pipeline: chosen,
      plan: routed.plan,
      missing: routed.missing,
      honesty: policyFabricHonesty(),
      note: 'Pipeline is an ordered handoff plan — assert steps hard-gate.',
    };
  }

  versions() {
    return {
      versions: policyFabricVersions(),
      honesty: policyFabricHonesty(),
      docs: '/docs/POLICY_FABRIC.md',
      note: 'Fabric hard-gate/router versions — Runtime owns policy rows.',
    };
  }

  federate(input: { kinds?: string[] }) {
    this.federations += 1;
    const plan = this.route({ kinds: input.kinds });
    return {
      federation: plan.plan.map((r) => ({
        kind: r.kind,
        target: r.target,
        api: r.api,
        mode: r.kind === 'assert' ? 'hard_gate' : 'handoff',
      })),
      missing: plan.missing,
      honesty: policyFabricHonesty(),
      note: 'Federation is a product-handoff catalog — not cross-tenant policy mesh.',
    };
  }

  async evaluate(
    auth: AuthCtx & {
      runtime?: string;
      subjectId?: string;
      action?: string;
      permissions?: string[];
      bus?: string;
    },
  ) {
    this.evaluations += 1;
    const decision = await this.policyRuntime.evaluate({
      organizationId: auth.organizationId,
      workspaceId: auth.workspaceId,
      userId: auth.userId,
      ip: auth.ip,
      runtime: auth.runtime,
      subjectId: auth.subjectId,
      action: auth.action,
      permissions: auth.permissions,
    });

    const fabricDenied =
      Boolean(auth.action) &&
      (FABRIC_GLOBAL_DENIES as readonly string[]).includes(auth.action!);

    return {
      ...decision,
      fabric: {
        bus: auth.bus ?? null,
        fabricGlobalDeny: fabricDenied,
        hardGate: true,
        logOnly: false,
      },
      honesty: policyFabricHonesty(),
      docs: '/docs/POLICY_FABRIC.md',
      note: 'Evaluate façade — does not throw; use assert for hard-gate 403.',
    };
  }

  async assert(
    auth: AuthCtx & {
      bus?: string;
      action?: string;
      subjectId?: string;
      permissions?: string[];
    },
  ) {
    const gate = await this.fabricGate.assertAllowed({
      organizationId: auth.organizationId,
      workspaceId: auth.workspaceId,
      bus: auth.bus ?? 'policy-fabric',
      action: auth.action ?? '',
      subjectId: auth.subjectId,
      permissions: auth.permissions,
    });
    return {
      ...gate,
      honesty: policyFabricHonesty(),
      docs: '/docs/POLICY_FABRIC.md',
      note: 'Hard gate passed. Denies throw 403 — never log-only.',
    };
  }

  async listPolicies(auth: AuthCtx) {
    return {
      ...(await this.policyRuntime.listPolicies(auth)),
      honesty: policyFabricHonesty(),
      docs: '/docs/POLICY_FABRIC.md',
      note: 'List façade over Policy Runtime.',
    };
  }

  async sync(auth: AuthCtx) {
    this.syncs += 1;
    await this.fabricGate.assertAllowed({
      organizationId: auth.organizationId,
      workspaceId: auth.workspaceId,
      bus: 'policy-fabric',
      action: 'fabric.policy.sync',
      subjectId: auth.userId ?? auth.apiKeyId,
      permissions: ['fabric.policy.sync'],
    });

    const listed = await this.policyRuntime.listPolicies(auth);
    const peers = await this.peerWorkspaces(auth.organizationId, auth.workspaceId);
    return {
      synced: listed.policies.length,
      peers: peers.map((p) => p.id),
      stamp: new Date().toISOString(),
      honesty: policyFabricHonesty(),
      docs: '/docs/POLICY_FABRIC.md',
      note: 'Same-org sync plan of policy catalog — does not push rows to peers automatically.',
    };
  }

  async distribute(input: {
    organizationId: string;
    workspaceId: string;
    kinds?: string[];
    targetWorkspaceIds?: string[];
    publishEvent?: boolean;
    topic?: string;
    userId?: string;
    apiKeyId?: string;
  }) {
    this.distributions += 1;
    await this.fabricGate.assertAllowed({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      bus: 'policy-fabric',
      action: 'fabric.distribute',
      subjectId: input.userId ?? input.apiKeyId,
      permissions: ['fabric.distribute'],
    });

    const plan = this.route({
      kinds: input.kinds ?? ['security', 'organization', 'assert'],
    });
    const peers = await this.peerWorkspaces(input.organizationId, input.workspaceId);
    const targets =
      input.targetWorkspaceIds?.length
        ? peers.filter((p) => input.targetWorkspaceIds!.includes(p.id))
        : peers;

    const record: DistRecord = {
      id: randomUUID(),
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      targets: targets.map((t) => t.id),
      kinds: plan.plan.map((p) => p.kind),
      status: 'planned',
      at: new Date().toISOString(),
    };

    let event: Awaited<ReturnType<EventFabricBus['publish']>> | null = null;
    if (input.publishEvent === true) {
      this.eventPublishes += 1;
      event = await this.eventBus.publish({
        topic: input.topic ?? 'policy-fabric',
        type: 'com.lugemi.policy.distributed',
        source: '/lugemi/policy-fabric',
        eventVersion: '1',
        data: {
          distributionId: record.id,
          organizationId: record.organizationId,
          workspaceId: record.workspaceId,
          targets: record.targets,
          kinds: record.kinds,
        },
      });
      record.status = 'published';
    }

    this.distLog.push(record);
    return {
      distribution: record,
      plan: plan.plan,
      peers: targets,
      event,
      honesty: policyFabricHonesty(),
      note: 'Distribution plan for same-org workspaces — hard-gated before planning.',
    };
  }

  private async peerWorkspaces(organizationId: string, workspaceId: string) {
    return this.prisma.workspace.findMany({
      where: { organizationId, NOT: { id: workspaceId } },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
      take: 50,
    });
  }

  monitoring() {
    return {
      mode: 'policy_fabric',
      counters: {
        routePlans: this.routePlans,
        pipelines: this.pipelines,
        evaluations: this.evaluations,
        syncs: this.syncs,
        federations: this.federations,
        distributions: this.distributions,
        eventPublishes: this.eventPublishes,
        ...this.fabricGate.counters(),
      },
      recent: { distributions: this.distLog.slice(-10) },
      products: policyFabricCapabilityCatalog().map((p) => ({
        id: p.id,
        status: p.status,
      })),
      honesty: policyFabricHonesty(),
      note: 'Policy Fabric monitoring.',
    };
  }

  async overview(session: SessionContext) {
    const usageSummary = await this.usage.summary(session.organizationId);
    const peers = await this.peerWorkspaces(session.organizationId, session.workspaceId);
    return {
      session: {
        organizationId: session.organizationId,
        workspaceId: session.workspaceId,
        role: session.role,
      },
      usage: {
        periodStart: usageSummary.periodStart,
        chat: usageSummary.chat,
        embeddings: usageSummary.embeddings,
      },
      workspace: { peerWorkspaces: peers.length },
      products: policyFabricCapabilityCatalog(),
      routes: policyFabricRoutingTable(),
      pipelines: policyFabricPipelines(),
      architecture: policyFabricArchitectureNotes(),
      honesty: policyFabricHonesty(),
      counters: {
        routePlans: this.routePlans,
        pipelines: this.pipelines,
        evaluations: this.evaluations,
        syncs: this.syncs,
        federations: this.federations,
        distributions: this.distributions,
        eventPublishes: this.eventPublishes,
        ...this.fabricGate.counters(),
      },
      safety: {
        hardGate: true,
        logOnlyMode: false,
        fabricWidePolicyHardGateRequired: true,
        policyLogOnlyForbidden: true,
        note:
          'Policy Fabric hard-gates fabric buses. Agent/Workflow/Plugin remain gated by Policy Runtime. Log-only is forbidden.',
      },
      deferred: {
        opaCedarOs: true,
        grcOs: true,
        crossOrgDataPlane: true,
        regeneratesPriorLayers: false,
      },
      links: {
        policyFabric: '/policy-fabric',
        policyRuntime: '/policy-runtime',
        agentFabric: '/agent-fabric',
        memoryFabric: '/memory-fabric',
        eventFabric: '/event-fabric',
        aiFabric: '/ai-fabric',
      },
      docs: '/docs/POLICY_FABRIC.md',
      note:
        'Policy Fabric. Hard-gate engine + router over Policy Runtime; same-org sync/distribute.',
    };
  }
}
