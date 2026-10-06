import { HttpStatus, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { UsageService } from '../usage/usage.service';
import { FineTunesService } from '../finetunes/finetunes.service';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { ApiException } from '../common/errors/api-exception';
import {
  modelTrainingCeilings,
  modelTrainingMethods,
  modelTrainingPlatformArchitectureNotes,
  modelTrainingPlatformCatalog,
  modelTrainingPlatformHonesty,
  type MtpMethodId,
} from './model-training-platform.catalog';

export type TrainingExperimentStatus =
  | 'planned'
  | 'ready_to_launch'
  | 'handed_off'
  | 'checkpointed'
  | 'cancelled';

export type TrainingExperiment = {
  id: string;
  organizationId: string;
  workspaceId: string;
  method: MtpMethodId;
  name: string;
  baseModel: string;
  sourceLang: string;
  targetLang: string;
  datasetRef: string | null;
  hyperparams: Record<string, string | number | boolean>;
  status: TrainingExperimentStatus;
  checkpointIndex: number;
  trainingJobId: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

const LAUNCHABLE: MtpMethodId[] = ['lora', 'instruction_tuning'];

@Injectable()
export class ModelTrainingPlatformService {
  private readonly experiments = new Map<string, TrainingExperiment>();

  constructor(
    private readonly usage: UsageService,
    private readonly finetunes: FineTunesService,
  ) {}

  engine() {
    return {
      ...modelTrainingPlatformCatalog(),
      methods: modelTrainingMethods(),
      architecture: modelTrainingPlatformArchitectureNotes(),
      ceilings: modelTrainingCeilings(),
      launchers: this.finetunes.launcherStatus(),
      safety: {
        noFakeGpuSuccess: true,
        noFakeTrainedWeights: true,
        note:
          'Launchers never invent GPU success without callback (ADR-0040). Platform does not claim trained competitive weights.',
      },
    };
  }

  methods() {
    return {
      methods: modelTrainingMethods(),
      honesty: modelTrainingPlatformHonesty(),
      docs: '/docs/MODEL_TRAINING_PLATFORM.md',
    };
  }

  async overview(session: SessionContext) {
    const usageSummary = await this.usage.summary(session.organizationId);
    const experiments = this.listExperimentsForOrg(session.organizationId);
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
      engine: this.engine(),
      experiments: experiments.slice(0, 20),
      deferred: {
        distributedTraining: true,
        qlora: true,
        rlhf: true,
        dpo: true,
        syntheticData: true,
        trainsCompetitiveFoundationWeights: true,
        wandbMlflowOs: true,
      },
      links: {
        modelTrainingPlatform: '/model-training-platform',
        foundationModelCloud: '/foundation-model-cloud',
        trainingJobs: '/v1/training-jobs',
        models: '/models',
        gpuPlatform: '/gpu-platform',
        costOptimization: '/cost-optimization',
        inferenceCloud: '/inference-cloud',
      },
      docs: '/docs/MODEL_TRAINING_PLATFORM.md',
      note:
        'Model Training Platform. Orchestrates experiment plans over existing — not a distributed training OS.',
    };
  }

  listExperiments(session: SessionContext) {
    return {
      experiments: this.listExperimentsForOrg(session.organizationId),
      ceilings: modelTrainingCeilings(),
      note: 'Org-scoped sandbox experiment plans.',
    };
  }

  getExperiment(session: SessionContext, id: string) {
    return { experiment: this.requireExperiment(session.organizationId, id) };
  }

  createExperiment(
    session: SessionContext,
    body: {
      method?: string;
      name?: string;
      baseModel?: string;
      sourceLang?: string;
      targetLang?: string;
      datasetRef?: string;
      hyperparams?: Record<string, unknown>;
      notes?: string;
    },
  ) {
    const ceilings = modelTrainingCeilings();
    const existing = this.listExperimentsForOrg(session.organizationId);
    if (existing.length >= ceilings.maxExperimentsPerOrg) {
      throw new ApiException(
        'training_ceiling',
        `Hard experiment ceiling exceeded: maxExperimentsPerOrg ${ceilings.maxExperimentsPerOrg}`,
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    const method = this.normalizeMethod(body.method ?? 'lora');
    const hyperparams = this.normalizeHyperparams(body.hyperparams);
    const now = new Date().toISOString();
    const experiment: TrainingExperiment = {
      id: randomUUID(),
      organizationId: session.organizationId,
      workspaceId: session.workspaceId,
      method,
      name: (body.name ?? `${method}-${Date.now()}`).slice(0, 120),
      baseModel: (body.baseModel ?? 'nllb-200-distilled-600M').slice(0, 120),
      sourceLang: (body.sourceLang ?? 'en').trim().toLowerCase().slice(0, 16),
      targetLang: (body.targetLang ?? 'sw').trim().toLowerCase().slice(0, 16),
      datasetRef: body.datasetRef?.trim().slice(0, 240) || null,
      hyperparams,
      status: LAUNCHABLE.includes(method) ? 'ready_to_launch' : 'planned',
      checkpointIndex: 0,
      trainingJobId: null,
      notes: (body.notes ?? '').slice(0, 500),
      createdAt: now,
      updatedAt: now,
    };
    this.experiments.set(experiment.id, experiment);
    return {
      experiment,
      honesty: modelTrainingPlatformHonesty(),
      note: LAUNCHABLE.includes(method)
        ? 'Experiment ready. POST …/launch to hand off to /v1/training-jobs (does not invent GPU success).'
        : 'Method is deferred or non-launchable — plan recorded for roadmap tracking only.',
    };
  }

  launchExperiment(session: SessionContext, id: string) {
    const experiment = this.requireExperiment(session.organizationId, id);
    if (!LAUNCHABLE.includes(experiment.method)) {
      throw new ApiException(
        'validation_error',
        `Method ${experiment.method} is not launchable in (deferred / non-GPU path)`,
        HttpStatus.BAD_REQUEST,
      );
    }
    if (experiment.status === 'cancelled') {
      throw new ApiException(
        'validation_error',
        'Cancelled experiments cannot be launched',
        HttpStatus.BAD_REQUEST,
      );
    }

    const handoff = {
      api: 'POST /v1/training-jobs',
      body: {
        sourceLang: experiment.sourceLang,
        targetLang: experiment.targetLang,
        baseModel: experiment.baseModel,
        launcher: 'manual',
        datasetAssetId: experiment.datasetRef,
      },
      then: [
        'POST /v1/training-jobs/:id/launch',
        'GPU worker callback or POST /v1/training-jobs/:id/complete',
      ],
      launchers: this.finetunes.launcherStatus(),
      note:
        'Handoff only — Model Training Platform does not regenerate or invent GPU completion. Manual is the honest default when Modal/Vertex URLs are unset.',
    };

    experiment.status = 'handed_off';
    experiment.updatedAt = new Date().toISOString();
    this.experiments.set(experiment.id, experiment);

    return {
      experiment,
      handoff,
      honesty: modelTrainingPlatformHonesty(),
    };
  }

  checkpointExperiment(
    session: SessionContext,
    id: string,
    body: { index?: number; note?: string },
  ) {
    const experiment = this.requireExperiment(session.organizationId, id);
    const ceilings = modelTrainingCeilings();
    const next =
      typeof body.index === 'number' && Number.isFinite(body.index)
        ? Math.max(0, Math.floor(body.index))
        : experiment.checkpointIndex + 1;
    if (next > ceilings.maxCheckpointsPerExperiment) {
      throw new ApiException(
        'training_ceiling',
        `Hard checkpoint ceiling exceeded: maxCheckpointsPerExperiment ${ceilings.maxCheckpointsPerExperiment}`,
        HttpStatus.PAYMENT_REQUIRED,
      );
    }
    experiment.checkpointIndex = next;
    experiment.status = 'checkpointed';
    if (body.note) {
      experiment.notes = `${experiment.notes} | ckpt ${next}: ${body.note}`.slice(0, 500);
    }
    experiment.updatedAt = new Date().toISOString();
    this.experiments.set(experiment.id, experiment);
    return {
      experiment,
      note: 'Sandbox checkpoint metadata only — not a distributed checkpoint filesystem.',
    };
  }

  cancelExperiment(session: SessionContext, id: string) {
    const experiment = this.requireExperiment(session.organizationId, id);
    experiment.status = 'cancelled';
    experiment.updatedAt = new Date().toISOString();
    this.experiments.set(experiment.id, experiment);
    return { experiment };
  }

  monitoring(session: SessionContext) {
    const experiments = this.listExperimentsForOrg(session.organizationId);
    const byStatus: Record<string, number> = {};
    for (const e of experiments) {
      byStatus[e.status] = (byStatus[e.status] ?? 0) + 1;
    }
    return {
      mode: 'foundation',
      experimentCount: experiments.length,
      byStatus,
      methods: modelTrainingMethods().map((m) => ({
        id: m.id,
        status: m.status,
        launchable: m.launchable,
      })),
      launchers: this.finetunes.launcherStatus(),
      honesty: modelTrainingPlatformHonesty(),
      note:
        'Model Training Platform monitoring. Hub partial; distributed/RLHF/DPO deferred.',
    };
  }

  private listExperimentsForOrg(organizationId: string): TrainingExperiment[] {
    return [...this.experiments.values()]
      .filter((e) => e.organizationId === organizationId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  private requireExperiment(organizationId: string, id: string): TrainingExperiment {
    const experiment = this.experiments.get(id);
    if (!experiment || experiment.organizationId !== organizationId) {
      throw new ApiException(
        'not_found',
        'Training experiment not found',
        HttpStatus.NOT_FOUND,
      );
    }
    return experiment;
  }

  private normalizeMethod(raw: string): MtpMethodId {
    const id = raw.trim().toLowerCase().replace(/-/g, '_') as MtpMethodId;
    const known = modelTrainingMethods().find((m) => m.id === id);
    if (!known) {
      throw new ApiException(
        'validation_error',
        `Unknown training method: ${raw}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return known.id;
  }

  private normalizeHyperparams(
    raw: Record<string, unknown> | undefined,
  ): Record<string, string | number | boolean> {
    if (!raw || typeof raw !== 'object') return {};
    const ceilings = modelTrainingCeilings();
    const entries = Object.entries(raw).slice(0, ceilings.maxHyperparamKeys);
    const out: Record<string, string | number | boolean> = {};
    for (const [k, v] of entries) {
      if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
        out[k.slice(0, 64)] = v;
      }
    }
    return out;
  }
}
