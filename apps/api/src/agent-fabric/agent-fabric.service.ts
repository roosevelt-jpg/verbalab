import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { UsageService } from '../usage/usage.service';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { AgentRuntimeService } from '../agent-runtime/agent-runtime.service';
import { EventFabricBus } from '../event-fabric/event-fabric.bus';
import { FabricPolicyGate } from '../policy-fabric/fabric-policy.gate';
import {
  agentFabricArchitectureNotes,
  agentFabricCapabilityCatalog,
  agentFabricHonesty,
  agentFabricPipelines,
  agentFabricRoutingTable,
  agentFabricVersions,
} from './agent-fabric.catalog';

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
export class AgentFabricService {
  private routePlans = 0;
  private pipelines = 0;
  private discoveries = 0;
  private collaborations = 0;
  private schedules = 0;
  private federations = 0;
  private distributions = 0;
  private eventPublishes = 0;
  private readonly distLog: DistRecord[] = [];

  constructor(
    private readonly prisma: PrismaService,
    private readonly usage: UsageService,
    private readonly agentRuntime: AgentRuntimeService,
    private readonly eventBus: EventFabricBus,
    private readonly fabricGate: FabricPolicyGate,
  ) {}

  /** Test hook. */
  resetCounters() {
    this.routePlans = 0;
    this.pipelines = 0;
    this.discoveries = 0;
    this.collaborations = 0;
    this.schedules = 0;
    this.federations = 0;
    this.distributions = 0;
    this.eventPublishes = 0;
    this.distLog.length = 0;
  }

  products() {
    return {
      product: 'VerbaLab Agent Fabric',
      products: agentFabricCapabilityCatalog(),
      routes: agentFabricRoutingTable(),
      pipelines: agentFabricPipelines(),
      versions: agentFabricVersions(),
      agentRuntime: this.agentRuntime.engine(),
      architecture: agentFabricArchitectureNotes(),
      honesty: agentFabricHonesty(),
      safety: {
        sandboxed: true,
        policyRuntimeHardGate: true,
        openToolExecution: false,
        liveToolExecution: false,
        fabricWidePolicyHardGateRequired: true,
        policyLogOnlyForbidden: true,
        note:
          'Agent actions stay sandboxed. Policy Runtime hard-gates Agent Runtime today; Policy Fabric (VL-247) must hard-gate fabric-wide when shipped — not log-only.',
      },
      docs: '/docs/AGENT_FABRIC.md',
      note:
        'Agent Fabric (VL-246). Cross-cloud agent router over Agent Runtime. Sandboxed + Policy-gated. Not LangGraph/AutoGPT OS.',
    };
  }

  routes() {
    return {
      routes: agentFabricRoutingTable(),
      honesty: agentFabricHonesty(),
      docs: '/docs/AGENT_FABRIC.md',
      note: 'Static agent-intent → Runtime/Policy handoff catalog.',
    };
  }

  route(input: { kinds?: string[] }) {
    this.routePlans += 1;
    const table = agentFabricRoutingTable();
    const kinds = input.kinds?.length
      ? input.kinds.map((k) => k.toLowerCase())
      : table.map((r) => r.kind);
    const selected = table.filter((r) => kinds.includes(r.kind));
    const missing = kinds.filter((k) => !table.some((r) => r.kind === k));
    return {
      plan: selected,
      missing,
      honesty: agentFabricHonesty(),
      note: 'Agent Router plan — does not execute agent steps itself.',
    };
  }

  pipeline(input: { pipelineId?: string; steps?: string[] }) {
    this.pipelines += 1;
    const catalog = agentFabricPipelines();
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
      honesty: agentFabricHonesty(),
      note: 'Pipeline is an ordered handoff plan — each step runs via Agent Runtime APIs under Policy gate.',
    };
  }

  versions() {
    return {
      versions: agentFabricVersions(),
      honesty: agentFabricHonesty(),
      docs: '/docs/AGENT_FABRIC.md',
      note: 'Fabric router/pipeline versions — Runtime owns agent payloads.',
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
        mode: r.kind === 'policy' ? 'hard_gate' : 'handoff',
      })),
      missing: plan.missing,
      honesty: agentFabricHonesty(),
      note: 'Federation is a product-handoff catalog — not cross-tenant agent mesh.',
    };
  }

  async discover(auth: AuthCtx) {
    this.discoveries += 1;
    return {
      ...(await this.agentRuntime.listAgents(auth)),
      honesty: agentFabricHonesty(),
      docs: '/docs/AGENT_FABRIC.md',
      note: 'Discovery façade over Agent Runtime — workspace-scoped only.',
    };
  }

  async collaborate(
    auth: AuthCtx & { agentIds?: string[]; topic?: string; message?: string },
  ) {
    this.collaborations += 1;
    return {
      ...(await this.agentRuntime.collaborate(auth)),
      honesty: agentFabricHonesty(),
      docs: '/docs/AGENT_FABRIC.md',
      note: 'Collaborate façade over Agent Runtime sandbox — Policy-gated.',
    };
  }

  async schedule(auth: AuthCtx & { agentId?: string; goal?: string; runAt?: string }) {
    this.schedules += 1;
    return {
      ...(await this.agentRuntime.schedule(auth)),
      honesty: agentFabricHonesty(),
      docs: '/docs/AGENT_FABRIC.md',
      note: 'Schedule façade over Agent Runtime stubs — not cron fleet OS.',
    };
  }

  async marketplace(auth: AuthCtx) {
    return {
      ...(await this.agentRuntime.marketplace(auth)),
      honesty: agentFabricHonesty(),
      docs: '/docs/AGENT_FABRIC.md',
      note: 'Marketplace integration façade — listing counts only.',
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
      bus: 'agent-fabric',
      action: 'fabric.distribute',
      subjectId: input.userId ?? input.apiKeyId,
      permissions: ['fabric.distribute'],
    });
    const plan = this.route({
      kinds: input.kinds ?? ['discover', 'collaborate', 'schedule'],
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
        topic: input.topic ?? 'agent-fabric',
        type: 'com.verbalab.agent.distributed',
        source: '/verbalab/agent-fabric',
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
      honesty: agentFabricHonesty(),
      note: 'Distribution plan for same-org workspaces — does not spawn remote agents automatically.',
    };
  }

  streamSnapshot() {
    return {
      ts: new Date().toISOString(),
      product: 'VerbaLab Agent Fabric',
      counters: {
        routePlans: this.routePlans,
        discoveries: this.discoveries,
        collaborations: this.collaborations,
        schedules: this.schedules,
        eventPublishes: this.eventPublishes,
      },
      routes: agentFabricRoutingTable().length,
      honesty: agentFabricHonesty(),
      note: 'SSE realtime tick — not WebSocket OS.',
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
      mode: 'agent_fabric',
      counters: {
        routePlans: this.routePlans,
        pipelines: this.pipelines,
        discoveries: this.discoveries,
        collaborations: this.collaborations,
        schedules: this.schedules,
        federations: this.federations,
        distributions: this.distributions,
        eventPublishes: this.eventPublishes,
      },
      recent: { distributions: this.distLog.slice(-10) },
      products: agentFabricCapabilityCatalog().map((p) => ({
        id: p.id,
        status: p.status,
      })),
      honesty: agentFabricHonesty(),
      note: 'Agent Fabric monitoring (VL-246).',
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
      products: agentFabricCapabilityCatalog(),
      routes: agentFabricRoutingTable(),
      pipelines: agentFabricPipelines(),
      architecture: agentFabricArchitectureNotes(),
      honesty: agentFabricHonesty(),
      counters: {
        routePlans: this.routePlans,
        pipelines: this.pipelines,
        discoveries: this.discoveries,
        collaborations: this.collaborations,
        schedules: this.schedules,
        federations: this.federations,
        distributions: this.distributions,
        eventPublishes: this.eventPublishes,
      },
      safety: {
        sandboxed: true,
        policyRuntimeHardGate: true,
        openToolExecution: false,
        fabricWidePolicyHardGateRequired: true,
        policyLogOnlyForbidden: true,
        note:
          'Policy Fabric (VL-247) must enforce hard gates fabric-wide. Until then, Policy Runtime hard-gates Agent/Workflow/Plugin.',
      },
      deferred: {
        policyFabric: false,
        langGraphOs: true,
        autoGptOs: true,
        openToolExecution: true,
        crossOrgDataPlane: true,
        regeneratesVolumes1to9: false,
      },
      links: {
        agentFabric: '/agent-fabric',
        agentRuntime: '/agent-runtime',
        policyRuntime: '/policy-runtime',
        memoryFabric: '/memory-fabric',
        reasoningFabric: '/reasoning-fabric',
        eventFabric: '/event-fabric',
        aiFabric: '/ai-fabric',
        marketplace: '/marketplace',
      },
      docs: '/docs/AGENT_FABRIC.md',
      note:
        'Agent Fabric (VL-246). Router + discovery/collaborate/schedule over Agent Runtime; sandboxed + Policy-gated.',
    };
  }
}
