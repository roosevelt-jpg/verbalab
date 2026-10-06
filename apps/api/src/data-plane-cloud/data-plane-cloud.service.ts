import { Injectable } from '@nestjs/common';
import { UsageService } from '../usage/usage.service';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import {
  dataPlaneCloudArchitectureNotes,
  dataPlaneCloudHonesty,
  dataPlaneCloudProductCatalog,
  dataPlaneCloudRoutingTable,
  dataPlaneCloudRuntimeInventory,
} from './data-plane-cloud.catalog';

@Injectable()
export class DataPlaneCloudService {
  constructor(private readonly usage: UsageService) {}

  products() {
    return {
      product: 'Lugemi Data Plane Cloud',
      products: dataPlaneCloudProductCatalog(),
      runtimeInventory: dataPlaneCloudRuntimeInventory(),
      architecture: dataPlaneCloudArchitectureNotes(),
      honesty: dataPlaneCloudHonesty(),
      safety: {
        managesOrgsPoliciesBilling: false,
        serviceMeshOs: false,
        thinExecutionLayer: true,
        duplicatesProductLogic: false,
        note:
          'Volume 18 README: Data Plane executes workloads. Thin hubs route to Volumes 1–7 product logic. Service Mesh / VAIOS deferred past Volume 18.',
      },
      docs: '/docs/DATA_PLANE_CLOUD.md',
      note:
        'Data Plane Foundation. Executes via thin runtimes — never manages orgs/policies/billing. Not Service Mesh OS.',
    };
  }

  routing() {
    return {
      routes: dataPlaneCloudRoutingTable(),
      products: dataPlaneCloudProductCatalog().map((p) => ({
        id: p.id,
        status: p.status,
        api: p.api,
      })),
      runtimeInventory: dataPlaneCloudRuntimeInventory(),
      honesty: dataPlaneCloudHonesty(),
      note: 'Static Data Plane Cloud discovery catalog for Foundation.',
      docs: '/docs/DATA_PLANE_CLOUD.md',
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
      products: dataPlaneCloudProductCatalog(),
      runtimeInventory: dataPlaneCloudRuntimeInventory(),
      architecture: dataPlaneCloudArchitectureNotes(),
      honesty: dataPlaneCloudHonesty(),
      safety: {
        managesOrgsPoliciesBilling: false,
        serviceMeshOs: false,
        note:
          'Data Plane honesty enforced. Orgs/policies/billing stay in Control Plane. Service Mesh rejected here.',
      },
      deferred: {
        serviceMeshOs: true,
        vaios: true,
        architectureFreezeOs: true,
        managesOrgsPoliciesBilling: false,
      },
      links: {
        dataPlaneCloud: '/data-plane-cloud',
        translationRuntime: '/translation-runtime',
        speechRuntime: '/speech-runtime',
        voiceRuntime: '/voice-runtime',
        visionRuntime: '/vision-runtime',
        knowledgeRuntime: '/knowledge-runtime',
        embeddingRuntime: '/embedding-runtime',
        dataPlaneStreaming: '/data-plane-streaming',
        gpuRuntime: '/gpu-runtime',
        controlPlaneCloud: '/control-plane-cloud',
        streamingRuntime: '/streaming-runtime',
        gpuPlatform: '/gpu-platform',
      },
      docs: '/docs/DATA_PLANE_CLOUD.md',
      note:
        'Data Plane Cloud (–333). Discovery hub over thin execution runtimes; Production Audit closes the volume.',
    };
  }

  monitoring() {
    const products = dataPlaneCloudProductCatalog();
    return {
      mode: 'foundation',
      products: products.map((p) => ({ id: p.id, status: p.status })),
      runtimeInventory: dataPlaneCloudRuntimeInventory(),
      architecture: dataPlaneCloudArchitectureNotes(),
      honesty: dataPlaneCloudHonesty(),
      note: 'Data Plane Cloud monitoring snapshot.',
    };
  }
}
