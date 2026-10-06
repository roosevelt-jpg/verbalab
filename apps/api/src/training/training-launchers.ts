import { randomBytes } from 'crypto';
import { HttpStatus } from '@nestjs/common';
import { ApiException } from '../common/errors/api-exception';
import type { FineTuneLauncher } from '../finetunes/finetune.types';

export type TrainingLaunchInput = {
  jobId: string;
  organizationId: string;
  sourceLang: string;
  targetLang: string;
  baseModel: string;
  trainingPackPath: string;
  callbackUrl: string;
  callbackToken: string;
};

export type TrainingLaunchResult = {
  externalJobId: string;
  status: 'running' | 'awaiting_gpu';
  message?: string;
  providerMeta?: Record<string, unknown>;
};

export interface TrainingGpuLauncher {
  readonly name: FineTuneLauncher;
  isConfigured(): boolean;
  launch(input: TrainingLaunchInput): Promise<TrainingLaunchResult>;
}

export function newCallbackToken(): string {
  return randomBytes(24).toString('hex');
}

/** Manual: operator trains elsewhere and attaches an artifact (roadmap-default). */
export class ManualTrainingLauncher implements TrainingGpuLauncher {
  readonly name = 'manual' as const;

  isConfigured(): boolean {
    return true;
  }

  async launch(_input: TrainingLaunchInput): Promise<TrainingLaunchResult> {
    return {
      externalJobId: `manual:${_input.jobId}`,
      status: 'awaiting_gpu',
      message:
        'Manual launcher: train on rented GPUs outside VerbaLab, then POST …/complete or the signed callback with an artifact.',
      providerMeta: { launcher: 'manual' },
    };
  }
}

/**
 * Modal: buys GPU by POSTing to a customer-configured launch webhook.
 * Requires MODAL_TOKEN_ID + MODAL_TOKEN_SECRET + MODAL_LAUNCH_URL.
 * Never invents a successful GPU run without a real HTTP acknowledgement.
 */
export class ModalTrainingLauncher implements TrainingGpuLauncher {
  readonly name = 'modal' as const;

  constructor(private readonly fetchImpl: typeof fetch = fetch) {}

  isConfigured(): boolean {
    return Boolean(
      process.env.MODAL_TOKEN_ID &&
        process.env.MODAL_TOKEN_SECRET &&
        process.env.MODAL_LAUNCH_URL,
    );
  }

  async launch(input: TrainingLaunchInput): Promise<TrainingLaunchResult> {
    if (!this.isConfigured()) {
      throw new ApiException(
        'provider_not_configured',
        'Modal not configured. Set MODAL_TOKEN_ID, MODAL_TOKEN_SECRET, and MODAL_LAUNCH_URL (your Modal/webhook endpoint), or use launcher=manual.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const url = process.env.MODAL_LAUNCH_URL!;
    const response = await this.fetchImpl(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Modal-Token-Id': process.env.MODAL_TOKEN_ID!,
        'X-Modal-Token-Secret': process.env.MODAL_TOKEN_SECRET!,
      },
      body: JSON.stringify({
        jobId: input.jobId,
        sourceLang: input.sourceLang,
        targetLang: input.targetLang,
        baseModel: input.baseModel,
        trainingPackPath: input.trainingPackPath,
        callbackUrl: input.callbackUrl,
        callbackToken: input.callbackToken,
      }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
      throw new ApiException(
        'provider_unavailable',
        `Modal launch webhook HTTP ${response.status}`,
        HttpStatus.BAD_GATEWAY,
      );
    }

    const json = (await response.json()) as { externalJobId?: string; id?: string };
    const externalJobId = json.externalJobId ?? json.id;
    if (!externalJobId) {
      throw new ApiException(
        'provider_error',
        'Modal launch webhook returned no externalJobId',
        HttpStatus.BAD_GATEWAY,
      );
    }

    return {
      externalJobId: String(externalJobId),
      status: 'running',
      providerMeta: { launcher: 'modal', launchUrl: url },
    };
  }
}

/**
 * Vertex AI: same buy-pattern via VERTEX_LAUNCH_URL + VERTEX_ACCESS_TOKEN.
 */
export class VertexTrainingLauncher implements TrainingGpuLauncher {
  readonly name = 'vertex' as const;

  constructor(private readonly fetchImpl: typeof fetch = fetch) {}

  isConfigured(): boolean {
    return Boolean(process.env.VERTEX_LAUNCH_URL && process.env.VERTEX_ACCESS_TOKEN);
  }

  async launch(input: TrainingLaunchInput): Promise<TrainingLaunchResult> {
    if (!this.isConfigured()) {
      throw new ApiException(
        'provider_not_configured',
        'Vertex not configured. Set VERTEX_LAUNCH_URL and VERTEX_ACCESS_TOKEN, or use launcher=manual.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const url = process.env.VERTEX_LAUNCH_URL!;
    const response = await this.fetchImpl(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.VERTEX_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        jobId: input.jobId,
        sourceLang: input.sourceLang,
        targetLang: input.targetLang,
        baseModel: input.baseModel,
        trainingPackPath: input.trainingPackPath,
        callbackUrl: input.callbackUrl,
        callbackToken: input.callbackToken,
      }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
      throw new ApiException(
        'provider_unavailable',
        `Vertex launch webhook HTTP ${response.status}`,
        HttpStatus.BAD_GATEWAY,
      );
    }

    const json = (await response.json()) as { externalJobId?: string; name?: string };
    const externalJobId = json.externalJobId ?? json.name;
    if (!externalJobId) {
      throw new ApiException(
        'provider_error',
        'Vertex launch webhook returned no externalJobId',
        HttpStatus.BAD_GATEWAY,
      );
    }

    return {
      externalJobId: String(externalJobId),
      status: 'running',
      providerMeta: { launcher: 'vertex', launchUrl: url },
    };
  }
}

/**
 * CI / local fixture — only when TRAINING_FIXTURE=1.
 * Records a synthetic rented-GPU job id; does not claim a real Modal/Vertex run.
 */
export class FixtureTrainingLauncher implements TrainingGpuLauncher {
  readonly name = 'fixture' as const;

  isConfigured(): boolean {
    return process.env.TRAINING_FIXTURE === '1';
  }

  async launch(input: TrainingLaunchInput): Promise<TrainingLaunchResult> {
    if (!this.isConfigured()) {
      throw new ApiException(
        'provider_not_configured',
        'Fixture launcher requires TRAINING_FIXTURE=1',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    return {
      externalJobId: `fixture:${input.jobId}`,
      status: 'running',
      message: 'Fixture rented-GPU launch (TRAINING_FIXTURE=1). Complete via callback or …/complete.',
      providerMeta: { launcher: 'fixture' },
    };
  }
}

export function resolveTrainingLauncher(name: FineTuneLauncher): TrainingGpuLauncher {
  switch (name) {
    case 'manual':
      return new ManualTrainingLauncher();
    case 'modal':
      return new ModalTrainingLauncher();
    case 'vertex':
      return new VertexTrainingLauncher();
    case 'fixture':
      return new FixtureTrainingLauncher();
    default:
      throw new ApiException(
        'validation_error',
        `Unknown launcher: ${name}`,
        HttpStatus.BAD_REQUEST,
      );
  }
}
