import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { UsageService } from '../usage/usage.service';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { KnowledgeCloudService } from '../knowledge-cloud/knowledge-cloud.service';
import { EnterpriseSearchService } from '../enterprise-search/enterprise-search.service';
import { EventFabricBus } from '../event-fabric/event-fabric.bus';
import {
  knowledgeFabricArchitectureNotes,
  knowledgeFabricCapabilityCatalog,
  knowledgeFabricHonesty,
  knowledgeFabricRoutingTable,
} from './knowledge-fabric.catalog';

type SyncRecord = {
  id: string;
  organizationId: string;
  sourceWorkspaceId: string;
  targetWorkspaceId: string;
  kinds: string[];
  cursor: string;
  status: 'planned' | 'published';
  at: string;
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

@Injectable
export class KnowledgeFabricService {
  private routePlans = 0;
  private distributions = 0;
  private syncs = 0;
  private federations = 0;
  private eventPublishes = 0;
  private readonly syncLog: SyncRecord[] = [];
  private readonly distLog: DistRecord[] = [];

  constructor(
    private readonly prisma: PrismaService,
    private readonly usage: UsageService,
    private readonly knowledgeCloud: KnowledgeCloudService,
    private readonly enterpriseSearch: EnterpriseSearchService,
    private readonly eventBus: EventFabricBus,
  ) {}

  /** Test hook. */
  resetCounters {
    this.routePlans = 0;
    this.distributions = 0;
    this.syncs = 0;
    this.federations = 0;
    this.eventPublishes = 0;
    this.syncLog.length = 0;
    this.distLog.length = 0;
  }

  products {
    const search = this.enterpriseSearch.engine;
    return {
      product: 'Lugemi Knowledge Fabric',
      products: knowledgeFabricCapabilityCatalog,
      routes: knowledgeFabricRoutingTable,
      knowledgeCloud: this.knowledgeCloud.products,
      enterpriseSearch: {
        product: search.product,
        honesty: search.honesty,
        console: '/enterprise-search',
      },
      architecture: knowledgeFabricArchitectureNotes,
      honesty: knowledgeFabricHonesty,
      safety: {
        fabricWidePolicyHardGateRequired: true,
        policyLogOnlyForbidden: true,
        note:
          'Policy Fabric must hard-gate across fabric buses when shipped — not log-only.',
      },
      docs: '/docs/KNOWLEDGE_FABRIC.md',
      note:
        'Knowledge Fabric. Cross-cloud knowledge router over Knowledge Cloud. Not Confluence/Neo4j federation OS.',
    };
  }

  routes {
    return {
      routes: knowledgeFabricRoutingTable,
      honesty: knowledgeFabricHonesty,
      docs: '/docs/KNOWLEDGE_FABRIC.md',
      note: 'Static knowledge-intent → Knowledge Cloud/Search/RAG handoff catalog.',
    };
  }

  route(input: { kinds?: string[] }) {
    this.routePlans += 1;
    const table = knowledgeFabricRoutingTable;
    const kinds = input.kinds?.length
      ? input.kinds.map((k) => k.toLowerCase)
      : table.map((r) => r.kind);
    const selected = table.filter((r) => kinds.includes(r.kind));
    const missing = kinds.filter((k) => !table.some((r) => r.kind === k));
    return {
      plan: selected,
      missing,
      honesty: knowledgeFabricHonesty,
      note: 'Knowledge Router plan — discovery handoffs only; does not move document bytes.',
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
    const plan = this.route({ kinds: input.kinds ?? ['hub', 'knowledge-base', 'search'] });
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
        topic: input.topic ?? 'knowledge-fabric',
        type: 'com.lugemi.knowledge.distributed',
        source: '/lugemi/knowledge-fabric',
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
      honesty: knowledgeFabricHonesty,
      note:
        'Distribution plan for same-org workspaces. Does not replicate embeddings or claim multi-region OS.',
    };
  }

  async sync(input: {
    organizationId: string;
    workspaceId: string;
    targetWorkspaceId: string;
    kinds?: string[];
    publishEvent?: boolean;
    topic?: string;
  }) {
    this.syncs += 1;
    const peers = await this.peerWorkspaces(input.organizationId, input.workspaceId);
    const target = peers.find((p) => p.id === input.targetWorkspaceId);
    if (!target) {
      return {
        sync: null,
        error: 'target_workspace_not_in_org_peers',
        peers,
        honesty: knowledgeFabricHonesty,
        note: 'Cross-workspace sync is same-organization only.',
      };
    }

    const plan = this.route({ kinds: input.kinds ?? ['knowledge-base', 'documents', 'search'] });
    const record: SyncRecord = {
      id: randomUUID,
      organizationId: input.organizationId,
      sourceWorkspaceId: input.workspaceId,
      targetWorkspaceId: target.id,
      kinds: plan.plan.map((p) => p.kind),
      cursor: `kf:${Date.now}`,
      status: 'planned',
      at: new Date.toISOString,
    };

    let event: Awaited<ReturnType<EventFabricBus['publish']>> | null = null;
    if (input.publishEvent === true) {
      this.eventPublishes += 1;
      event = await this.eventBus.publish({
        topic: input.topic ?? 'knowledge-fabric',
        type: 'com.lugemi.knowledge.synced',
        source: '/lugemi/knowledge-fabric',
        eventVersion: '1',
        data: {
          syncId: record.id,
          organizationId: record.organizationId,
          sourceWorkspaceId: record.sourceWorkspaceId,
          targetWorkspaceId: record.targetWorkspaceId,
          cursor: record.cursor,
          kinds: record.kinds,
        },
      });
      record.status = 'published';
    }

    this.syncLog.push(record);
    return {
      sync: record,
      plan: plan.plan,
      target,
      event,
      honesty: knowledgeFabricHonesty,
      note: 'Sync cursor/plan only — not CRDT/bidirectional replication OS.',
    };
  }

  federate(input: { kinds?: string[] }) {
    this.federations += 1;
    const plan = this.route({ kinds: input.kinds });
    const federation = plan.plan.map((r) => ({
      kind: r.kind,
      target: r.target,
      api: r.api,
      mode: r.kind === 'hub' ? 'catalog' : 'handoff',
    }));
    return {
      federation,
      missing: plan.missing,
      honesty: knowledgeFabricHonesty,
      note:
        'Federation is a product-handoff catalog inside Knowledge Cloud — not cross-tenant federation OS.',
    };
  }

  private async peerWorkspaces(organizationId: string, workspaceId: string) {
    const rows = await this.prisma.workspace.findMany({
      where: { organizationId, NOT: { id: workspaceId } },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
      take: 50,
    });
    return rows;
  }

  monitoring {
    return {
      mode: 'knowledge_fabric',
      counters: {
        routePlans: this.routePlans,
        distributions: this.distributions,
        syncs: this.syncs,
        federations: this.federations,
        eventPublishes: this.eventPublishes,
      },
      recent: {
        distributions: this.distLog.slice(-10),
        syncs: this.syncLog.slice(-10),
      },
      products: knowledgeFabricCapabilityCatalog.map((p) => ({
        id: p.id,
        status: p.status,
      })),
      honesty: knowledgeFabricHonesty,
      note: 'Knowledge Fabric monitoring.',
    };
  }

  async overview(session: SessionContext) {
    const [usageSummary, knowledgeDocs, peers] = await Promise.all([
      this.usage.summary(session.organizationId),
      this.prisma.knowledgeDocument.count({
        where: { organizationId: session.organizationId },
      }),
      this.peerWorkspaces(session.organizationId, session.workspaceId),
    ]);

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
      workspace: {
        knowledgeDocuments: knowledgeDocs,
        peerWorkspaces: peers.length,
      },
      products: knowledgeFabricCapabilityCatalog,
      routes: knowledgeFabricRoutingTable,
      architecture: knowledgeFabricArchitectureNotes,
      honesty: knowledgeFabricHonesty,
      counters: {
        routePlans: this.routePlans,
        distributions: this.distributions,
        syncs: this.syncs,
        federations: this.federations,
        eventPublishes: this.eventPublishes,
      },
      safety: {
        fabricWidePolicyHardGateRequired: true,
        policyLogOnlyForbidden: true,
        note:
          'Policy Fabric must enforce hard gates fabric-wide. Until then, Policy Runtime hard-gates Agent/Workflow/Plugin.',
      },
      deferred: {
        promptFabric: false,
        reasoningFabric: false,
        memoryFabric: false,
        agentFabric: false,
        policyFabric: false,
        confluenceSharepointOs: true,
        neo4jFederationOs: true,
        crossOrgDataPlane: true,
        regeneratesVolumes1to9: false,
      },
      links: {
        knowledgeFabric: '/knowledge-fabric',
        knowledgeCloud: '/knowledge-cloud',
        enterpriseSearch: '/enterprise-search',
        knowledgeBase: '/knowledge-base',
        enterpriseRag: '/enterprise-rag',
        contextFabric: '/context-fabric',
        promptFabric: '/prompt-fabric',
        eventFabric: '/event-fabric',
        aiFabric: '/ai-fabric',
        policyRuntime: '/policy-runtime',
      },
      docs: '/docs/KNOWLEDGE_FABRIC.md',
      note:
        'Knowledge Fabric. Router + same-org distribute/sync plans over Knowledge Cloud.',
    };
  }
}
