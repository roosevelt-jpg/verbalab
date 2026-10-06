import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { UsageService } from '../usage/usage.service';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { ReasoningRuntimeService } from '../reasoning-runtime/reasoning-runtime.service';
import { IntelligentCacheService } from '../intelligent-cache/intelligent-cache.service';
import { EventFabricBus } from '../event-fabric/event-fabric.bus';
import {
  reasoningFabricArchitectureNotes,
  reasoningFabricCapabilityCatalog,
  reasoningFabricHonesty,
  reasoningFabricPipelines,
  reasoningFabricRoutingTable,
  reasoningFabricVersions,
} from './reasoning-fabric.catalog';

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
export class ReasoningFabricService {
  private routePlans = 0;
  private pipelines = 0;
  private distributions = 0;
  private federations = 0;
  private replays = 0;
  private eventPublishes = 0;
  private readonly distLog: DistRecord[] = [];

  constructor(
    private readonly prisma: PrismaService,
    private readonly usage: UsageService,
    private readonly reasoningRuntime: ReasoningRuntimeService,
    private readonly intelligentCache: IntelligentCacheService,
    private readonly eventBus: EventFabricBus,
  ) {}

  /** Test hook. */
  resetCounters() {
    this.routePlans = 0;
    this.pipelines = 0;
    this.distributions = 0;
    this.federations = 0;
    this.replays = 0;
    this.eventPublishes = 0;
    this.distLog.length = 0;
  }

  products() {
    const cacheEngine = this.intelligentCache.engine();
    return {
      product: 'Lugemi Reasoning Fabric',
      products: reasoningFabricCapabilityCatalog(),
      routes: reasoningFabricRoutingTable(),
      pipelines: reasoningFabricPipelines(),
      versions: reasoningFabricVersions(),
      reasoningRuntime: this.reasoningRuntime.engine(),
      intelligentCache: {
        product: cacheEngine.product,
        honesty: cacheEngine.honesty,
        console: '/intelligent-cache',
      },
      architecture: reasoningFabricArchitectureNotes(),
      honesty: reasoningFabricHonesty(),
      safety: {
        fabricWidePolicyHardGateRequired: true,
        policyLogOnlyForbidden: true,
        note:
          'Policy Fabric (VL-247) must hard-gate across fabric buses when shipped — not log-only.',
      },
      docs: '/docs/REASONING_FABRIC.md',
      note:
        'Reasoning Fabric (VL-244). Cross-cloud reasoning router over Reasoning Runtime. Not a custom reasoner OS.',
    };
  }

  routes() {
    return {
      routes: reasoningFabricRoutingTable(),
      honesty: reasoningFabricHonesty(),
      docs: '/docs/REASONING_FABRIC.md',
      note: 'Static reasoning-intent → Runtime/Cloud handoff catalog.',
    };
  }

  route(input: { kinds?: string[] }) {
    this.routePlans += 1;
    const table = reasoningFabricRoutingTable();
    const kinds = input.kinds?.length
      ? input.kinds.map((k) => k.toLowerCase())
      : table.map((r) => r.kind);
    const selected = table.filter((r) => kinds.includes(r.kind));
    const missing = kinds.filter((k) => !table.some((r) => r.kind === k));
    return {
      plan: selected,
      missing,
      honesty: reasoningFabricHonesty(),
      note: 'Reasoning Router plan — does not execute reasoning steps.',
    };
  }

  pipeline(input: { pipelineId?: string; steps?: string[] }) {
    this.pipelines += 1;
    const catalog = reasoningFabricPipelines();
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
      honesty: reasoningFabricHonesty(),
      note: 'Pipeline is an ordered handoff plan — each step runs via Reasoning Runtime APIs.',
    };
  }

  versions() {
    return {
      versions: reasoningFabricVersions(),
      honesty: reasoningFabricHonesty(),
      docs: '/docs/REASONING_FABRIC.md',
      note: 'Fabric strategy/pipeline versions — Runtime owns run payloads.',
    };
  }

  cacheHandoff() {
    const engine = this.intelligentCache.engine();
    return {
      cache: {
        target: 'intelligent-cache',
        api: 'GET /v1/intelligent-cache/engine',
        product: engine.product,
        honesty: engine.honesty,
      },
      fabric: {
        status: 'partial',
        note:
          'Reasoning Fabric does not auto-cache every reason() call. Opt into Intelligent Cache namespaces explicitly.',
      },
      honesty: reasoningFabricHonesty(),
      docs: '/docs/REASONING_FABRIC.md',
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
        mode: r.kind === 'cloud' ? 'catalog' : 'handoff',
      })),
      missing: plan.missing,
      honesty: reasoningFabricHonesty(),
      note: 'Federation is a product-handoff catalog — not cross-tenant reasoner mesh.',
    };
  }

  async history(auth: AuthCtx, limit?: number) {
    return {
      ...(await this.reasoningRuntime.history({ ...auth, limit })),
      honesty: reasoningFabricHonesty(),
      docs: '/docs/REASONING_FABRIC.md',
      note: 'History façade over Reasoning Runtime.',
    };
  }

  async replay(auth: AuthCtx, id: string) {
    this.replays += 1;
    return {
      ...(await this.reasoningRuntime.replay({ ...auth, id })),
      honesty: reasoningFabricHonesty(),
      docs: '/docs/REASONING_FABRIC.md',
      note: 'Replay façade over Reasoning Runtime MemoryRecords.',
    };
  }

  async distribute(input: {
    organizationId: string;
    workspaceId: string;
    kinds?: string[];
    targetWorkspaceIds?: string[];
    publishEvent?: boolean;
    topic?: string;
  }) {
    this.distributions += 1;
    const plan = this.route({ kinds: input.kinds ?? ['plan', 'reason', 'history'] });
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
        topic: input.topic ?? 'reasoning-fabric',
        type: 'com.lugemi.reasoning.distributed',
        source: '/lugemi/reasoning-fabric',
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
      honesty: reasoningFabricHonesty(),
      note: 'Distribution plan for same-org workspaces — does not replicate reasoning runs automatically.',
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
      mode: 'reasoning_fabric',
      counters: {
        routePlans: this.routePlans,
        pipelines: this.pipelines,
        distributions: this.distributions,
        federations: this.federations,
        replays: this.replays,
        eventPublishes: this.eventPublishes,
      },
      recent: { distributions: this.distLog.slice(-10) },
      products: reasoningFabricCapabilityCatalog().map((p) => ({
        id: p.id,
        status: p.status,
      })),
      honesty: reasoningFabricHonesty(),
      note: 'Reasoning Fabric monitoring (VL-244).',
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
      products: reasoningFabricCapabilityCatalog(),
      routes: reasoningFabricRoutingTable(),
      pipelines: reasoningFabricPipelines(),
      architecture: reasoningFabricArchitectureNotes(),
      honesty: reasoningFabricHonesty(),
      counters: {
        routePlans: this.routePlans,
        pipelines: this.pipelines,
        distributions: this.distributions,
        federations: this.federations,
        replays: this.replays,
        eventPublishes: this.eventPublishes,
      },
      safety: {
        fabricWidePolicyHardGateRequired: true,
        policyLogOnlyForbidden: true,
        note:
          'Policy Fabric (VL-247) must enforce hard gates fabric-wide. Until then, Policy Runtime hard-gates Agent/Workflow/Plugin.',
      },
      deferred: {
        memoryFabric: false,
        agentFabric: false,
        policyFabric: false,
        customReasonerOs: true,
        symbolicReasonerOs: true,
        crossOrgDataPlane: true,
        regeneratesVolumes1to9: false,
      },
      links: {
        reasoningFabric: '/reasoning-fabric',
        memoryFabric: '/memory-fabric',
        reasoningRuntime: '/reasoning-runtime',
        promptFabric: '/prompt-fabric',
        contextFabric: '/context-fabric',
        knowledgeFabric: '/knowledge-fabric',
        eventFabric: '/event-fabric',
        aiFabric: '/ai-fabric',
        intelligentCache: '/intelligent-cache',
        policyRuntime: '/policy-runtime',
      },
      docs: '/docs/REASONING_FABRIC.md',
      note:
        'Reasoning Fabric (VL-244). Router + pipelines + replay over Reasoning Runtime; same-org distribute plans.',
    };
  }
}
