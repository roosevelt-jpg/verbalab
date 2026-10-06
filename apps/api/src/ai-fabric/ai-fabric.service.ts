import { Injectable } from '@nestjs/common';
import { UsageService } from '../usage/usage.service';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import {
  aiFabricArchitectureNotes,
  aiFabricBusCatalog,
  aiFabricHonesty,
  aiFabricRoutingTable,
} from './ai-fabric.catalog';

@Injectable()
export class AiFabricService {
  constructor(private readonly usage: UsageService) {}

  products() {
    return {
      product: 'Lugemi AI Fabric',
      products: aiFabricBusCatalog(),
      architecture: aiFabricArchitectureNotes(),
      honesty: aiFabricHonesty(),
      safety: {
        fabricWidePolicyHardGateRequired: true,
        policyLogOnlyForbidden: true,
        note:
          'Platform docs: Policy Fabric must hard-gate across buses when shipped — not log-only decoration.',
      },
      docs: '/docs/AI_FABRIC.md',
      note:
        'AI Fabric hub. Internal communication layer connecting Lugemi clouds. Not a Kafka hyperscaler or customer-facing mesh product. Event Fabric provides Redis Streams + CloudEvents.',
    };
  }

  routing() {
    return {
      routes: aiFabricRoutingTable(),
      buses: aiFabricBusCatalog().map((b) => ({
        id: b.id,
        status: b.status,
        api: b.api,
      })),
      honesty: aiFabricHonesty(),
      note:
        'Static service-discovery catalog for Foundation. Not Consul/etcd. Identity propagates via existing Clerk session + request IDs.',
      docs: '/docs/AI_FABRIC.md',
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
      products: aiFabricBusCatalog(),
      architecture: aiFabricArchitectureNotes(),
      honesty: aiFabricHonesty(),
      safety: {
        fabricWidePolicyHardGateRequired: true,
        policyLogOnlyForbidden: true,
        note:
          'Policy Fabric must enforce hard gates fabric-wide. Until then, Policy Runtime hard-gates Agent/Workflow/Plugin.',
      },
      deferred: {
        eventFabric: false,
        contextFabric: false,
        knowledgeFabric: false,
        promptFabric: false,
        reasoningFabric: false,
        memoryFabric: false,
        agentFabric: false,
        policyFabric: false,
        kafkaHyperscalerOs: true,
        serviceMeshOs: true,
        regeneratesVolumes1to9: false,
      },
      links: {
        aiFabric: '/ai-fabric',
        eventFabric: '/event-fabric',
        contextFabric: '/context-fabric',
        knowledgeFabric: '/knowledge-fabric',
        promptFabric: '/prompt-fabric',
        reasoningFabric: '/reasoning-fabric',
        memoryFabric: '/memory-fabric',
        agentFabric: '/agent-fabric',
        policyFabric: '/policy-fabric',
        aiKernel: '/ai-kernel',
        inferenceCloud: '/inference-cloud',
        foundationModelCloud: '/foundation-model-cloud',
        policyRuntime: '/policy-runtime',
        agentRuntime: '/agent-runtime',
        workflowRuntime: '/workflow-runtime',
        streamingRuntime: '/streaming-runtime',
        gateway: '/gateway',
      },
      docs: '/docs/AI_FABRIC.md',
      note:
        'AI Fabric Foundation. Discovery + routing hub. Event through Policy Fabric (–247) shipped with fabric-wide hard gate.',
    };
  }

  monitoring() {
    const products = aiFabricBusCatalog();
    return {
      mode: 'foundation',
      products: products.map((p) => ({ id: p.id, status: p.status })),
      architecture: aiFabricArchitectureNotes(),
      honesty: aiFabricHonesty(),
      note:
        'AI Fabric monitoring snapshot. Hub through Policy Fabric shipped; production audit remains.',
    };
  }
}
