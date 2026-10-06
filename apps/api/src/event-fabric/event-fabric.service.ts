import { Injectable } from '@nestjs/common';
import { UsageService } from '../usage/usage.service';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import {
  eventFabricArchitectureNotes,
  eventFabricBrokerCatalog,
  eventFabricCapabilityCatalog,
  eventFabricHonesty,
} from './event-fabric.catalog';
import { CloudEvent, EventFabricBus, PublishInput } from './event-fabric.bus';

@Injectable
export class EventFabricService {
  constructor(
    private readonly usage: UsageService,
    private readonly bus: EventFabricBus,
  ) {}

  products {
    return {
      product: 'Lugemi Event Fabric',
      products: eventFabricCapabilityCatalog,
      brokers: eventFabricBrokerCatalog,
      architecture: eventFabricArchitectureNotes,
      honesty: eventFabricHonesty,
      backend: this.bus.activeBackend,
      safety: {
        fabricWidePolicyHardGateRequired: true,
        policyLogOnlyForbidden: true,
        note:
          'Policy Fabric must hard-gate across fabric buses when shipped — not log-only.',
      },
      docs: '/docs/EVENT_FABRIC.md',
      note:
        'Event Fabric. Redis Streams + CloudEvents active; Kafka/NATS/RabbitMQ adapters deferred. Not a message-broker hyperscaler OS.',
    };
  }

  brokers {
    return {
      brokers: eventFabricBrokerCatalog,
      active: this.bus.activeBackend,
      honesty: eventFabricHonesty,
      docs: '/docs/EVENT_FABRIC.md',
    };
  }

  async publish(input: PublishInput) {
    const event = await this.bus.publish(input);
    return { event, backend: this.bus.activeBackend };
  }

  async poll(params: { topic: string; count?: number; eventVersion?: string }) {
    return this.bus.poll(params);
  }

  async fail(params: {
    topic: string;
    streamId: string;
    reason?: string;
    maxAttempts?: number;
    event?: Partial<CloudEvent>;
  }) {
    return this.bus.fail(params);
  }

  async dlq(topic: string) {
    return {
      topic,
      events: await this.bus.listDlq(topic),
      backend: this.bus.activeBackend,
    };
  }

  async retryDlq(params: { topic: string; streamId: string }) {
    const event = await this.bus.retryFromDlq(params);
    return { event, backend: this.bus.activeBackend };
  }

  async replay(params: { topic: string; afterId?: string; count?: number }) {
    return this.bus.replay(params);
  }

  snapshots {
    return {
      snapshots: this.bus.listSnapshots,
      backend: this.bus.activeBackend,
      note: 'Consumer-group cursor snapshots — not full cluster backup OS.',
    };
  }

  analytics {
    return {
      ...this.bus.analytics,
      honesty: eventFabricHonesty,
      docs: '/docs/EVENT_FABRIC.md',
    };
  }

  monitoring {
    return {
      ...this.bus.monitoring,
      products: eventFabricCapabilityCatalog.map((p) => ({
        id: p.id,
        status: p.status,
      })),
      honesty: eventFabricHonesty,
      note:
        'Event Fabric monitoring. Redis Streams path active when REDIS_URL reachable; memory fallback otherwise.',
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
      products: eventFabricCapabilityCatalog,
      brokers: eventFabricBrokerCatalog,
      architecture: eventFabricArchitectureNotes,
      honesty: eventFabricHonesty,
      backend: this.bus.activeBackend,
      analytics: this.bus.analytics.totals,
      safety: {
        fabricWidePolicyHardGateRequired: true,
        policyLogOnlyForbidden: true,
        note:
          'Policy Fabric must enforce hard gates fabric-wide. Until then, Policy Runtime hard-gates Agent/Workflow/Plugin.',
      },
      deferred: {
        kafkaAdapter: true,
        natsAdapter: true,
        rabbitmqAdapter: true,
        contextFabric: false,
        knowledgeFabric: false,
        promptFabric: false,
        reasoningFabric: false,
        memoryFabric: false,
        agentFabric: false,
        policyFabric: false,
        kafkaHyperscalerOs: true,
        regeneratesVolumes1to9: false,
      },
      links: {
        eventFabric: '/event-fabric',
        contextFabric: '/context-fabric',
        aiFabric: '/ai-fabric',
        aiKernel: '/ai-kernel',
        streamingRuntime: '/streaming-runtime',
        batchRuntime: '/batch-runtime',
        policyRuntime: '/policy-runtime',
      },
      docs: '/docs/EVENT_FABRIC.md',
      note:
        'Event Fabric. CloudEvents over Redis Streams with DLQ/retries/replay/snapshots. Kafka/NATS/Rabbit deferred.',
    };
  }
}
