export type EventFabricStatus = 'shipped' | 'partial' | 'deferred';

export type EventFabricCapability = {
  id: string;
  name: string;
  status: EventFabricStatus;
  api: string | null;
  notes: string;
};

export type EventFabricBroker = {
  id: string;
  name: string;
  status: EventFabricStatus;
  protocol: string;
  notes: string;
};

/**
 * Event Fabric.
 * Enterprise event bus over Redis Streams (active) + CloudEvents.
 * Kafka/NATS/RabbitMQ are catalogued adapters — not provisioned clusters.
 */
export function eventFabricCapabilityCatalog(): EventFabricCapability[] {
  return [
    {
      id: 'event-platform',
      name: 'Event Platform',
      status: 'shipped',
      api: 'GET /v1/event-fabric/products',
      notes: 'Internal event bus hub. Extends AI Fabric — not a Kafka hyperscaler OS.',
    },
    {
      id: 'redis-streams',
      name: 'Redis Streams',
      status: 'shipped',
      api: 'POST /v1/event-fabric/events',
      notes: 'Active broker path via REDIS_URL (XADD/XREADGROUP) with in-memory fallback.',
    },
    {
      id: 'cloudevents',
      name: 'CloudEvents',
      status: 'shipped',
      api: 'POST /v1/event-fabric/events',
      notes: 'CloudEvents 1.0 envelope (specversion, id, source, type, time, data).',
    },
    {
      id: 'event-versioning',
      name: 'Event Versioning',
      status: 'shipped',
      api: 'POST /v1/event-fabric/events',
      notes: 'dataschema / eventVersion fields on publish; filterable on poll.',
    },
    {
      id: 'retries',
      name: 'Retries',
      status: 'shipped',
      api: 'POST /v1/event-fabric/events/:id/fail',
      notes: 'Attempt budget before dead-letter; requeue from DLQ.',
    },
    {
      id: 'dead-letter-queues',
      name: 'Dead Letter Queues',
      status: 'shipped',
      api: 'GET /v1/event-fabric/dlq',
      notes: 'Failed events after max attempts land in per-topic DLQ stream.',
    },
    {
      id: 'replay',
      name: 'Replay',
      status: 'shipped',
      api: 'POST /v1/event-fabric/replay',
      notes: 'Re-read from stream ID / afterId without mutating the primary cursor.',
    },
    {
      id: 'snapshots',
      name: 'Snapshots',
      status: 'shipped',
      api: 'GET /v1/event-fabric/snapshots',
      notes: 'Consumer-group cursor snapshots for ops/debug — not full cluster backup OS.',
    },
    {
      id: 'kafka',
      name: 'Kafka Adapter',
      status: 'deferred',
      api: null,
      notes: 'Catalogued; no Kafka cluster provisioned in this phase.',
    },
    {
      id: 'nats',
      name: 'NATS Adapter',
      status: 'deferred',
      api: null,
      notes: 'Catalogued; no NATS cluster provisioned in this phase.',
    },
    {
      id: 'rabbitmq',
      name: 'RabbitMQ Adapter',
      status: 'deferred',
      api: null,
      notes: 'Catalogued; no RabbitMQ cluster provisioned in this phase.',
    },
    {
      id: 'monitoring',
      name: 'Monitoring',
      status: 'shipped',
      api: 'GET /v1/event-fabric/monitoring',
      notes: 'Publish/consume/DLQ counters + active backend.',
    },
    {
      id: 'analytics',
      name: 'Analytics',
      status: 'shipped',
      api: 'GET /v1/event-fabric/analytics',
      notes: 'Per-topic publish/fail counts — not a warehouse OS.',
    },
  ];
}

export function eventFabricBrokerCatalog(): EventFabricBroker[] {
  return [
    {
      id: 'redis_streams',
      name: 'Redis Streams',
      status: 'shipped',
      protocol: 'redis-streams',
      notes: 'Default active backend. Uses REDIS_URL when reachable; else memory streams.',
    },
    {
      id: 'kafka',
      name: 'Apache Kafka',
      status: 'deferred',
      protocol: 'kafka',
      notes: 'Named for Event Fabric roadmap — adapter not wired; no cluster OS.',
    },
    {
      id: 'nats',
      name: 'NATS',
      status: 'deferred',
      protocol: 'nats',
      notes: 'Named for Event Fabric roadmap — adapter not wired.',
    },
    {
      id: 'rabbitmq',
      name: 'RabbitMQ',
      status: 'deferred',
      protocol: 'amqp',
      notes: 'Named for Event Fabric roadmap — adapter not wired.',
    },
  ];
}

export function eventFabricArchitectureNotes() {
  return {
    style: 'nest_modular_monolith',
    ddd: 'bounded_event_fabric',
    cqrs: true,
    hexagonalRewrite: false,
    repositoryPattern: 'redis_streams_or_memory',
    eventDriven: 'cloudevents_over_redis_streams',
    solid: true,
    terraform: true,
    terraformPath: 'infra/DEPLOY.md',
    kubernetes: true,
    kubernetesPath: 'infra/AWS_EKS.md',
    primaryRegion: 'af-south-1',
    extendsAiFabric: true,
    regeneratesVolumes1to9: false,
    customerFacingProduct: false,
    kafkaHyperscalerOs: false,
    natsClusterOs: false,
    rabbitClusterOs: false,
    redisClusterOs: false,
    fabricWidePolicyHardGateRequired: true,
    policyLogOnlyForbidden: true,
    redisStreamsActive: true,
    kafkaAdapterDeferred: true,
    natsAdapterDeferred: true,
    rabbitmqAdapterDeferred: true,
    note:
      'Event Fabric. Real Redis Streams publish/consume with CloudEvents, versioning, DLQ, retries, replay, snapshots. Kafka/NATS/RabbitMQ remain deferred adapters — not fake-ready clusters.',
  };
}

export function eventFabricHonesty() {
  return {
    customerFacingProduct: false,
    kafkaHyperscalerOs: false,
    natsClusterOs: false,
    rabbitClusterOs: false,
    redisClusterOs: false,
    regeneratesVolumes1to9: false,
    regeneratesAiFabric: false,
    fabricWidePolicyHardGateRequired: true,
    policyLogOnlyForbidden: true,
    redisStreamsActive: true,
    kafkaAdapterDeferred: true,
    natsAdapterDeferred: true,
    rabbitmqAdapterDeferred: true,
    memoryFallbackWhenRedisUnavailable: true,
    cloudeventsEnvelope: true,
  };
}
