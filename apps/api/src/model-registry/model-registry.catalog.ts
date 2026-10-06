export type MrCapabilityStatus = 'shipped' | 'partial' | 'deferred';

export type MrCapability = {
  id: string;
  name: string;
  status: MrCapabilityStatus;
  api: string | null;
  notes: string;
};

export type MrDeployStrategy = 'direct' | 'canary' | 'shadow' | 'blue_green';

/**
 * Model Registry.
 * Hub over existing `model_registry` — not MLflow / SageMaker Model Registry OS.
 */
export function modelRegistryCatalog() {
  return {
    product: 'Lugemi Model Registry',
    note:
      'Model Registry. Extends existing live matrix with model cards, sandbox versions/approvals/rollbacks, and deployment strategy plans. Does not invent MLflow, automatic weight deploy, or traffic-mesh canary OS. Links Model Serving for real deployments.',
    capabilities: [
      {
        id: 'registry-hub',
        name: 'Registry Hub',
        status: 'partial',
        api: 'GET /v1/model-registry/engine',
        notes: 'Catalog + live matrix bridge to model serving.',
      },
      {
        id: 'model-cards',
        name: 'Model Cards',
        status: 'partial',
        api: 'GET /v1/model-registry/cards',
        notes: 'Cards derived from entries + honesty notes.',
      },
      {
        id: 'versions',
        name: 'Versions',
        status: 'partial',
        api: 'POST /v1/model-registry/versions',
        notes: 'Sandbox version lineage per model slug.',
      },
      {
        id: 'approvals',
        name: 'Approvals',
        status: 'partial',
        api: 'POST /v1/model-registry/versions/:id/approve',
        notes: 'Sandbox approve/reject gates before deploy plans.',
      },
      {
        id: 'rollbacks',
        name: 'Rollbacks',
        status: 'partial',
        api: 'POST /v1/model-registry/versions/:id/rollback',
        notes: 'Marks prior sandbox version active — not cluster rollback OS.',
      },
      {
        id: 'deployments',
        name: 'Deployments',
        status: 'partial',
        api: 'POST /v1/model-registry/deployments',
        notes: 'Sandbox deploy plans; handoff note to Model Serving.',
      },
      {
        id: 'canary',
        name: 'Canary',
        status: 'partial',
        api: 'POST /v1/model-registry/deployments',
        notes: 'Strategy metadata only — no mesh traffic split.',
      },
      {
        id: 'shadow',
        name: 'Shadow',
        status: 'partial',
        api: 'POST /v1/model-registry/deployments',
        notes: 'Shadow strategy metadata — no dual-path inference fabric.',
      },
      {
        id: 'blue-green',
        name: 'Blue Green',
        status: 'partial',
        api: 'POST /v1/model-registry/deployments',
        notes: 'Blue/green strategy metadata — not K8s Service swap OS.',
      },
    ] satisfies MrCapability[],
    honesty: modelRegistryHonesty(),
    docs: '/docs/MODEL_REGISTRY.md',
  };
}

export function modelRegistryCapabilities(): MrCapability[] {
  return modelRegistryCatalog().capabilities;
}

export function modelRegistryArchitectureNotes() {
  return {
    style: 'nest_modular_monolith',
    ddd: 'bounded_model_registry_hub',
    cqrs: true,
    hexagonalRewrite: false,
    repositoryPattern: 'prisma_model_registry_plus_sandbox_versions',
    eventDriven: 'audit_and_jobs_only',
    solid: true,
    terraform: true,
    terraformPath: 'infra/DEPLOY.md',
    kubernetes: true,
    kubernetesPath: 'infra/AWS_EKS.md',
    primaryRegion: 'af-south-1',
    extendsVl110: true,
    extendsModelServing: true,
    extendsFoundationModelCloud: true,
    regeneratesVl110: false,
    mlflowOs: false,
    sagemakerRegistryOs: false,
    trafficMeshOs: false,
    trainsCompetitiveFoundationWeights: false,
    customerFacingProduct: true,
    note:
      'registry governance hub over existing. Canary/shadow/blue-green are plan metadata, not mesh control.',
  };
}

export function modelRegistryHonesty() {
  return {
    trainsCompetitiveFoundationWeights: false,
    mlflowOs: false,
    sagemakerRegistryOs: false,
    trafficMeshOs: false,
    automaticWeightDeploy: false,
    regeneratesVl110: false,
    regeneratesVolumes1to8: false,
    openAiReplacementOs: false,
    extendsVl110: true,
    sandboxVersionsApprovalsDeployments: true,
  };
}

export function modelRegistryCeilings() {
  return {
    maxVersionsPerOrg: 200,
    maxDeploymentsPerOrg: 100,
    maxCanaryPercent: 50,
    mode: 'sandbox',
    note:
      'Sandbox ceilings for version/deploy plans. Live adapter matrix remains ; serving remains Model Serving.',
  };
}

export const DEPLOY_STRATEGIES: MrDeployStrategy[] = [
  'direct',
  'canary',
  'shadow',
  'blue_green',
];
