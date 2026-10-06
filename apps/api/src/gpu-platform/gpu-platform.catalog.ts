export type GpuCapabilityStatus = 'shipped' | 'partial' | 'deferred';

export type GpuCapability = {
  id: string;
  name: string;
  status: GpuCapabilityStatus;
  api: string | null;
  notes: string;
};

export type GpuVendorId = 'nvidia' | 'amd' | 'intel';

export type GpuPool = {
  id: string;
  vendor: GpuVendorId;
  name: string;
  accelerator: string;
  vramGb: number;
  estimatedHourlyUsd: number;
  region: string;
  status: 'sandbox_available' | 'deferred';
  notes: string;
};

/** Sandbox pool catalog — logical only; no cloud GPU API behind these IDs. */
export function gpuPools: GpuPool[] {
  return [
    {
      id: 'sandbox-nvidia-t4',
      vendor: 'nvidia',
      name: 'Sandbox NVIDIA T4',
      accelerator: 'T4',
      vramGb: 16,
      estimatedHourlyUsd: 0.35,
      region: 'af-south-1',
      status: 'sandbox_available',
      notes: 'Logical sandbox inventory — not a real T4 reservation.',
    },
    {
      id: 'sandbox-nvidia-a10',
      vendor: 'nvidia',
      name: 'Sandbox NVIDIA A10',
      accelerator: 'A10',
      vramGb: 24,
      estimatedHourlyUsd: 0.75,
      region: 'af-south-1',
      status: 'sandbox_available',
      notes: 'Logical sandbox inventory — not a real A10 reservation.',
    },
    {
      id: 'sandbox-amd-mi210',
      vendor: 'amd',
      name: 'Sandbox AMD MI210',
      accelerator: 'MI210',
      vramGb: 64,
      estimatedHourlyUsd: 0.9,
      region: 'af-south-1',
      status: 'sandbox_available',
      notes: 'Logical sandbox inventory — AMD ROCm OS deferred.',
    },
    {
      id: 'sandbox-intel-max',
      vendor: 'intel',
      name: 'Sandbox Intel Data Center GPU Max',
      accelerator: 'Max 1100',
      vramGb: 48,
      estimatedHourlyUsd: 0.8,
      region: 'af-south-1',
      status: 'sandbox_available',
      notes: 'Logical sandbox inventory — Intel oneAPI cluster deferred.',
    },
  ];
}

export function gpuVendors {
  return [
    {
      id: 'nvidia' as const,
      name: 'NVIDIA',
      status: 'partial' as const,
      notes: 'Sandbox CUDA-class pool tags only — no cloud NVIDIA account wiring.',
    },
    {
      id: 'amd' as const,
      name: 'AMD',
      status: 'partial' as const,
      notes: 'Sandbox MI-class pool tags only — ROCm cluster OS deferred.',
    },
    {
      id: 'intel' as const,
      name: 'Intel',
      status: 'partial' as const,
      notes: 'Sandbox Max-class pool tags only — oneAPI cluster OS deferred.',
    },
  ];
}

/**
 * Library Phase 72 → GPU Platform.
 * Sandbox scheduler + hard ceilings — not a GPU hyperscaler OS.
 */
export function gpuPlatformCatalog {
  return {
    product: 'Lugemi GPU Platform',
    note:
      'Sandbox GPU pools/scheduling/quotas/autoscaling with hard instance and spend ceilings. Logical allocations only — does not call AWS/GCP/Azure GPU APIs. Not a hyperscaler GPU OS, MIG sharing suite, or distributed training fabric.',
    capabilities: [
      {
        id: 'nvidia',
        name: 'NVIDIA',
        status: 'partial',
        api: 'GET /v1/gpu-platform/vendors',
        notes: 'Sandbox NVIDIA pool tags.',
      },
      {
        id: 'amd',
        name: 'AMD',
        status: 'partial',
        api: 'GET /v1/gpu-platform/vendors',
        notes: 'Sandbox AMD pool tags.',
      },
      {
        id: 'intel',
        name: 'Intel',
        status: 'partial',
        api: 'GET /v1/gpu-platform/vendors',
        notes: 'Sandbox Intel pool tags.',
      },
      {
        id: 'gpu-pools',
        name: 'GPU Pools',
        status: 'shipped',
        api: 'GET /v1/gpu-platform/pools',
        notes: 'Sandbox pool catalog.',
      },
      {
        id: 'gpu-scheduling',
        name: 'GPU Scheduling',
        status: 'partial',
        api: 'POST /v1/gpu-platform/allocations',
        notes: 'Queue + activate sandbox allocations under ceilings.',
      },
      {
        id: 'gpu-quotas',
        name: 'GPU Quotas',
        status: 'shipped',
        api: 'GET /v1/gpu-platform/ceilings',
        notes: 'Hard max instances + max spend USD (enforced).',
      },
      {
        id: 'gpu-autoscaling',
        name: 'GPU Autoscaling',
        status: 'partial',
        api: 'POST /v1/gpu-platform/allocations/:id/scale',
        notes: 'Scale toward target but clamp to hard ceiling — never open-ended.',
      },
      {
        id: 'gpu-reservations',
        name: 'GPU Reservations',
        status: 'partial',
        api: 'POST /v1/gpu-platform/allocations',
        notes: 'Optional reservationUntil on sandbox allocations.',
      },
      {
        id: 'gpu-health',
        name: 'GPU Health',
        status: 'partial',
        api: 'GET /v1/gpu-platform/health',
        notes: 'Sandbox health snapshot — not vendor telemetry OS.',
      },
      {
        id: 'gpu-monitoring',
        name: 'GPU Monitoring',
        status: 'shipped',
        api: 'GET /v1/gpu-platform/monitoring',
        notes: 'Ceilings + active inventory + honesty.',
      },
      {
        id: 'gpu-cost-tracking',
        name: 'GPU Cost Tracking',
        status: 'shipped',
        api: 'GET /v1/gpu-platform/costs',
        notes: 'Estimated USD from sandbox hourly rates — not cloud invoices.',
      },
      {
        id: 'gpu-sharing',
        name: 'GPU Sharing',
        status: 'deferred',
        api: null,
        notes: 'MIG/time-slicing sharing OS deferred.',
      },
      {
        id: 'multi-gpu',
        name: 'Multi GPU',
        status: 'deferred',
        api: null,
        notes: 'Multi-GPU device binding OS deferred — multi-instance scale only.',
      },
      {
        id: 'distributed-gpu',
        name: 'Distributed GPU',
        status: 'deferred',
        api: null,
        notes: 'Distributed training fabric deferred.',
      },
      {
        id: 'analytics',
        name: 'Analytics',
        status: 'shipped',
        api: 'GET /v1/gpu-platform/analytics',
        notes: 'Allocation counts + estimated spend.',
      },
    ] satisfies GpuCapability[],
    honesty: {
      gpuHyperscalerOs: false,
      callsCloudGpuApis: false,
      openEndedGpuAutoscale: false,
      hardSpendCeilingsRequired: true,
      hardInstanceCeilingsRequired: true,
      sandboxLogicalOnly: true,
      migSharingOs: false,
      distributedTrainingOs: false,
      regeneratesAiGateway: false,
      orgWorkspaceScoped: true,
    },
    links: {
      console: '/gpu-platform',
      hub: '/inference-cloud',
      ceilings: 'GET /v1/gpu-platform/ceilings',
      docs: '/docs/GPU_PLATFORM.md',
      openapi: '/v1/openapi.json',
    },
  };
}

export type GpuProvisionMode = 'disabled' | 'sandbox';

export function gpuProvisionMode: GpuProvisionMode {
  const raw = (process.env.LUGEMI_GPU_PROVISION_MODE ?? 'sandbox').toLowerCase;
  if (raw === 'disabled') return 'disabled';
  return 'sandbox';
}

/** Hard ceilings — not soft targets. */
export function gpuCeilings {
  const maxInstances = Math.max(
    1,
    Number(process.env.LUGEMI_GPU_MAX_INSTANCES ?? '2') || 2,
  );
  const maxSpendUsd = Math.max(
    1,
    Number(process.env.LUGEMI_GPU_MAX_SPEND_USD ?? '25') || 25,
  );
  return {
    maxInstances: Math.min(maxInstances, 8),
    maxSpendUsd: Math.min(maxSpendUsd, 500),
    provisionMode: gpuProvisionMode,
    note:
      'Hard ceilings enforced on allocate/scale. Do not point at a production cloud billing account. No open-ended autoscale.',
  };
}
