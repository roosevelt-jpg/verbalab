import { Query, Resolver } from '@nestjs/graphql';
import { GpuPlatformService } from '../gpu-platform/gpu-platform.service';
import { GqlGpuPlatformEngine } from './gql.types';

@Resolver
export class GpuPlatformGraphqlResolver {
  constructor(private readonly gpu: GpuPlatformService) {}

  @Query( => GqlGpuPlatformEngine, { name: 'gpuPlatformEngine' })
  gpuPlatformEngine: GqlGpuPlatformEngine {
    const c = this.gpu.engine;
    return {
      product: c.product,
      note: c.note,
      capabilities: c.capabilities,
      gpuHyperscalerOs: c.honesty.gpuHyperscalerOs,
      callsCloudGpuApis: c.honesty.callsCloudGpuApis,
      openEndedGpuAutoscale: c.honesty.openEndedGpuAutoscale,
      hardSpendCeilingsRequired: c.honesty.hardSpendCeilingsRequired,
      sandboxLogicalOnly: c.honesty.sandboxLogicalOnly,
      orgWorkspaceScoped: c.honesty.orgWorkspaceScoped,
      maxInstances: c.ceilings.maxInstances,
      maxSpendUsd: c.ceilings.maxSpendUsd,
      provisionMode: c.ceilings.provisionMode,
    };
  }
}
