export type KnowledgeFabricStatus = 'shipped' | 'partial' | 'deferred';

export type KnowledgeFabricCapability = {
  id: string;
  name: string;
  status: KnowledgeFabricStatus;
  api: string | null;
  notes: string;
};

export type KnowledgeFabricRoute = {
  kind: string;
  name: string;
  target: string;
  api: string;
  cloud: string;
  notes: string;
};

/**
 * Knowledge Fabric.
 * Cross-cloud knowledge routing over Knowledge Cloud — not Confluence/Neo4j OS.
 */
export function knowledgeFabricCapabilityCatalog(): KnowledgeFabricCapability[] {
  return [
    {
      id: 'knowledge-fabric',
      name: 'Knowledge Fabric',
      status: 'shipped',
      api: 'GET /v1/knowledge-fabric/products',
      notes:
        'Knowledge router hub. Extends Knowledge Cloud — does not regenerate –202 / .',
    },
    {
      id: 'knowledge-router',
      name: 'Knowledge Router',
      status: 'shipped',
      api: 'POST /v1/knowledge-fabric/route',
      notes: 'Maps knowledge intents to Knowledge Cloud / Search / RAG handoffs.',
    },
    {
      id: 'knowledge-distribution',
      name: 'Knowledge Distribution',
      status: 'shipped',
      api: 'POST /v1/knowledge-fabric/distribute',
      notes: 'Distribution plans + optional Event Fabric CloudEvents — not multi-region replica OS.',
    },
    {
      id: 'knowledge-synchronization',
      name: 'Knowledge Synchronization',
      status: 'shipped',
      api: 'POST /v1/knowledge-fabric/sync',
      notes: 'Same-org workspace sync cursors/plans — not bidirectional CRDT cluster OS.',
    },
    {
      id: 'knowledge-federation',
      name: 'Knowledge Federation',
      status: 'partial',
      api: 'POST /v1/knowledge-fabric/federate',
      notes: 'Federation target catalog across Knowledge Cloud products — not cross-tenant mesh OS.',
    },
    {
      id: 'knowledge-routing',
      name: 'Knowledge Routing',
      status: 'shipped',
      api: 'GET /v1/knowledge-fabric/routes',
      notes: 'Static routing table for search/RAG/KB/graph/memory surfaces.',
    },
    {
      id: 'cross-workspace-knowledge',
      name: 'Cross Workspace Knowledge',
      status: 'shipped',
      api: 'POST /v1/knowledge-fabric/sync',
      notes: 'Same-organization workspace peers only — not cross-org data plane.',
    },
    {
      id: 'enterprise-search-integration',
      name: 'Enterprise Search Integration',
      status: 'shipped',
      api: 'GET /v1/enterprise-search/engine',
      notes: 'Discovery handoff to Enterprise Search — not Elastic/BM25 OS.',
    },
    {
      id: 'monitoring',
      name: 'Monitoring',
      status: 'shipped',
      api: 'GET /v1/knowledge-fabric/monitoring',
      notes: 'Route/distribute/sync/federate counters + honesty.',
    },
  ];
}

export function knowledgeFabricRoutingTable(): KnowledgeFabricRoute[] {
  return [
    {
      kind: 'search',
      name: 'Enterprise Search',
      target: 'enterprise-search',
      api: 'GET /v1/enterprise-search/engine',
      cloud: 'knowledge',
      notes: 'Keyword/semantic/hybrid search hub.',
    },
    {
      kind: 'rag',
      name: 'Enterprise RAG',
      target: 'enterprise-rag',
      api: 'GET /v1/enterprise-rag/engine',
      cloud: 'knowledge',
      notes: 'Retrieve/chunk/cite over existing.',
    },
    {
      kind: 'knowledge-base',
      name: 'Enterprise Knowledge Base',
      target: 'knowledge-base',
      api: 'GET /v1/knowledge-base/engine',
      cloud: 'knowledge',
      notes: 'Org/workspace ingest collections.',
    },
    {
      kind: 'documents',
      name: 'Document Intelligence',
      target: 'knowledge',
      api: 'POST /v1/knowledge/documents',
      cloud: 'knowledge',
      notes: 'Upload/chunk/embed via existing.',
    },
    {
      kind: 'graph',
      name: 'Knowledge Graph',
      target: 'knowledge-graph',
      api: 'GET /v1/knowledge-graph/engine',
      cloud: 'intelligence',
      notes: 'Bounded ER graph — Neo4j OS deferred.',
    },
    {
      kind: 'memory',
      name: 'Knowledge Memory',
      target: 'knowledge-memory',
      api: 'GET /v1/knowledge-memory/engine',
      cloud: 'knowledge',
      notes: 'Knowledge-layer memory.',
    },
    {
      kind: 'ontology',
      name: 'Ontology Platform',
      target: 'ontology',
      api: 'GET /v1/ontology/engine',
      cloud: 'knowledge',
      notes: 'Concepts/hierarchies.',
    },
    {
      kind: 'taxonomy',
      name: 'Taxonomy Platform',
      target: 'taxonomy',
      api: 'GET /v1/taxonomy/engine',
      cloud: 'knowledge',
      notes: 'Categories/tags.',
    },
    {
      kind: 'context',
      name: 'Context Fabric Knowledge',
      target: 'context-fabric',
      api: 'POST /v1/context-fabric/propagate',
      cloud: 'ai-fabric',
      notes: 'Propagate knowledge kind via Context Fabric → Context Runtime.',
    },
    {
      kind: 'hub',
      name: 'Knowledge Cloud Hub',
      target: 'knowledge-cloud',
      api: 'GET /v1/knowledge-cloud/products',
      cloud: 'knowledge',
      notes: 'Parent product catalog.',
    },
  ];
}

export function knowledgeFabricArchitectureNotes() {
  return {
    style: 'nest_modular_monolith',
    ddd: 'bounded_knowledge_fabric',
    cqrs: true,
    hexagonalRewrite: false,
    repositoryPattern: 'delegates_to_knowledge_cloud',
    eventDriven: 'optional_event_fabric_cloudevents',
    solid: true,
    terraform: true,
    terraformPath: 'infra/DEPLOY.md',
    kubernetes: true,
    kubernetesPath: 'infra/AWS_EKS.md',
    primaryRegion: 'af-south-1',
    extendsAiFabric: true,
    extendsKnowledgeCloud: true,
    regeneratesKnowledgeCloud: false,
    regeneratesVl062: false,
    regeneratesVolumes1to9: false,
    customerFacingProduct: false,
    confluenceSharepointOs: false,
    neo4jFederationOs: false,
    crossOrgDataPlane: false,
    fabricWidePolicyHardGateRequired: true,
    policyLogOnlyForbidden: true,
    note:
      'Knowledge Fabric. Router/distribution/sync/federation plans over Knowledge Cloud + Enterprise Search. Same-org cross-workspace only. Not Confluence/Neo4j federation OS.',
  };
}

export function knowledgeFabricHonesty() {
  return {
    customerFacingProduct: false,
    confluenceSharepointOs: false,
    neo4jFederationOs: false,
    elasticSearchOs: false,
    regeneratesKnowledgeCloud: false,
    regeneratesVl062: false,
    regeneratesVolumes1to9: false,
    extendsKnowledgeCloud: true,
    crossWorkspaceSameOrgOnly: true,
    crossOrgDataPlane: false,
    optionalEventFabricPropagation: true,
    fabricWidePolicyHardGateRequired: true,
    policyLogOnlyForbidden: true,
  };
}
