import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { UsageService } from '../usage/usage.service';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { PromptRuntimeService } from '../prompt-runtime/prompt-runtime.service';
import { PolicyRuntimeService } from '../policy-runtime/policy-runtime.service';
import { EventFabricBus } from '../event-fabric/event-fabric.bus';
import {
  promptFabricArchitectureNotes,
  promptFabricCapabilityCatalog,
  promptFabricHonesty,
  promptFabricRoutingTable,
} from './prompt-fabric.catalog';

type AuthCtx = {
  organizationId: string;
  workspaceId: string;
  apiKeyId?: string;
  userId?: string;
  ip?: string;
};

type SyncRecord = {
  id: string;
  organizationId: string;
  sourceWorkspaceId: string;
  targetWorkspaceId: string;
  keys: string[];
  cursor: string;
  status: 'planned' | 'published';
  at: string;
};

type DistRecord = {
  id: string;
  organizationId: string;
  workspaceId: string;
  targets: string[];
  keys: string[];
  status: 'planned' | 'published';
  at: string;
};

@Injectable()
export class PromptFabricService {
  private routePlans = 0;
  private validations = 0;
  private distributions = 0;
  private syncs = 0;
  private eventPublishes = 0;
  private readonly syncLog: SyncRecord[] = [];
  private readonly distLog: DistRecord[] = [];

  constructor(
    private readonly prisma: PrismaService,
    private readonly usage: UsageService,
    private readonly promptRuntime: PromptRuntimeService,
    private readonly policyRuntime: PolicyRuntimeService,
    private readonly eventBus: EventFabricBus,
  ) {}

  /** Test hook. */
  resetCounters() {
    this.routePlans = 0;
    this.validations = 0;
    this.distributions = 0;
    this.syncs = 0;
    this.eventPublishes = 0;
    this.syncLog.length = 0;
    this.distLog.length = 0;
  }

  products() {
    const policy = this.policyRuntime.engine();
    return {
      product: 'VerbaLab Prompt Fabric',
      products: promptFabricCapabilityCatalog(),
      routes: promptFabricRoutingTable(),
      promptRuntime: this.promptRuntime.engine(),
      policyRuntime: {
        product: policy.product,
        honesty: policy.honesty,
        console: '/policy-runtime',
      },
      architecture: promptFabricArchitectureNotes(),
      honesty: promptFabricHonesty(),
      safety: {
        fabricWidePolicyHardGateRequired: true,
        policyLogOnlyForbidden: true,
        note:
          'Policy Fabric (VL-247) must hard-gate across fabric buses when shipped — not log-only. Until then Policy Runtime hard-gates Agent/Workflow/Plugin.',
      },
      docs: '/docs/PROMPT_FABRIC.md',
      note:
        'Prompt Fabric (VL-243). Cross-cloud prompt router over Prompt Runtime. Not a prompt mesh or research lab OS.',
    };
  }

  routes() {
    return {
      routes: promptFabricRoutingTable(),
      runtimeRoutes: this.promptRuntime.engine().routes,
      honesty: promptFabricHonesty(),
      docs: '/docs/PROMPT_FABRIC.md',
      note: 'Fabric cloud handoffs + Prompt Runtime feature→key sandbox map.',
    };
  }

  route(input: { kinds?: string[]; feature?: string }) {
    this.routePlans += 1;
    const table = promptFabricRoutingTable();
    const kinds = input.kinds?.length
      ? input.kinds.map((k) => k.toLowerCase())
      : input.feature
        ? [input.feature.toLowerCase()]
        : table.map((r) => r.kind);
    const selected = table.filter((r) => kinds.includes(r.kind));
    const missing = kinds.filter((k) => !table.some((r) => r.kind === k));

    let runtimeRoute: ReturnType<PromptRuntimeService['route']> | null = null;
    if (input.feature?.trim()) {
      runtimeRoute = this.promptRuntime.route({ feature: input.feature });
    } else if (selected.length === 1 && ['chat', 'rag', 'voice_faq', 'translate'].includes(selected[0]!.kind)) {
      runtimeRoute = this.promptRuntime.route({ feature: selected[0]!.kind });
    }

    return {
      plan: selected,
      missing,
      runtimeRoute,
      honesty: promptFabricHonesty(),
      note: 'Prompt Router plan — does not call an LLM.',
    };
  }

  async versions(auth: AuthCtx, key?: string) {
    return {
      ...(await this.promptRuntime.versions({ ...auth, key: key ?? 'chat' })),
      honesty: promptFabricHonesty(),
      docs: '/docs/PROMPT_FABRIC.md',
      note: 'Prompt Fabric versioning façade over Prompt Runtime / VL-086.',
    };
  }

  async validate(
    auth: AuthCtx,
    body: {
      key?: string;
      body?: string;
      version?: number;
      variables?: Record<string, string>;
    },
  ) {
    this.validations += 1;
    const result = await this.promptRuntime.validate({ ...auth, ...body });
    return {
      ...result,
      honesty: promptFabricHonesty(),
      docs: '/docs/PROMPT_FABRIC.md',
      note: 'Validation delegated to Prompt Runtime — not LLM-as-judge.',
    };
  }

  policies() {
    const engine = this.policyRuntime.engine();
    return {
      policies: {
        target: 'policy-runtime',
        api: 'GET /v1/policy-runtime/engine',
        product: engine.product,
        honesty: engine.honesty,
      },
      fabric: {
        status: 'partial',
        policyFabricDeferred: false,
        note:
          'Prompt policies use Policy Runtime hard-gates. Fabric-wide Policy Fabric (VL-247) hard-gates distribute planes.',
      },
      honesty: promptFabricHonesty(),
      docs: '/docs/PROMPT_FABRIC.md',
    };
  }

  async distribute(input: {
    organizationId: string;
    workspaceId: string;
    keys?: string[];
    targetWorkspaceIds?: string[];
    publishEvent?: boolean;
    topic?: string;
  }) {
    this.distributions += 1;
    const keys = input.keys?.length ? input.keys : ['chat', 'rag', 'voice_faq'];
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
      keys,
      status: 'planned',
      at: new Date().toISOString(),
    };

    let event: Awaited<ReturnType<EventFabricBus['publish']>> | null = null;
    if (input.publishEvent === true) {
      this.eventPublishes += 1;
      event = await this.eventBus.publish({
        topic: input.topic ?? 'prompt-fabric',
        type: 'com.verbalab.prompt.distributed',
        source: '/verbalab/prompt-fabric',
        eventVersion: '1',
        data: {
          distributionId: record.id,
          organizationId: record.organizationId,
          workspaceId: record.workspaceId,
          targets: record.targets,
          keys: record.keys,
        },
      });
      record.status = 'published';
    }

    this.distLog.push(record);
    return {
      distribution: record,
      peers: targets,
      event,
      honesty: promptFabricHonesty(),
      note: 'Distribution plan for same-org workspaces — does not copy prompt bodies automatically.',
    };
  }

  async sync(input: {
    organizationId: string;
    workspaceId: string;
    targetWorkspaceId: string;
    keys?: string[];
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
        honesty: promptFabricHonesty(),
        note: 'Cross-workspace sync is same-organization only.',
      };
    }

    const record: SyncRecord = {
      id: randomUUID(),
      organizationId: input.organizationId,
      sourceWorkspaceId: input.workspaceId,
      targetWorkspaceId: target.id,
      keys: input.keys?.length ? input.keys : ['chat', 'rag', 'voice_faq'],
      cursor: `pf:${Date.now()}`,
      status: 'planned',
      at: new Date().toISOString(),
    };

    let event: Awaited<ReturnType<EventFabricBus['publish']>> | null = null;
    if (input.publishEvent === true) {
      this.eventPublishes += 1;
      event = await this.eventBus.publish({
        topic: input.topic ?? 'prompt-fabric',
        type: 'com.verbalab.prompt.synced',
        source: '/verbalab/prompt-fabric',
        eventVersion: '1',
        data: {
          syncId: record.id,
          organizationId: record.organizationId,
          sourceWorkspaceId: record.sourceWorkspaceId,
          targetWorkspaceId: record.targetWorkspaceId,
          cursor: record.cursor,
          keys: record.keys,
        },
      });
      record.status = 'published';
    }

    this.syncLog.push(record);
    return {
      sync: record,
      target,
      event,
      honesty: promptFabricHonesty(),
      note: 'Sync cursor/plan only — not CRDT/bidirectional prompt replication OS.',
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
      mode: 'prompt_fabric',
      counters: {
        routePlans: this.routePlans,
        validations: this.validations,
        distributions: this.distributions,
        syncs: this.syncs,
        eventPublishes: this.eventPublishes,
      },
      recent: {
        distributions: this.distLog.slice(-10),
        syncs: this.syncLog.slice(-10),
      },
      products: promptFabricCapabilityCatalog().map((p) => ({
        id: p.id,
        status: p.status,
      })),
      honesty: promptFabricHonesty(),
      note: 'Prompt Fabric monitoring (VL-243).',
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
      products: promptFabricCapabilityCatalog(),
      routes: promptFabricRoutingTable(),
      architecture: promptFabricArchitectureNotes(),
      honesty: promptFabricHonesty(),
      counters: {
        routePlans: this.routePlans,
        validations: this.validations,
        distributions: this.distributions,
        syncs: this.syncs,
        eventPublishes: this.eventPublishes,
      },
      safety: {
        fabricWidePolicyHardGateRequired: true,
        policyLogOnlyForbidden: true,
        note:
          'Policy Fabric (VL-247) must enforce hard gates fabric-wide. Until then, Policy Runtime hard-gates Agent/Workflow/Plugin.',
      },
      deferred: {
        reasoningFabric: false,
        memoryFabric: false,
        agentFabric: false,
        policyFabric: false,
        promptMeshOs: true,
        autoPromptResearchLab: true,
        crossOrgDataPlane: true,
        regeneratesVolumes1to9: false,
      },
      links: {
        promptFabric: '/prompt-fabric',
        promptRuntime: '/prompt-runtime',
        policyRuntime: '/policy-runtime',
        contextFabric: '/context-fabric',
        knowledgeFabric: '/knowledge-fabric',
        reasoningFabric: '/reasoning-fabric',
        eventFabric: '/event-fabric',
        aiFabric: '/ai-fabric',
      },
      docs: '/docs/PROMPT_FABRIC.md',
      note:
        'Prompt Fabric (VL-243). Router + same-org distribute/sync over Prompt Runtime; policies via Policy Runtime.',
    };
  }
}
