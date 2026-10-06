import { HttpStatus, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { UsageService } from '../usage/usage.service';
import { ModelsService } from '../models/models.service';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { ApiException } from '../common/errors/api-exception';
import {
  DEPLOY_STRATEGIES,
  modelRegistryArchitectureNotes,
  modelRegistryCapabilities,
  modelRegistryCatalog,
  modelRegistryCeilings,
  modelRegistryHonesty,
  type MrDeployStrategy,
} from './model-registry.catalog';

export type RegistryVersionStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'active'
  | 'rolled_back';

export type RegistryVersion = {
  id: string;
  organizationId: string;
  workspaceId: string;
  modelSlug: string;
  version: string;
  status: RegistryVersionStatus;
  cardSummary: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type RegistryDeployment = {
  id: string;
  organizationId: string;
  workspaceId: string;
  versionId: string;
  modelSlug: string;
  strategy: MrDeployStrategy;
  canaryPercent: number | null;
  status: 'planned' | 'handed_off' | 'cancelled';
  notes: string;
  createdAt: string;
  updatedAt: string;
};

@Injectable
export class ModelRegistryService {
  private readonly versions = new Map<string, RegistryVersion>;
  private readonly deployments = new Map<string, RegistryDeployment>;

  constructor(
    private readonly usage: UsageService,
    private readonly models: ModelsService,
  ) {}

  async engine {
    const live = await this.models.liveMatrix;
    return {
      ...modelRegistryCatalog,
      capabilities: modelRegistryCapabilities,
      architecture: modelRegistryArchitectureNotes,
      ceilings: modelRegistryCeilings,
      liveSummary: {
        asOf: live.asOf,
        featureCount: live.features.length,
        note: 'Live matrix from — not regenerated here.',
      },
      safety: {
        noFakeConfiguredFlags: true,
        trafficMeshForbidden: true,
        note:
          'Configured flags come from env/artifact checks. Canary/shadow/blue-green are plan metadata only.',
      },
    };
  }

  capabilities {
    return {
      capabilities: modelRegistryCapabilities,
      honesty: modelRegistryHonesty,
      docs: '/docs/MODEL_REGISTRY.md',
    };
  }

  async overview(session: SessionContext) {
    const usageSummary = await this.usage.summary(session.organizationId);
    const cards = await this.cards;
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
      engine: await this.engine,
      cardCount: cards.cards.length,
      versions: this.listVersionsForOrg(session.organizationId).slice(0, 20),
      deployments: this.listDeploymentsForOrg(session.organizationId).slice(0, 20),
      deferred: {
        mlflowOs: true,
        sagemakerRegistryOs: true,
        trafficMeshOs: true,
        automaticWeightDeploy: true,
      },
      links: {
        modelRegistry: '/model-registry',
        models: '/models',
        modelServing: '/model-serving',
        modelTrainingPlatform: '/model-training-platform',
        modelEvaluationPlatform: '/model-evaluation-platform',
        foundationModelCloud: '/foundation-model-cloud',
        live: '/v1/models/live',
      },
      docs: '/docs/MODEL_REGISTRY.md',
      note:
        'Model Registry. Cards/versions/approvals over existing — not MLflow or traffic-mesh canary OS.',
    };
  }

  async cards {
    const entries = await this.models.list;
    const cards = entries.map((e) => ({
      id: e.id,
      slug: e.slug,
      displayName: e.displayName,
      feature: e.feature,
      kind: e.kind,
      provider: e.provider,
      baseModel: e.baseModel,
      status: e.status,
      externalUrl: e.externalUrl,
      notes: e.notes,
      card: {
        intendedUse: `${e.feature} via ${e.kind}${e.provider ? ` (${e.provider})` : ''}`,
        limitations:
          'Card is derived from registry metadata. Not a full Model Cards paper; no SOTA claims.',
        trainingData: e.kind === 'finetune' ? 'org fine-tune pack (if promoted)' : 'vendor proprietary / unknown',
        evaluation: 'See Model Evaluation Platform + /coverage for translation goldens',
        ethicalConsiderations:
          'Operators must validate bias/safety for their domains; sandbox suites are not certification.',
      },
    }));
    return {
      cards,
      honesty: modelRegistryHonesty,
      note: 'Model cards from entries — lightweight metadata, not academic Model Cards OS.',
      docs: '/docs/MODEL_REGISTRY.md',
    };
  }

  listVersions(session: SessionContext) {
    return {
      versions: this.listVersionsForOrg(session.organizationId),
      ceilings: modelRegistryCeilings,
      note: 'Org-scoped sandbox versions.',
    };
  }

  createVersion(
    session: SessionContext,
    body: { modelSlug?: string; version?: string; notes?: string; submit?: boolean },
  ) {
    const ceilings = modelRegistryCeilings;
    const existing = this.listVersionsForOrg(session.organizationId);
    if (existing.length >= ceilings.maxVersionsPerOrg) {
      throw new ApiException(
        'registry_ceiling',
        `Hard version ceiling exceeded: maxVersionsPerOrg ${ceilings.maxVersionsPerOrg}`,
        HttpStatus.PAYMENT_REQUIRED,
      );
    }
    const modelSlug = (body.modelSlug ?? '').trim;
    if (!modelSlug) {
      throw new ApiException(
        'validation_error',
        'modelSlug is required',
        HttpStatus.BAD_REQUEST,
      );
    }
    const now = new Date.toISOString;
    const version: RegistryVersion = {
      id: randomUUID,
      organizationId: session.organizationId,
      workspaceId: session.workspaceId,
      modelSlug: modelSlug.slice(0, 120),
      version: (body.version ?? `v${existing.filter((v) => v.modelSlug === modelSlug).length + 1}`).slice(
        0,
        64,
      ),
      status: body.submit === false ? 'draft' : 'pending_approval',
      cardSummary: `Sandbox card for ${modelSlug}`,
      notes: (body.notes ?? '').slice(0, 500),
      createdAt: now,
      updatedAt: now,
    };
    this.versions.set(version.id, version);
    return {
      version,
      honesty: modelRegistryHonesty,
      note: 'Sandbox version recorded. Approve before deploy plan.',
    };
  }

  approveVersion(session: SessionContext, id: string) {
    const version = this.requireVersion(session.organizationId, id);
    if (version.status !== 'pending_approval' && version.status !== 'draft') {
      throw new ApiException(
        'validation_error',
        `Cannot approve version in status ${version.status}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    version.status = 'approved';
    version.updatedAt = new Date.toISOString;
    this.versions.set(version.id, version);
    return { version };
  }

  rejectVersion(session: SessionContext, id: string, body: { notes?: string }) {
    const version = this.requireVersion(session.organizationId, id);
    version.status = 'rejected';
    if (body.notes) version.notes = `${version.notes} | reject: ${body.notes}`.slice(0, 500);
    version.updatedAt = new Date.toISOString;
    this.versions.set(version.id, version);
    return { version };
  }

  rollbackVersion(session: SessionContext, id: string) {
    const version = this.requireVersion(session.organizationId, id);
    const siblings = this.listVersionsForOrg(session.organizationId).filter(
      (v) => v.modelSlug === version.modelSlug && v.id !== version.id,
    );
    const previous = siblings.find((v) => v.status === 'active') ?? siblings[0];
    if (!previous) {
      throw new ApiException(
        'validation_error',
        'No prior version available to roll back to',
        HttpStatus.BAD_REQUEST,
      );
    }
    version.status = 'rolled_back';
    version.updatedAt = new Date.toISOString;
    previous.status = 'active';
    previous.updatedAt = new Date.toISOString;
    this.versions.set(version.id, version);
    this.versions.set(previous.id, previous);
    return {
      rolledBack: version,
      active: previous,
      note: 'Sandbox rollback only — does not mutate status or cluster traffic.',
    };
  }

  listDeployments(session: SessionContext) {
    return {
      deployments: this.listDeploymentsForOrg(session.organizationId),
      ceilings: modelRegistryCeilings,
      note: 'Org-scoped sandbox deployment plans.',
    };
  }

  createDeployment(
    session: SessionContext,
    body: {
      versionId?: string;
      strategy?: string;
      canaryPercent?: number;
      notes?: string;
    },
  ) {
    const ceilings = modelRegistryCeilings;
    const existing = this.listDeploymentsForOrg(session.organizationId);
    if (existing.length >= ceilings.maxDeploymentsPerOrg) {
      throw new ApiException(
        'registry_ceiling',
        `Hard deployment ceiling exceeded: maxDeploymentsPerOrg ${ceilings.maxDeploymentsPerOrg}`,
        HttpStatus.PAYMENT_REQUIRED,
      );
    }
    if (!body.versionId) {
      throw new ApiException(
        'validation_error',
        'versionId is required',
        HttpStatus.BAD_REQUEST,
      );
    }
    const version = this.requireVersion(session.organizationId, body.versionId);
    if (version.status !== 'approved' && version.status !== 'active') {
      throw new ApiException(
        'validation_error',
        'Version must be approved (or active) before deploy plan',
        HttpStatus.BAD_REQUEST,
      );
    }
    const strategy = this.normalizeStrategy(body.strategy ?? 'direct');
    let canaryPercent: number | null = null;
    if (strategy === 'canary') {
      const pct = Math.floor(Number(body.canaryPercent ?? 10));
      if (!Number.isFinite(pct) || pct < 1 || pct > ceilings.maxCanaryPercent) {
        throw new ApiException(
          'validation_error',
          `canaryPercent must be 1–${ceilings.maxCanaryPercent}`,
          HttpStatus.BAD_REQUEST,
        );
      }
      canaryPercent = pct;
    }
    const now = new Date.toISOString;
    const deployment: RegistryDeployment = {
      id: randomUUID,
      organizationId: session.organizationId,
      workspaceId: session.workspaceId,
      versionId: version.id,
      modelSlug: version.modelSlug,
      strategy,
      canaryPercent,
      status: 'handed_off',
      notes: (body.notes ?? '').slice(0, 500),
      createdAt: now,
      updatedAt: now,
    };
    this.deployments.set(deployment.id, deployment);
    version.status = 'active';
    version.updatedAt = now;
    this.versions.set(version.id, version);
    return {
      deployment,
      handoff: {
        api: 'GET /v1/model-serving/engine',
        console: '/model-serving',
        note:
          'Deploy plan metadata only. Real serving stays on Model Serving / Gateway — no traffic-mesh canary OS.',
      },
      honesty: modelRegistryHonesty,
    };
  }

  monitoring(session: SessionContext) {
    const versions = this.listVersionsForOrg(session.organizationId);
    const deployments = this.listDeploymentsForOrg(session.organizationId);
    const byVersionStatus: Record<string, number> = {};
    for (const v of versions) {
      byVersionStatus[v.status] = (byVersionStatus[v.status] ?? 0) + 1;
    }
    const byStrategy: Record<string, number> = {};
    for (const d of deployments) {
      byStrategy[d.strategy] = (byStrategy[d.strategy] ?? 0) + 1;
    }
    return {
      mode: 'foundation',
      versionCount: versions.length,
      deploymentCount: deployments.length,
      byVersionStatus,
      byStrategy,
      honesty: modelRegistryHonesty,
      note:
        'Model Registry monitoring. Sandbox governance over existing; mesh strategies deferred as metadata-only.',
    };
  }

  private listVersionsForOrg(organizationId: string): RegistryVersion[] {
    return [...this.versions.values]
      .filter((v) => v.organizationId === organizationId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  private listDeploymentsForOrg(organizationId: string): RegistryDeployment[] {
    return [...this.deployments.values]
      .filter((d) => d.organizationId === organizationId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  private requireVersion(organizationId: string, id: string): RegistryVersion {
    const version = this.versions.get(id);
    if (!version || version.organizationId !== organizationId) {
      throw new ApiException('not_found', 'Registry version not found', HttpStatus.NOT_FOUND);
    }
    return version;
  }

  private normalizeStrategy(raw: string): MrDeployStrategy {
    const id = raw.trim.toLowerCase.replace(/-/g, '_') as MrDeployStrategy;
    if (!DEPLOY_STRATEGIES.includes(id)) {
      throw new ApiException(
        'validation_error',
        `Unknown deploy strategy: ${raw}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return id;
  }
}
