import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ApiException } from '../common/errors/api-exception';
import { AuditService } from '../audit/audit.service';
import { AudioService } from '../audio/audio.service';
import { TranslateService } from '../translate/translate.service';
import { DocumentsService } from '../documents/documents.service';
import { NotificationsService } from '../notifications/notifications.service';
import { WebhookService } from '../jobs/webhook.service';
import {
  WORKFLOW_MAX_STEPS,
  WORKFLOW_OPS,
  WorkflowInput,
  WorkflowOp,
  WorkflowResult,
  WorkflowStep,
  WorkflowStepResult,
} from './workflow.types';

@Injectable()
export class WorkflowsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly audio: AudioService,
    private readonly translate: TranslateService,
    private readonly documents: DocumentsService,
    private readonly notifications: NotificationsService,
    private readonly webhooks: WebhookService,
  ) {}

  async list(organizationId: string, workspaceId: string) {
    const rows = await this.prisma.workflow.findMany({
      where: { organizationId, workspaceId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return rows.map((row) => this.toDto(row));
  }

  async get(organizationId: string, workflowId: string) {
    const row = await this.prisma.workflow.findFirst({
      where: { id: workflowId, organizationId },
    });
    if (!row) {
      throw new ApiException('not_found', 'Workflow not found', HttpStatus.NOT_FOUND);
    }
    return this.toDto(row);
  }

  async create(input: {
    organizationId: string;
    workspaceId: string;
    name: string;
    steps: unknown;
    userId?: string;
    route?: string;
  }) {
    const name = input.name.trim();
    if (!name) {
      throw new ApiException('validation_error', 'name is required', HttpStatus.BAD_REQUEST);
    }
    const steps = this.parseSteps(input.steps);
    const row = await this.prisma.workflow.create({
      data: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        name,
        steps: steps as unknown as Prisma.InputJsonValue,
      },
    });
    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'workflow.created',
      route: input.route ?? 'POST /v1/workflows',
      metadata: { workflowId: row.id, steps: steps.length },
    });
    return this.toDto(row);
  }

  async remove(input: {
    organizationId: string;
    workflowId: string;
    userId?: string;
    role: string;
  }) {
    if (input.role !== 'owner' && input.role !== 'admin') {
      throw new ApiException(
        'forbidden',
        'Only owners and admins can delete workflows',
        HttpStatus.FORBIDDEN,
      );
    }
    const row = await this.prisma.workflow.findFirst({
      where: { id: input.workflowId, organizationId: input.organizationId },
    });
    if (!row) {
      throw new ApiException('not_found', 'Workflow not found', HttpStatus.NOT_FOUND);
    }
    await this.prisma.workflow.delete({ where: { id: row.id } });
    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'workflow.deleted',
      route: 'DELETE /v1/workflows/:id',
      metadata: { workflowId: row.id },
    });
    return { deleted: true, id: row.id };
  }

  parseWorkflowInput(payload: unknown): WorkflowInput {
    if (!payload || typeof payload !== 'object') {
      throw new ApiException('validation_error', 'Invalid workflow payload', HttpStatus.BAD_REQUEST);
    }
    const body = payload as Record<string, unknown>;
    const workflowId = typeof body.workflowId === 'string' ? body.workflowId : undefined;
    const name = typeof body.name === 'string' ? body.name : undefined;
    const steps = this.parseSteps(body.steps);
    return { workflowId, name, steps };
  }

  async resolveJobInput(input: {
    organizationId: string;
    payload: unknown;
  }): Promise<WorkflowInput> {
    const body =
      input.payload && typeof input.payload === 'object'
        ? (input.payload as Record<string, unknown>)
        : {};

    if (typeof body.workflowId === 'string' && !Array.isArray(body.steps)) {
      const def = await this.get(input.organizationId, body.workflowId);
      return {
        workflowId: def.id,
        name: def.name,
        steps: def.steps as WorkflowStep[],
      };
    }

    return this.parseWorkflowInput(input.payload);
  }

  parseSteps(raw: unknown): WorkflowStep[] {
    if (!Array.isArray(raw)) {
      throw new ApiException('validation_error', 'steps must be an array', HttpStatus.BAD_REQUEST);
    }
    if (raw.length === 0) {
      throw new ApiException('validation_error', 'steps must not be empty', HttpStatus.BAD_REQUEST);
    }
    if (raw.length > WORKFLOW_MAX_STEPS) {
      throw new ApiException(
        'validation_error',
        `Maximum ${WORKFLOW_MAX_STEPS} steps per workflow`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const seen = new Set<string>();
    const steps: WorkflowStep[] = [];

    for (let i = 0; i < raw.length; i++) {
      const item = raw[i];
      if (!item || typeof item !== 'object') {
        throw new ApiException('validation_error', `steps[${i}] invalid`, HttpStatus.BAD_REQUEST);
      }
      const step = item as Record<string, unknown>;
      const id = typeof step.id === 'string' ? step.id.trim() : '';
      if (!id) {
        throw new ApiException('validation_error', `steps[${i}].id is required`, HttpStatus.BAD_REQUEST);
      }
      if (seen.has(id)) {
        throw new ApiException('validation_error', `Duplicate step id: ${id}`, HttpStatus.BAD_REQUEST);
      }
      seen.add(id);

      const op = step.op;
      if (typeof op !== 'string' || !WORKFLOW_OPS.includes(op as WorkflowOp)) {
        throw new ApiException(
          'validation_error',
          `steps[${i}].op must be one of ${WORKFLOW_OPS.join(', ')}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      if (op === 'transcribe') {
        const documentId = typeof step.documentId === 'string' ? step.documentId.trim() : '';
        if (!documentId) {
          throw new ApiException(
            'validation_error',
            `steps[${i}].documentId is required`,
            HttpStatus.BAD_REQUEST,
          );
        }
        steps.push({
          id,
          op: 'transcribe',
          documentId,
          language: typeof step.language === 'string' ? step.language : undefined,
        });
      } else if (op === 'translate') {
        if (typeof step.source !== 'string' || typeof step.target !== 'string') {
          throw new ApiException(
            'validation_error',
            `steps[${i}] requires source and target`,
            HttpStatus.BAD_REQUEST,
          );
        }
        if (typeof step.text !== 'string' || !step.text.trim()) {
          throw new ApiException(
            'validation_error',
            `steps[${i}].text is required`,
            HttpStatus.BAD_REQUEST,
          );
        }
        steps.push({
          id,
          op: 'translate',
          source: step.source,
          target: step.target,
          text: step.text,
        });
      } else {
        const channel = step.channel;
        if (channel !== 'email' && channel !== 'webhook') {
          throw new ApiException(
            'validation_error',
            `steps[${i}].channel must be email or webhook`,
            HttpStatus.BAD_REQUEST,
          );
        }
        if (typeof step.message !== 'string' || !step.message.trim()) {
          throw new ApiException(
            'validation_error',
            `steps[${i}].message is required`,
            HttpStatus.BAD_REQUEST,
          );
        }
        if (channel === 'webhook') {
          const webhookUrl = typeof step.webhookUrl === 'string' ? step.webhookUrl : '';
          if (!/^https?:\/\//i.test(webhookUrl)) {
            throw new ApiException(
              'validation_error',
              `steps[${i}].webhookUrl must be http(s)`,
              HttpStatus.BAD_REQUEST,
            );
          }
          steps.push({
            id,
            op: 'notify',
            channel: 'webhook',
            message: step.message,
            subject: typeof step.subject === 'string' ? step.subject : undefined,
            webhookUrl,
          });
        } else {
          steps.push({
            id,
            op: 'notify',
            channel: 'email',
            message: step.message,
            subject: typeof step.subject === 'string' ? step.subject : undefined,
          });
        }
      }
    }

    return steps;
  }

  async run(job: {
    id: string;
    organizationId: string;
    workspaceId: string;
    apiKeyId: string | null;
    input: Prisma.JsonValue;
  }): Promise<WorkflowResult> {
    const input = this.parseWorkflowInput(job.input);
    const context = new Map<string, Record<string, unknown>>();
    const stepResults: WorkflowStepResult[] = [];

    for (const step of input.steps) {
      const output = await this.runStep(step, {
        organizationId: job.organizationId,
        workspaceId: job.workspaceId,
        apiKeyId: job.apiKeyId,
        jobId: job.id,
        context,
      });
      context.set(step.id, output);
      stepResults.push({ id: step.id, op: step.op, output });
    }

    return {
      workflowId: input.workflowId ?? null,
      name: input.name ?? null,
      steps: stepResults,
    };
  }

  private async runStep(
    step: WorkflowStep,
    ctx: {
      organizationId: string;
      workspaceId: string;
      apiKeyId: string | null;
      jobId: string;
      context: Map<string, Record<string, unknown>>;
    },
  ): Promise<Record<string, unknown>> {
    if (step.op === 'transcribe') {
      const { doc, buffer } = await this.documents.readOwnedBuffer(
        ctx.organizationId,
        step.documentId,
      );
      const transcribed = await this.audio.transcribe({
        file: {
          fieldname: 'file',
          originalname: doc.filename,
          encoding: '7bit',
          mimetype: doc.mimeType,
          size: buffer.length,
          buffer,
          destination: '',
          filename: doc.filename,
          path: '',
          stream: undefined as never,
        } as Express.Multer.File,
        language: step.language,
        organizationId: ctx.organizationId,
        workspaceId: ctx.workspaceId,
        apiKeyId: ctx.apiKeyId ?? undefined,
      });
      return {
        text: transcribed.text,
        language: transcribed.language,
        durationSeconds: transcribed.durationSeconds,
        provider: transcribed.provider,
        documentId: doc.id,
      };
    }

    if (step.op === 'translate') {
      const text = this.interpolate(step.text, ctx.context).trim();
      if (!text) {
        throw new Error(`Step ${step.id}: translated text resolved empty`);
      }
      const translated = await this.translate.translate({
        text,
        source: step.source,
        target: step.target,
        organizationId: ctx.organizationId,
        workspaceId: ctx.workspaceId,
        apiKeyId: ctx.apiKeyId ?? undefined,
      });
      return {
        text: translated.text,
        source: translated.source,
        target: translated.target,
        characters: translated.characters,
        provider: translated.provider,
      };
    }

    const message = this.interpolate(step.message, ctx.context);
    const subject = step.subject
      ? this.interpolate(step.subject, ctx.context)
      : `VerbaLab workflow notify (${ctx.jobId})`;

    if (step.channel === 'email') {
      const result = await this.notifications.notifyWorkflowMessage({
        organizationId: ctx.organizationId,
        jobId: ctx.jobId,
        stepId: step.id,
        subject,
        message,
      });
      return {
        channel: 'email',
        delivered: Boolean(result),
        emailId: result?.id ?? null,
        message,
      };
    }

    const delivery = await this.webhooks.deliver({
      organizationId: ctx.organizationId,
      webhookUrl: step.webhookUrl!,
      event: 'workflow.notify',
      data: {
        jobId: ctx.jobId,
        stepId: step.id,
        message,
        subject,
      },
    });
    return {
      channel: 'webhook',
      delivered: delivery.ok,
      message,
    };
  }

  /** Replace `{{stepId.field}}` with prior step outputs. */
  interpolate(template: string, context: Map<string, Record<string, unknown>>): string {
    return template.replace(/\{\{\s*([a-zA-Z0-9_-]+)\.([a-zA-Z0-9_-]+)\s*\}\}/g, (_m, stepId, field) => {
      const output = context.get(stepId);
      if (!output || !(field in output)) {
        throw new Error(`Unknown placeholder {{${stepId}.${field}}}`);
      }
      const value = output[field];
      if (value === null || value === undefined) return '';
      return String(value);
    });
  }

  private toDto(row: {
    id: string;
    name: string;
    steps: Prisma.JsonValue;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: row.id,
      name: row.name,
      steps: row.steps,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
