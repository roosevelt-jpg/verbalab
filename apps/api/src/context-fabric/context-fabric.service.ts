import { Injectable } from '@nestjs/common';
import { UsageService } from '../usage/usage.service';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { ContextRuntimeService } from '../context-runtime/context-runtime.service';
import { EventFabricBus } from '../event-fabric/event-fabric.bus';
import {
  contextFabricArchitectureNotes,
  contextFabricCapabilityCatalog,
  contextFabricHonesty,
  contextFabricRoutingTable,
} from './context-fabric.catalog';

type AuthCtx = {
  organizationId: string;
  workspaceId: string;
  apiKeyId?: string;
  userId?: string;
  ip?: string;
};

@Injectable()
export class ContextFabricService {
  private routePlans = 0;
  private propagations = 0;
  private eventPublishes = 0;

  constructor(
    private readonly usage: UsageService,
    private readonly contextRuntime: ContextRuntimeService,
    private readonly eventBus: EventFabricBus,
  ) {}

  /** Test hook. */
  resetCounters() {
    this.routePlans = 0;
    this.propagations = 0;
    this.eventPublishes = 0;
  }

  products() {
    return {
      product: 'VerbaLab Context Fabric',
      products: contextFabricCapabilityCatalog(),
      routes: contextFabricRoutingTable(),
      architecture: contextFabricArchitectureNotes(),
      honesty: contextFabricHonesty(),
      safety: {
        fabricWidePolicyHardGateRequired: true,
        policyLogOnlyForbidden: true,
        note:
          'Policy Fabric (VL-247) must hard-gate across fabric buses when shipped — not log-only.',
      },
      docs: '/docs/CONTEXT_FABRIC.md',
      note:
        'Context Fabric (VL-241). Cross-cloud context router over Context Runtime. Not infinite-context or WebSocket OS.',
    };
  }

  routes() {
    return {
      routes: contextFabricRoutingTable(),
      honesty: contextFabricHonesty(),
      docs: '/docs/CONTEXT_FABRIC.md',
      note: 'Static context-kind → cloud/runtime handoff catalog.',
    };
  }

  route(input: { kinds?: string[] }) {
    this.routePlans += 1;
    const table = contextFabricRoutingTable();
    const kinds = input.kinds?.length
      ? input.kinds.map((k) => k.toLowerCase())
      : table.map((r) => r.kind);
    const selected = table.filter((r) => kinds.includes(r.kind));
    const missing = kinds.filter((k) => !table.some((r) => r.kind === k));
    const engineFlags = [
      'language',
      'workspace',
      'organization',
      'user',
      'project',
      'conversation',
      'historical',
      'prompt',
      'documents',
      'knowledgeGraph',
      'knowledge',
    ] as const;
    const include: Record<string, boolean> = {};
    // Context Engine defaults unspecified flags to true — pin unused kinds off when planning.
    for (const key of engineFlags) include[key] = false;
    for (const r of selected) {
      if (r.kind === 'model' || r.kind === 'agent') continue;
      if (r.kind === 'knowledge') {
        include.knowledge = true;
        include.documents = true;
        include.knowledgeGraph = true;
      } else {
        include[r.kind] = true;
      }
    }
    return {
      plan: selected,
      missing,
      include,
      honesty: contextFabricHonesty(),
      note: 'Context Router plan — does not assemble; call propagate or Context Runtime assemble.',
    };
  }

  async propagate(
    auth: AuthCtx,
    body: {
      kinds?: string[];
      query?: string;
      conversationId?: string;
      projectKey?: string;
      subjectUserId?: string;
      promptKey?: 'chat' | 'rag';
      modelHint?: string;
      providerHint?: string;
      maxChars?: number;
      useCache?: boolean;
      publishEvent?: boolean;
      topic?: string;
    },
  ) {
    this.propagations += 1;
    const plan = this.route({ kinds: body.kinds });
    const include = plan.include as Record<string, boolean>;

    const assembled = await this.contextRuntime.assemble({
      organizationId: auth.organizationId,
      workspaceId: auth.workspaceId,
      apiKeyId: auth.apiKeyId,
      userId: auth.userId,
      ip: auth.ip,
      query: body.query,
      conversationId: body.conversationId,
      projectKey: body.projectKey,
      subjectUserId: body.subjectUserId,
      promptKey: body.promptKey,
      modelHint: body.modelHint,
      providerHint: body.providerHint,
      include,
      maxChars: body.maxChars,
      useCache: body.useCache,
    });

    let event: Awaited<ReturnType<EventFabricBus['publish']>> | null = null;
    if (body.publishEvent === true) {
      this.eventPublishes += 1;
      event = await this.eventBus.publish({
        topic: body.topic ?? 'context-fabric',
        type: 'com.verbalab.context.propagated',
        source: '/verbalab/context-fabric',
        eventVersion: '1',
        data: {
          organizationId: auth.organizationId,
          workspaceId: auth.workspaceId,
          kinds: plan.plan.map((p) => p.kind),
          chars:
            typeof (assembled as { promptContext?: string }).promptContext === 'string'
              ? (assembled as { promptContext: string }).promptContext.length
              : 0,
          included: (assembled as { included?: string[] }).included ?? [],
        },
      });
    }

    return {
      plan: plan.plan,
      assembled,
      event,
      honesty: contextFabricHonesty(),
      docs: '/docs/CONTEXT_FABRIC.md',
      note:
        'Propagated via Context Runtime assemble. Optional Event Fabric CloudEvent when publishEvent=true.',
    };
  }

  streamSnapshot() {
    return {
      ts: new Date().toISOString(),
      product: 'VerbaLab Context Fabric',
      counters: {
        routePlans: this.routePlans,
        propagations: this.propagations,
        eventPublishes: this.eventPublishes,
      },
      routes: contextFabricRoutingTable().length,
      honesty: contextFabricHonesty(),
      note: 'SSE realtime tick — not WebSocket OS.',
    };
  }

  monitoring() {
    return {
      mode: 'context_fabric',
      counters: {
        routePlans: this.routePlans,
        propagations: this.propagations,
        eventPublishes: this.eventPublishes,
      },
      products: contextFabricCapabilityCatalog().map((p) => ({
        id: p.id,
        status: p.status,
      })),
      honesty: contextFabricHonesty(),
      note: 'Context Fabric monitoring (VL-241). Router + propagate counters.',
    };
  }

  async overview(session: SessionContext) {
    const usageSummary = await this.usage.summary(session.organizationId);
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
      products: contextFabricCapabilityCatalog(),
      routes: contextFabricRoutingTable(),
      architecture: contextFabricArchitectureNotes(),
      honesty: contextFabricHonesty(),
      counters: {
        routePlans: this.routePlans,
        propagations: this.propagations,
        eventPublishes: this.eventPublishes,
      },
      safety: {
        fabricWidePolicyHardGateRequired: true,
        policyLogOnlyForbidden: true,
        note:
          'Policy Fabric (VL-247) must enforce hard gates fabric-wide. Until then, Policy Runtime hard-gates Agent/Workflow/Plugin.',
      },
      deferred: {
        knowledgeFabric: false,
        promptFabric: false,
        reasoningFabric: false,
        memoryFabric: false,
        agentFabric: false,
        policyFabric: false,
        websocketOs: true,
        infiniteContextWindow: true,
        regeneratesVolumes1to9: false,
      },
      links: {
        contextFabric: '/context-fabric',
        knowledgeFabric: '/knowledge-fabric',
        promptFabric: '/prompt-fabric',
        contextRuntime: '/context-runtime',
        eventFabric: '/event-fabric',
        aiFabric: '/ai-fabric',
        agentRuntime: '/agent-runtime',
        policyRuntime: '/policy-runtime',
      },
      docs: '/docs/CONTEXT_FABRIC.md',
      note:
        'Context Fabric (VL-241). Cross-cloud router over Context Runtime; optional Event Fabric propagation.',
    };
  }
}
