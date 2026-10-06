import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ReasoningCloudService } from '../reasoning-cloud/reasoning-cloud.service';
import { REASONING_TOOL_CATALOG } from '../reasoning-cloud/reasoning-cloud.catalog';
import { AiRouterService } from '../ai-router/ai-router.service';
import { DecisionEngineService } from '../decision-engine/decision-engine.service';
import { MemoryCloudService } from '../memory-cloud/memory-cloud.service';
import { ApiException } from '../common/errors/api-exception';
import {
  reasoningRuntimeCatalog,
  reasoningRuntimeCeilings,
  reasoningRuntimeMode,
} from './reasoning-runtime.catalog';

type AuthCtx = {
  organizationId: string;
  workspaceId: string;
  apiKeyId?: string;
  userId?: string;
  ip?: string;
};

const KERNEL_LAYER = 'kernel';
const RUNTIME = 'reasoning-runtime';

@Injectable()
export class ReasoningRuntimeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly reasoningCloud: ReasoningCloudService,
    private readonly aiRouter: AiRouterService,
    private readonly decisions: DecisionEngineService,
    private readonly memoryCloud: MemoryCloudService,
  ) {}

  engine() {
    return {
      ...reasoningRuntimeCatalog(),
      ceilings: reasoningRuntimeCeilings(),
      mode: reasoningRuntimeMode(),
      strategies: this.reasoningCloud.strategies(),
    };
  }

  async reason(
    input: AuthCtx & {
      problem?: string;
      strategy?: string;
      language?: string;
      model?: string;
      retrieve?: boolean;
      entityId?: string;
      maxChars?: number;
      persist?: boolean;
    },
  ) {
    this.assertEnabled();
    const problem = (input.problem ?? '').trim();
    if (!problem) {
      throw new ApiException('validation_error', 'problem is required', HttpStatus.BAD_REQUEST);
    }

    const result = await this.reasoningCloud.reason({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      apiKeyId: input.apiKeyId,
      userId: input.userId,
      ip: input.ip,
      problem,
      strategy: input.strategy,
      language: input.language,
      model: input.model,
      retrieve: input.retrieve,
      entityId: input.entityId,
      maxChars: input.maxChars,
    });

    const evaluation = this.heuristicEval(problem, result.answer, result.steps);
    const confidence = this.confidenceFromEval(evaluation);

    let historyId: string | null = null;
    if (input.persist !== false) {
      historyId = await this.persistRun(input, {
        kind: 'reason',
        problem,
        strategy: result.strategy,
        answer: result.answer,
        steps: result.steps,
        branches: result.branches,
        selectedTools: result.selectedTools,
        evaluation,
        confidence,
        provider: result.provider,
        model: result.model,
      });
    }

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'reasoning_runtime.reasoned',
      route: 'POST /v1/reasoning-runtime/reason',
      ip: input.ip,
      metadata: { strategy: result.strategy, historyId, confidence: confidence.score },
    });

    return {
      ...result,
      evaluation,
      confidence,
      historyId,
      honesty: {
        ...result.honesty,
        ...reasoningRuntimeCatalog().honesty,
      },
      note: 'Kernel reason over Reasoning Cloud — not a custom reasoner OS.',
    };
  }

  async plan(
    input: AuthCtx & {
      problem?: string;
      language?: string;
      model?: string;
      retrieve?: boolean;
      sandboxOnly?: boolean;
    },
  ) {
    this.assertEnabled();
    const problem = (input.problem ?? '').trim();
    if (!problem) {
      throw new ApiException('validation_error', 'problem is required', HttpStatus.BAD_REQUEST);
    }

    if (input.sandboxOnly) {
      const steps = [
        'Clarify goal and constraints',
        'List required inputs/tools',
        'Propose ordered steps',
        'Identify risks and rollback',
        'Define next action',
      ];
      const answer = [
        ...steps.map((s, i) => `${i + 1}. ${s}`),
        `Next action: draft a plan for: ${problem.slice(0, 120)}`,
      ].join('\n');
      const historyId = await this.persistRun(input, {
        kind: 'plan',
        problem,
        strategy: 'planning',
        answer,
        steps,
        sandboxOnly: true,
      });
      return {
        strategy: 'planning',
        problem,
        steps,
        answer,
        historyId,
        honesty: { sandboxPlanOnly: true, customReasonerKernel: false },
        note: 'Sandbox plan stub — not a planner OS. Set sandboxOnly=false to use Reasoning Cloud.',
      };
    }

    return this.reason({
      ...input,
      problem,
      strategy: 'planning',
      retrieve: input.retrieve ?? false,
    });
  }

  async reflect(
    input: AuthCtx & { problem?: string; answer?: string; historyId?: string },
  ) {
    this.assertEnabled();
    let problem = (input.problem ?? '').trim();
    let answer = (input.answer ?? '').trim();
    if (input.historyId?.trim()) {
      const replay = await this.replay({
        ...input,
        id: input.historyId.trim(),
      });
      problem = problem || String(replay.run.problem ?? '');
      answer = answer || String(replay.run.answer ?? '');
    }
    if (!problem || !answer) {
      throw new ApiException(
        'validation_error',
        'problem and answer (or historyId) are required',
        HttpStatus.BAD_REQUEST,
      );
    }
    const evaluation = this.heuristicEval(problem, answer, this.parseSteps(answer));
    const critiques: string[] = [];
    if (evaluation.score < 0.6) critiques.push('Answer appears thin or incomplete relative to the problem.');
    if (!/answer:|recommendation:|solution:|next action:/i.test(answer)) {
      critiques.push('Missing explicit final Answer/Recommendation/Solution line.');
    }
    if (answer.length > 4000) critiques.push('Answer is long; consider compressing.');
    if (critiques.length === 0) critiques.push('No major heuristic issues detected.');

    const historyId = await this.persistRun(input, {
      kind: 'reflect',
      problem,
      answer,
      evaluation,
      critiques,
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'reasoning_runtime.reflected',
      route: 'POST /v1/reasoning-runtime/reflect',
      ip: input.ip,
      metadata: { historyId, score: evaluation.score },
    });

    return {
      problem,
      answer,
      critiques,
      evaluation,
      historyId,
      honesty: { llmAsJudgeEvalLab: false, heuristicOnly: true },
      note: 'Heuristic reflection — not a reflective agent OS.',
    };
  }

  async selectTools(input: AuthCtx & { problem?: string; model?: string }) {
    this.assertEnabled();
    const problem = (input.problem ?? '').trim();
    if (!problem) {
      throw new ApiException('validation_error', 'problem is required', HttpStatus.BAD_REQUEST);
    }

    // Heuristic catalog pick first (always available); optionally enrich via RC.
    const lowered = problem.toLowerCase();
    const heuristic = REASONING_TOOL_CATALOG.filter((t) => {
      if (t.id === 'translate' && /translat|localize|language/.test(lowered)) return true;
      if (t.id === 'knowledge_query' && /knowledge|rag|document|cite/.test(lowered)) return true;
      if (t.id === 'vector_search' && /vector|embed|similar/.test(lowered)) return true;
      if (t.id === 'memory_search' && /memory|remember|recall/.test(lowered)) return true;
      if (t.id === 'context_assemble' && /context|assemble/.test(lowered)) return true;
      if (t.id === 'tts' && /speech|voice|tts|speak/.test(lowered)) return true;
      if (t.id === 'chat') return true;
      return false;
    }).map((t) => t.id);

    let gatewaySelected: string[] | undefined;
    try {
      const reasoned = await this.reasoningCloud.reason({
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        apiKeyId: input.apiKeyId,
        userId: input.userId,
        ip: input.ip,
        problem,
        strategy: 'tool_selection',
        model: input.model,
        retrieve: false,
      });
      gatewaySelected = reasoned.selectedTools;
    } catch {
      // Gateway unavailable — heuristic only.
    }

    const selectedTools = [...new Set([...(gatewaySelected ?? []), ...heuristic])].slice(0, 6);
    return {
      problem,
      selectedTools,
      catalog: REASONING_TOOL_CATALOG,
      honesty: { toolExecution: false },
      note: 'Tool ids suggested only — Reasoning Runtime does not execute tools (VL-218 / VL-219).',
    };
  }

  async selectModel(
    input: AuthCtx & { problem?: string; feature?: string; optimize?: string },
  ) {
    this.assertEnabled();
    const problem = (input.problem ?? '').trim() || 'general reasoning';
    try {
      const resolved = await this.aiRouter.resolve({
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        userId: input.userId,
        ip: input.ip,
        feature: (input.feature as 'chat') ?? 'chat',
        optimize: (input.optimize as 'balanced') ?? 'balanced',
        dryRun: true,
      });
      return {
        problem,
        selection: {
          provider: resolved.selected?.providerId ?? null,
          model: resolved.selected?.modelSlug ?? null,
          optimize: resolved.optimize,
          feature: resolved.feature,
          decisionId: resolved.decisionId,
        },
        chain: (resolved.chain ?? []).slice(0, 5),
        honesty: { modelMeshOs: false, extendsAiRouter: true },
        note: 'Model selection via AI Router resolve — not a model mesh OS.',
      };
    } catch {
      return {
        problem,
        selection: {
          provider: 'gateway',
          model: 'sandbox-default',
          optimize: input.optimize ?? 'balanced',
          feature: input.feature ?? 'chat',
          decisionId: null,
        },
        chain: [],
        honesty: { modelMeshOs: false, extendsAiRouter: true, sandboxFallback: true },
        note: 'Sandbox model selection fallback (AI Router unavailable or spend-gated).',
      };
    }
  }

  async decisionTree(
    input: AuthCtx & { problem?: string; kind?: string },
  ) {
    this.assertEnabled();
    const problem = (input.problem ?? '').trim();
    if (!problem) {
      throw new ApiException('validation_error', 'problem is required', HttpStatus.BAD_REQUEST);
    }
    const kind = (input.kind ?? 'routing').trim();
    const decided = await this.decisions.decide({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      userId: input.userId,
      ip: input.ip,
      kind,
      query: problem,
    });

    const tree = {
      root: 'classify',
      nodes: [
        {
          id: 'classify',
          question: `What decision kind fits: ${kind}?`,
          branch: kind,
          next: 'score',
        },
        {
          id: 'score',
          question: 'Score alternatives',
          alternatives: decided.alternatives,
          next: 'decide',
        },
        {
          id: 'decide',
          question: 'Emit decision',
          decision: decided.decision,
          confidence: decided.confidence,
        },
      ],
    };

    return {
      problem,
      kind,
      decision: decided.decision,
      confidence: decided.confidence,
      reasons: decided.reasons,
      tree,
      honesty: { droolsPegaBrms: false, extendsDecisionEngine: true },
      note: 'Sandbox decision tree over Decision Engine — not enterprise BRMS OS.',
    };
  }

  async evaluate(
    input: AuthCtx & { problem?: string; answer?: string; historyId?: string },
  ) {
    this.assertEnabled();
    let problem = (input.problem ?? '').trim();
    let answer = (input.answer ?? '').trim();
    if (input.historyId?.trim()) {
      const replay = await this.replay({ ...input, id: input.historyId.trim() });
      problem = problem || String(replay.run.problem ?? '');
      answer = answer || String(replay.run.answer ?? '');
    }
    if (!problem || !answer) {
      throw new ApiException(
        'validation_error',
        'problem and answer (or historyId) are required',
        HttpStatus.BAD_REQUEST,
      );
    }
    const evaluation = this.heuristicEval(problem, answer, this.parseSteps(answer));
    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'reasoning_runtime.evaluated',
      route: 'POST /v1/reasoning-runtime/evaluate',
      ip: input.ip,
      metadata: { score: evaluation.score },
    });
    return {
      problem,
      answer,
      evaluation,
      honesty: { llmAsJudgeEvalLab: false, heuristicOnly: true },
      note: 'Heuristic self-evaluation — not an LLM-as-judge lab.',
    };
  }

  async confidence(
    input: AuthCtx & { problem?: string; answer?: string; historyId?: string },
  ) {
    this.assertEnabled();
    const evaluation = await this.evaluate(input);
    const decided = await this.decisions.decide({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      userId: input.userId,
      ip: input.ip,
      kind: 'confidence',
      query: input.problem ?? evaluation.problem,
      signalStrength: evaluation.evaluation.score,
      matched: evaluation.evaluation.score >= 0.55,
    });
    const blended = Number(
      (
        evaluation.evaluation.score * 0.7 +
        Math.max(0, Math.min(1, decided.confidence)) * 0.3
      ).toFixed(2),
    );
    return {
      problem: evaluation.problem,
      score: blended,
      evaluation: evaluation.evaluation,
      decisionConfidence: decided.confidence,
      honesty: { calibratedConfidenceOs: false },
      note: 'Blended heuristic confidence — not a calibrated uncertainty OS.',
    };
  }

  async history(input: AuthCtx & { limit?: number }) {
    this.assertEnabled();
    const take = Math.min(
      reasoningRuntimeCeilings().maxHistoryPerWorkspace,
      Math.max(1, input.limit ?? 20),
    );
    const rows = await this.prisma.memoryRecord.findMany({
      where: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        deletedAt: null,
        metadata: { path: ['runtime'], equals: RUNTIME },
      },
      orderBy: { createdAt: 'desc' },
      take,
    });
    return {
      runs: rows.map((r) => this.serializeHistory(r)),
      note: 'Reasoning Runtime history (kernel MemoryRecords).',
    };
  }

  async replay(input: AuthCtx & { id?: string }) {
    this.assertEnabled();
    const id = (input.id ?? '').trim();
    if (!id) {
      throw new ApiException('validation_error', 'id is required', HttpStatus.BAD_REQUEST);
    }
    const row = await this.prisma.memoryRecord.findFirst({
      where: {
        id,
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        deletedAt: null,
      },
    });
    const meta = this.metaOf(row);
    if (!row || meta.runtime !== RUNTIME) {
      throw new ApiException('not_found', 'Reasoning run not found', HttpStatus.NOT_FOUND);
    }
    let run: Record<string, unknown> = {};
    try {
      run = JSON.parse(row.content) as Record<string, unknown>;
    } catch {
      run = { answer: row.content };
    }
    return {
      id: row.id,
      run,
      createdAt: row.createdAt.toISOString(),
      honesty: { distributedReplayOs: false },
      note: 'Sandbox replay of stored payload — not a distributed replay OS.',
    };
  }

  async analytics(input: AuthCtx) {
    this.assertEnabled();
    const start = new Date();
    start.setUTCDate(1);
    start.setUTCHours(0, 0, 0, 0);
    const actions = [
      'reasoning_runtime.reasoned',
      'reasoning_runtime.reflected',
      'reasoning_runtime.evaluated',
    ] as const;
    const counts = await Promise.all(
      actions.map(async (action) => ({
        action,
        count: await this.prisma.auditEvent.count({
          where: {
            organizationId: input.organizationId,
            action,
            createdAt: { gte: start },
          },
        }),
      })),
    );
    const historyCount = await this.prisma.memoryRecord.count({
      where: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        deletedAt: null,
        metadata: { path: ['runtime'], equals: RUNTIME },
      },
    });
    return {
      periodStart: start.toISOString(),
      workspaceId: input.workspaceId,
      events: counts.reduce((s, c) => s + c.count, 0),
      byAction: Object.fromEntries(counts.map((c) => [c.action, c.count])),
      historyCount,
      honesty: reasoningRuntimeCatalog().honesty,
      note: 'Reasoning Runtime analytics (VL-218).',
    };
  }

  async monitoring(input: AuthCtx) {
    const [engine, analytics] = await Promise.all([
      Promise.resolve(this.engine()),
      this.analytics(input),
    ]);
    return {
      mode: engine.mode,
      ceilings: engine.ceilings,
      analytics,
      honesty: engine.honesty,
      safety: {
        agentActionBoundariesRequired: true,
        toolExecutionForbiddenHere: true,
        note: 'Reasoning Runtime must not execute tools; Agent Runtime (VL-219) requires sandbox + scoped permissions.',
      },
    };
  }

  private assertEnabled() {
    if (reasoningRuntimeMode() === 'disabled') {
      throw new ApiException(
        'reasoning_runtime_disabled',
        'Reasoning Runtime mode is disabled (LUGEMI_REASONING_RUNTIME_MODE=disabled).',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  private parseSteps(content: string): string[] {
    const lines = content
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    const numbered = lines.filter((l) => /^\d+[\).\]]\s+/.test(l));
    if (numbered.length > 0) return numbered.map((l) => l.replace(/^\d+[\).\]]\s+/, ''));
    return lines.slice(0, 8);
  }

  private heuristicEval(problem: string, answer: string, steps: string[]) {
    const findings: Array<{ id: string; severity: string; message: string }> = [];
    let score = 1;
    if (!answer.trim()) {
      findings.push({ id: 'empty', severity: 'error', message: 'Empty answer' });
      score -= 0.8;
    }
    if (answer.trim().length < 40) {
      findings.push({ id: 'short', severity: 'warn', message: 'Answer is very short' });
      score -= 0.15;
    }
    if (steps.length < 2) {
      findings.push({ id: 'few-steps', severity: 'warn', message: 'Fewer than 2 reasoning steps' });
      score -= 0.12;
    }
    const problemTokens = problem
      .toLowerCase()
      .split(/\W+/)
      .filter((t) => t.length > 3)
      .slice(0, 8);
    const hits = problemTokens.filter((t) => answer.toLowerCase().includes(t)).length;
    const coverage = problemTokens.length ? hits / problemTokens.length : 0.5;
    if (coverage < 0.25) {
      findings.push({
        id: 'low-coverage',
        severity: 'warn',
        message: 'Answer covers few problem tokens',
      });
      score -= 0.15;
    }
    score = Math.max(0, Math.min(1, Number(score.toFixed(2))));
    return { score, coverage: Number(coverage.toFixed(2)), findings, stepCount: steps.length };
  }

  private confidenceFromEval(evaluation: { score: number; coverage: number }) {
    const score = Number(
      Math.max(0, Math.min(1, evaluation.score * 0.75 + evaluation.coverage * 0.25)).toFixed(2),
    );
    return {
      score,
      label: score >= 0.75 ? 'high' : score >= 0.45 ? 'medium' : 'low',
    };
  }

  private async persistRun(input: AuthCtx, payload: Record<string, unknown>) {
    const ceilings = reasoningRuntimeCeilings();
    const active = await this.prisma.memoryRecord.count({
      where: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        deletedAt: null,
        metadata: { path: ['runtime'], equals: RUNTIME },
      },
    });
    if (active >= ceilings.maxHistoryPerWorkspace) {
      const oldest = await this.prisma.memoryRecord.findMany({
        where: {
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
          deletedAt: null,
          metadata: { path: ['runtime'], equals: RUNTIME },
        },
        orderBy: { createdAt: 'asc' },
        take: active - ceilings.maxHistoryPerWorkspace + 1,
        select: { id: true },
      });
      if (oldest.length) {
        await this.prisma.memoryRecord.updateMany({
          where: { id: { in: oldest.map((o) => o.id) } },
          data: { deletedAt: new Date() },
        });
      }
    }

    const created = await this.memoryCloud.create({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      userId: input.userId,
      ip: input.ip,
      scope: 'workspace',
      kind: 'long_term',
      key: `reasoning:${Date.now()}`,
      content: JSON.stringify({ ...payload, storedAt: new Date().toISOString() }),
      metadata: {
        layer: KERNEL_LAYER,
        runtime: RUNTIME,
        reasoningRun: true,
        kind: payload.kind ?? 'reason',
      },
    });
    return created.id as string;
  }

  private metaOf(row: { metadata: Prisma.JsonValue } | null): Record<string, unknown> {
    if (!row?.metadata || typeof row.metadata !== 'object' || Array.isArray(row.metadata)) {
      return {};
    }
    return row.metadata as Record<string, unknown>;
  }

  private serializeHistory(row: {
    id: string;
    content: string;
    metadata: Prisma.JsonValue;
    createdAt: Date;
    key: string | null;
  }) {
    const meta = this.metaOf(row);
    let summary = row.content.slice(0, 120);
    try {
      const parsed = JSON.parse(row.content) as { problem?: string; kind?: string };
      summary = `${parsed.kind ?? meta.kind ?? 'run'}: ${(parsed.problem ?? '').slice(0, 80)}`;
    } catch {
      // keep slice
    }
    return {
      id: row.id,
      key: row.key,
      kind: meta.kind ?? 'reason',
      summary,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
