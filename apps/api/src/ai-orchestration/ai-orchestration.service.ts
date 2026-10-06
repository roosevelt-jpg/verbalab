import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { GatewayService } from '../gateway/gateway.service';
import { TranslateService } from '../translate/translate.service';
import { ChatService } from '../chat/chat.service';
import { DecisionEngineService } from '../decision-engine/decision-engine.service';
import { ContextEngineService } from '../context-engine/context-engine.service';
import { ApiException } from '../common/errors/api-exception';
import {
  ORCH_PIPELINES,
  ORCH_TOOL_OPS,
  OrchPipelineId,
  OrchToolOp,
  aiOrchestrationCatalog,
} from './ai-orchestration.catalog';

type AuthCtx = {
  organizationId: string;
  workspaceId: string;
  apiKeyId?: string;
  userId?: string;
  ip?: string;
};

type StepResult = {
  id: string;
  op: string;
  ok: boolean;
  durationMs: number;
  output: Record<string, unknown>;
};

@Injectable()
export class AiOrchestrationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly gateway: GatewayService,
    private readonly translate: TranslateService,
    private readonly chat: ChatService,
    private readonly decisions: DecisionEngineService,
    private readonly contextEngine: ContextEngineService,
  ) {}

  engine() {
    return aiOrchestrationCatalog();
  }

  pipelines() {
    return {
      pipelines: ORCH_PIPELINES.map((p) => ({
        id: p.id,
        name: p.name,
        steps: p.steps,
        status: p.status,
      })),
      related: {
        workflowsApi: '/v1/workflows',
        workflowsConsole: '/workflows',
        note: ' JSON job workflows remain available for transcribe→translate→notify.',
      },
      note: 'Named e2e pipelines for . Multi-cloud deferred.',
    };
  }

  private assertPipeline(raw: string | undefined): OrchPipelineId {
    const id = (raw?.trim() || 'detect_translate') as OrchPipelineId;
    const found = ORCH_PIPELINES.find((p) => p.id === id);
    if (!found) {
      throw new ApiException(
        'validation_error',
        `pipeline must be one of: ${ORCH_PIPELINES.map((p) => p.id).join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    if (found.status === 'deferred') {
      throw new ApiException(
        'validation_error',
        `pipeline=${id} is deferred — not a multi-cloud agent OS`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return id;
  }

  private requireText(text: string | undefined): string {
    const t = text?.trim() ?? '';
    if (!t) {
      throw new ApiException('validation_error', 'text is required', HttpStatus.BAD_REQUEST);
    }
    if ([...t].length > 16_000) {
      throw new ApiException(
        'validation_error',
        'text exceeds maximum of 16000 characters',
        HttpStatus.BAD_REQUEST,
      );
    }
    return t;
  }

  private async runDetect(text: string): Promise<StepResult> {
    const started = Date.now();
    const detected = await this.gateway.detect({ text });
    return {
      id: 'detect',
      op: 'detect',
      ok: true,
      durationMs: Date.now() - started,
      output: {
        language: detected.language,
        confidence: detected.confidence,
        provider: detected.provider,
      },
    };
  }

  private async runTranslate(
    auth: AuthCtx,
    text: string,
    source: string,
    target: string,
  ): Promise<StepResult> {
    const started = Date.now();
    const result = await this.translate.translate({
      text,
      source,
      target,
      organizationId: auth.organizationId,
      workspaceId: auth.workspaceId,
      apiKeyId: auth.apiKeyId,
      userId: auth.userId,
      ip: auth.ip,
      skipReview: true,
    });
    return {
      id: 'translate',
      op: 'translate',
      ok: true,
      durationMs: Date.now() - started,
      output: {
        text: result.text,
        source: result.source,
        target: result.target,
        provider: result.provider,
      },
    };
  }

  private async runChat(auth: AuthCtx, userContent: string, model?: string): Promise<StepResult> {
    const started = Date.now();
    const result = await this.chat.completions({
      messages: [{ role: 'user', content: userContent }],
      model,
      organizationId: auth.organizationId,
      workspaceId: auth.workspaceId,
      apiKeyId: auth.apiKeyId,
      userId: auth.userId,
      ip: auth.ip,
    });
    const content = result.choices[0]?.message?.content ?? '';
    return {
      id: 'chat',
      op: 'chat',
      ok: true,
      durationMs: Date.now() - started,
      output: {
        content,
        model: result.model,
        provider: result.provider,
      },
    };
  }

  private async runDecide(auth: AuthCtx, query: string, kind = 'routing'): Promise<StepResult> {
    const started = Date.now();
    const result = await this.decisions.decide({
      ...auth,
      kind,
      query,
    });
    return {
      id: 'decide',
      op: 'decide',
      ok: true,
      durationMs: Date.now() - started,
      output: {
        kind: result.kind,
        decision: result.decision,
        confidence: result.confidence,
        reasons: result.reasons,
      },
    };
  }

  private async runAssemble(auth: AuthCtx, query: string): Promise<StepResult> {
    const started = Date.now();
    const assembled = await this.contextEngine.assemble({
      organizationId: auth.organizationId,
      workspaceId: auth.workspaceId,
      userId: auth.userId,
      query,
      maxChars: 2000,
      promptKey: 'rag',
      include: { documents: true, memory: true, prompt: true, language: true },
    });
    return {
      id: 'assemble',
      op: 'assemble',
      ok: true,
      durationMs: Date.now() - started,
      output: {
        included: assembled.included,
        promptContext: assembled.promptContext.slice(0, 1500),
        chars: assembled.promptContext.length,
      },
    };
  }

  private parseOps(raw: unknown): OrchToolOp[] {
    if (!Array.isArray(raw) || raw.length === 0) {
      return ['detect', 'translate'];
    }
    if (raw.length > 6) {
      throw new ApiException(
        'validation_error',
        'ops exceeds maximum of 6 steps',
        HttpStatus.BAD_REQUEST,
      );
    }
    const ops: OrchToolOp[] = [];
    for (const item of raw) {
      if (typeof item !== 'string' || !(ORCH_TOOL_OPS as readonly string[]).includes(item)) {
        throw new ApiException(
          'validation_error',
          `ops must be one of: ${ORCH_TOOL_OPS.join(', ')}`,
          HttpStatus.BAD_REQUEST,
        );
      }
      ops.push(item as OrchToolOp);
    }
    return ops;
  }

  async run(
    input: AuthCtx & {
      pipeline?: string;
      text?: string;
      source?: string;
      target?: string;
      ops?: unknown;
      model?: string;
    },
  ) {
    const pipeline = this.assertPipeline(input.pipeline);
    const text = this.requireText(input.text);
    const target = (input.target?.trim() || 'sw').toLowerCase();
    const source = (input.source?.trim() || 'auto').toLowerCase();
    const steps: StepResult[] = [];
    let workingText = text;

    try {
      switch (pipeline) {
        case 'detect_translate': {
          const detected = await this.runDetect(workingText);
          steps.push(detected);
          const src =
            typeof detected.output.language === 'string' ? detected.output.language : source;
          const translated = await this.runTranslate(input, workingText, src, target);
          steps.push(translated);
          workingText = String(translated.output.text ?? workingText);
          break;
        }
        case 'translate_chat': {
          const translated = await this.runTranslate(input, workingText, source, target);
          steps.push(translated);
          workingText = String(translated.output.text ?? workingText);
          const chatted = await this.runChat(
            input,
            `Summarize this translated text briefly:\n${workingText}`,
            input.model,
          );
          steps.push(chatted);
          workingText = String(chatted.output.content ?? workingText);
          break;
        }
        case 'decide_act': {
          const decided = await this.runDecide(input, workingText, 'routing');
          steps.push(decided);
          const route = String(decided.output.decision ?? 'chat');
          if (route === 'translate') {
            const translated = await this.runTranslate(input, workingText, source, target);
            steps.push({ ...translated, id: 'act' });
            workingText = String(translated.output.text ?? workingText);
          } else {
            const chatted = await this.runChat(input, workingText, input.model);
            steps.push({ ...chatted, id: 'act' });
            workingText = String(chatted.output.content ?? workingText);
          }
          break;
        }
        case 'tool_chain': {
          const ops = this.parseOps(input.ops);
          for (const [i, op] of ops.entries()) {
            let step: StepResult;
            if (op === 'detect') step = await this.runDetect(workingText);
            else if (op === 'translate') {
              step = await this.runTranslate(input, workingText, source, target);
              workingText = String(step.output.text ?? workingText);
            } else if (op === 'chat') {
              step = await this.runChat(input, workingText, input.model);
              workingText = String(step.output.content ?? workingText);
            } else step = await this.runDecide(input, workingText, 'routing');
            steps.push({ ...step, id: `${op}_${i + 1}` });
          }
          break;
        }
        case 'model_chain': {
          const draft = await this.runChat(
            input,
            `Draft a short answer:\n${workingText}`,
            input.model,
          );
          steps.push({ ...draft, id: 'draft' });
          const refine = await this.runChat(
            input,
            `Refine this draft to be clearer and shorter:\n${draft.output.content}`,
            input.model,
          );
          steps.push({ ...refine, id: 'refine' });
          workingText = String(refine.output.content ?? workingText);
          break;
        }
        case 'assemble_chat': {
          const assembled = await this.runAssemble(input, workingText);
          steps.push(assembled);
          const prompt = String(assembled.output.promptContext ?? '');
          const chatted = await this.runChat(
            input,
            `${prompt}\n\nUser question: ${workingText}`,
            input.model,
          );
          steps.push(chatted);
          workingText = String(chatted.output.content ?? workingText);
          break;
        }
        case 'multi_cloud':
          throw new ApiException(
            'validation_error',
            'pipeline=multi_cloud is deferred',
            HttpStatus.BAD_REQUEST,
          );
      }
    } catch (err) {
      if (err instanceof ApiException) throw err;
      throw err;
    }

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'ai_orchestration.ran',
      route: 'POST /v1/ai-orchestration/run',
      ip: input.ip,
      metadata: {
        pipeline,
        stepCount: steps.length,
        ok: steps.every((s) => s.ok),
      },
    });

    return {
      pipeline,
      steps,
      result: workingText,
      honesty: {
        multiCloudAgentOs: false,
        langGraphOs: false,
        distributedAiFabric: false,
        loadBearingE2e: true,
        executesRealRequests: true,
      },
      note: 'Load-bearing e2e orchestration via gateway/engines. Not a multi-cloud agent OS.',
    };
  }

  async analytics(organizationId: string, workspaceId: string) {
    const start = new Date();
    start.setUTCDate(1);
    start.setUTCHours(0, 0, 0, 0);
    const runs = await this.prisma.auditEvent.count({
      where: {
        organizationId,
        action: 'ai_orchestration.ran',
        createdAt: { gte: start },
      },
    });
    return {
      periodStart: start.toISOString(),
      runs,
      workspaceId,
      note: 'AI Orchestration analytics.',
    };
  }

  async monitoring(organizationId: string, workspaceId: string) {
    const [analytics, engine] = await Promise.all([
      this.analytics(organizationId, workspaceId),
      Promise.resolve(this.engine()),
    ]);
    return {
      generatedAt: new Date().toISOString(),
      periodStart: analytics.periodStart,
      runs: analytics.runs,
      multiCloudAgentOs: engine.honesty.multiCloudAgentOs,
      deferred: engine.capabilities.filter((c) => c.status === 'deferred').map((c) => c.id),
      note: 'AI Orchestration monitoring snapshot.',
    };
  }
}
