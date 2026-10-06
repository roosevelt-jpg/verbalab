import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { UsageService } from '../usage/usage.service';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { MemoryRuntimeService } from '../memory-runtime/memory-runtime.service';
import { MemoryCloudService } from '../memory-cloud/memory-cloud.service';
import { IntelligentCacheService } from '../intelligent-cache/intelligent-cache.service';
import { EventFabricBus } from '../event-fabric/event-fabric.bus';
import { FabricPolicyGate } from '../policy-fabric/fabric-policy.gate';
import {
  memoryFabricArchitectureNotes,
  memoryFabricCapabilityCatalog,
  memoryFabricHonesty,
  memoryFabricPipelines,
  memoryFabricRoutingTable,
  memoryFabricVersions,
} from './memory-fabric.catalog';

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

type ReplicateRecord = {
  id: string;
  organizationId: string;
  workspaceId: string;
  targets: string[];
  status: 'planned';
  at: string;
  note: string;
};

@Injectable
export class MemoryFabricService {
  private routePlans = 0;
  private pipelines = 0;
  private distributions = 0;
  private federations = 0;
  private syncs = 0;
  private replications = 0;
  private eventPublishes = 0;
  private readonly distLog: DistRecord[] = [];
  private readonly replicateLog: ReplicateRecord[] = [];

  constructor(
    private readonly prisma: PrismaService,
    private readonly usage: UsageService,
    private readonly memoryRuntime: MemoryRuntimeService,
    private readonly memoryCloud: MemoryCloudService,
    private readonly intelligentCache: IntelligentCacheService,
    private readonly eventBus: EventFabricBus,
    private readonly fabricGate: FabricPolicyGate,
  ) {}

  /** Test hook. */
  resetCounters {
    this.routePlans = 0;
    this.pipelines = 0;
    this.distributions = 0;
    this.federations = 0;
    this.syncs = 0;
    this.replications = 0;
    this.eventPublishes = 0;
    this.distLog.length = 0;
    this.replicateLog.length = 0;
  }

  products {
    const cacheEngine = this.intelligentCache.engine;
    return {
      product: 'Lugemi Memory Fabric',
      products: memoryFabricCapabilityCatalog,
      routes: memoryFabricRoutingTable,
      pipelines: memoryFabricPipelines,
      versions: memoryFabricVersions,
      memoryRuntime: this.memoryRuntime.engine,
      memoryCloud: {
        product: this.memoryCloud.engine.product,
        honesty: this.memoryCloud.engine.honesty,
        console: '/memory-cloud',
      },
      intelligentCache: {
        product: cacheEngine.product,
        honesty: cacheEngine.honesty,
        console: '/intelligent-cache',
      },
      architecture: memoryFabricArchitectureNotes,
      honesty: memoryFabricHonesty,
      safety: {
        fabricWidePolicyHardGateRequired: true,
        policyLogOnlyForbidden: true,
        note:
          'Policy Fabric must hard-gate across fabric buses when shipped — not log-only.',
      },
      docs: '/docs/MEMORY_FABRIC.md',
      note:
        'Memory Fabric. Cross-cloud memory router over Memory Runtime. Not Mem0 or multi-region replication OS.',
    };
  }

  routes {
    return {
      routes: memoryFabricRoutingTable,
      honesty: memoryFabricHonesty,
      docs: '/docs/MEMORY_FABRIC.md',
      note: 'Static memory-intent → Runtime/Cloud handoff catalog.',
    };
  }

  route(input: { kinds?: string[] }) {
    this.routePlans += 1;
    const table = memoryFabricRoutingTable;
    const kinds = input.kinds?.length
      ? input.kinds.map((k) => k.toLowerCase)
      : table.map((r) => r.kind);
    const selected = table.filter((r) => kinds.includes(r.kind));
    const missing = kinds.filter((k) => !table.some((r) => r.kind === k));
    return {
      plan: selected,
      missing,
      honesty: memoryFabricHonesty,
      note: 'Memory Router plan — does not write MemoryRecords itself.',
    };
  }

  pipeline(input: { pipelineId?: string; steps?: string[] }) {
    this.pipelines += 1;
    const catalog = memoryFabricPipelines;
    const chosen =
      catalog.find((p) => p.id === input.pipelineId) ??
      (input.steps?.length
        ? {
            id: 'custom',
            name: 'Custom Pipeline',
            steps: input.steps.map((s) => s.toLowerCase),
            notes: 'Caller-supplied step list.',
          }
        : catalog[0]!);

    const routed = this.route({ kinds: chosen.steps });
    return {
      pipeline: chosen,
      plan: routed.plan,
      missing: routed.missing,
      honesty: memoryFabricHonesty,
      note: 'Pipeline is an ordered handoff plan — each step runs via Memory Runtime APIs.',
    };
  }

  versions {
    return {
      versions: memoryFabricVersions,
      honesty: memoryFabricHonesty,
      docs: '/docs/MEMORY_FABRIC.md',
      note: 'Fabric router/pipeline versions — Runtime owns MemoryRecords.',
    };
  }

  cacheHandoff {
    const engine = this.intelligentCache.engine;
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
          'Memory Fabric does not auto-cache every put/search. Opt into Intelligent Cache namespaces explicitly.',
      },
      honesty: memoryFabricHonesty,
      docs: '/docs/MEMORY_FABRIC.md',
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
      honesty: memoryFabricHonesty,
      note: 'Federation is a product-handoff catalog — not cross-tenant memory mesh.',
    };
  }

  async sync(auth: AuthCtx) {
    this.syncs += 1;
    return {
      ...(await this.memoryRuntime.sync(auth)),
      honesty: memoryFabricHonesty,
      docs: '/docs/MEMORY_FABRIC.md',
      note: 'Sync façade over Memory Runtime sandbox stamp — not multi-region replication.',
    };
  }

  async list(auth: AuthCtx & { scope?: string; kind?: string; limit?: number }) {
    return {
      ...(await this.memoryRuntime.list(auth)),
      honesty: memoryFabricHonesty,
      docs: '/docs/MEMORY_FABRIC.md',
      note: 'List façade over Memory Runtime.',
    };
  }

  async search(
    auth: AuthCtx & { query?: string; scope?: string; kind?: string; limit?: number },
  ) {
    return {
      ...(await this.memoryRuntime.search(auth)),
      honesty: memoryFabricHonesty,
      docs: '/docs/MEMORY_FABRIC.md',
      note: 'Search façade over Memory Runtime.',
    };
  }

  async replicate(input: {
    organizationId: string;
    workspaceId: string;
    targetWorkspaceIds?: string[];
  }) {
    this.replications += 1;
    const peers = await this.peerWorkspaces(input.organizationId, input.workspaceId);
    const targets =
      input.targetWorkspaceIds?.length
        ? peers.filter((p) => input.targetWorkspaceIds!.includes(p.id))
        : peers;

    const record: ReplicateRecord = {
      id: randomUUID,
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      targets: targets.map((t) => t.id),
      status: 'planned',
      at: new Date.toISOString,
      note: 'Same-org replication plan — does not copy MemoryRecords across regions.',
    };
    this.replicateLog.push(record);
    return {
      replication: record,
      peers: targets,
      honesty: memoryFabricHonesty,
      note: 'Replication plan only — not multi-region replication OS.',
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
      bus: 'memory-fabric',
      action: 'fabric.distribute',
      subjectId: input.userId ?? input.apiKeyId,
      permissions: ['fabric.distribute'],
    });
    const plan = this.route({
      kinds: input.kinds ?? ['short_term', 'long_term', 'workspace', 'sync'],
    });
    const peers = await this.peerWorkspaces(input.organizationId, input.workspaceId);
    const targets =
      input.targetWorkspaceIds?.length
        ? peers.filter((p) => input.targetWorkspaceIds!.includes(p.id))
        : peers;

    const record: DistRecord = {
      id: randomUUID,
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      targets: targets.map((t) => t.id),
      kinds: plan.plan.map((p) => p.kind),
      status: 'planned',
      at: new Date.toISOString,
    };

    let event: Awaited<ReturnType<EventFabricBus['publish']>> | null = null;
    if (input.publishEvent === true) {
      this.eventPublishes += 1;
      event = await this.eventBus.publish({
        topic: input.topic ?? 'memory-fabric',
        type: 'com.lugemi.memory.distributed',
        source: '/lugemi/memory-fabric',
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
      honesty: memoryFabricHonesty,
      note: 'Distribution plan for same-org workspaces — does not replicate MemoryRecords automatically.',
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

  monitoring {
    return {
      mode: 'memory_fabric',
      counters: {
        routePlans: this.routePlans,
        pipelines: this.pipelines,
        distributions: this.distributions,
        federations: this.federations,
        syncs: this.syncs,
        replications: this.replications,
        eventPublishes: this.eventPublishes,
      },
      recent: {
        distributions: this.distLog.slice(-10),
        replications: this.replicateLog.slice(-10),
      },
      products: memoryFabricCapabilityCatalog.map((p) => ({
        id: p.id,
        status: p.status,
      })),
      honesty: memoryFabricHonesty,
      note: 'Memory Fabric monitoring.',
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
      products: memoryFabricCapabilityCatalog,
      routes: memoryFabricRoutingTable,
      pipelines: memoryFabricPipelines,
      architecture: memoryFabricArchitectureNotes,
      honesty: memoryFabricHonesty,
      counters: {
        routePlans: this.routePlans,
        pipelines: this.pipelines,
        distributions: this.distributions,
        federations: this.federations,
        syncs: this.syncs,
        replications: this.replications,
        eventPublishes: this.eventPublishes,
      },
      safety: {
        fabricWidePolicyHardGateRequired: true,
        policyLogOnlyForbidden: true,
        note:
          'Policy Fabric must enforce hard gates fabric-wide. Until then, Policy Runtime hard-gates Agent/Workflow/Plugin.',
      },
      deferred: {
        agentFabric: false,
        policyFabric: false,
        mem0Os: true,
        multiRegionReplicationOs: true,
        crossOrgDataPlane: true,
        regeneratesVolumes1to9: false,
      },
      links: {
        memoryFabric: '/memory-fabric',
        agentFabric: '/agent-fabric',
        memoryRuntime: '/memory-runtime',
        memoryCloud: '/memory-cloud',
        reasoningFabric: '/reasoning-fabric',
        promptFabric: '/prompt-fabric',
        contextFabric: '/context-fabric',
        knowledgeFabric: '/knowledge-fabric',
        eventFabric: '/event-fabric',
        aiFabric: '/ai-fabric',
        intelligentCache: '/intelligent-cache',
        policyRuntime: '/policy-runtime',
      },
      docs: '/docs/MEMORY_FABRIC.md',
      note:
        'Memory Fabric. Router + sync/distribute/federation over Memory Runtime; same-org plans only.',
    };
  }
}
