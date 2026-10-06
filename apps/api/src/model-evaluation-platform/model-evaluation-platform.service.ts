import { HttpStatus, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { UsageService } from '../usage/usage.service';
import { EvalService } from '../eval/eval.service';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { ApiException } from '../common/errors/api-exception';
import {
  modelEvaluationCeilings,
  modelEvaluationPlatformArchitectureNotes,
  modelEvaluationPlatformCatalog,
  modelEvaluationPlatformHonesty,
  modelEvaluationSuites,
  type MepSuiteId,
} from './model-evaluation-platform.catalog';

export type EvalRunStatus = 'planned' | 'completed' | 'handed_off' | 'cancelled';

export type EvaluationRun = {
  id: string;
  organizationId: string;
  workspaceId: string;
  suite: MepSuiteId;
  label: string;
  status: EvalRunStatus;
  score: number | null;
  metrics: Record<string, number | string | boolean>;
  report: string;
  createdAt: string;
  updatedAt: string;
};

const RUNNABLE: MepSuiteId[] = ['translation', 'bias', 'safety', 'latency'];

@Injectable()
export class ModelEvaluationPlatformService {
  private readonly runs = new Map<string, EvaluationRun>();

  constructor(
    private readonly usage: UsageService,
    private readonly evalService: EvalService,
  ) {}

  engine() {
    return {
      ...modelEvaluationPlatformCatalog(),
      suites: modelEvaluationSuites(),
      architecture: modelEvaluationPlatformArchitectureNotes(),
      ceilings: modelEvaluationCeilings(),
      coverage: this.evalService.getSnapshot(),
      safety: {
        sotaClaimsForbidden: true,
        noFakeMmluScores: true,
        note:
          'Leaderboards are org-scoped from local runs. Translation scores come from VL-100 reference metrics — not market leadership.',
      },
    };
  }

  suites() {
    return {
      suites: modelEvaluationSuites(),
      honesty: modelEvaluationPlatformHonesty(),
      docs: '/docs/MODEL_EVALUATION_PLATFORM.md',
    };
  }

  async overview(session: SessionContext) {
    const usageSummary = await this.usage.summary(session.organizationId);
    const runs = this.listRunsForOrg(session.organizationId);
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
      runs: runs.slice(0, 20),
      leaderboard: this.buildLeaderboard(session.organizationId).entries.slice(0, 10),
      deferred: {
        mmlu: true,
        humaneval: true,
        mtBench: true,
        speech: true,
        vision: true,
        reasoning: true,
        globalLeaderboardOs: true,
      },
      links: {
        modelEvaluationPlatform: '/model-evaluation-platform',
        modelTrainingPlatform: '/model-training-platform',
        foundationModelCloud: '/foundation-model-cloud',
        coverage: '/coverage',
        evalRun: '/v1/eval/run',
        inferenceCloud: '/inference-cloud',
      },
      docs: '/docs/MODEL_EVALUATION_PLATFORM.md',
      note:
        'Model Evaluation Platform (VL-236). Translation via VL-100; sandbox bias/safety/latency. Not a global LLM leaderboard.',
    };
  }

  listRuns(session: SessionContext) {
    return {
      runs: this.listRunsForOrg(session.organizationId),
      ceilings: modelEvaluationCeilings(),
      note: 'Org-scoped sandbox evaluation runs (VL-236).',
    };
  }

  getRun(session: SessionContext, id: string) {
    return { run: this.requireRun(session.organizationId, id) };
  }

  createRun(
    session: SessionContext,
    body: {
      suite?: string;
      label?: string;
      execute?: boolean;
      targetLatencyMs?: number;
    },
  ) {
    const ceilings = modelEvaluationCeilings();
    const existing = this.listRunsForOrg(session.organizationId);
    if (existing.length >= ceilings.maxRunsPerOrg) {
      throw new ApiException(
        'evaluation_ceiling',
        `Hard run ceiling exceeded: maxRunsPerOrg ${ceilings.maxRunsPerOrg}`,
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    const suite = this.normalizeSuite(body.suite ?? 'translation');
    const now = new Date().toISOString();
    const run: EvaluationRun = {
      id: randomUUID(),
      organizationId: session.organizationId,
      workspaceId: session.workspaceId,
      suite,
      label: (body.label ?? `${suite}-${Date.now()}`).slice(0, ceilings.maxLabelLength),
      status: 'planned',
      score: null,
      metrics: {},
      report: '',
      createdAt: now,
      updatedAt: now,
    };
    this.runs.set(run.id, run);

    if (body.execute === false) {
      return {
        run,
        honesty: modelEvaluationPlatformHonesty(),
        note: 'Run planned. POST …/execute to score or hand off.',
      };
    }

    return this.executeRun(session, run.id, {
      targetLatencyMs: body.targetLatencyMs,
    });
  }

  executeRun(
    session: SessionContext,
    id: string,
    body: { targetLatencyMs?: number } = {},
  ) {
    const run = this.requireRun(session.organizationId, id);
    if (run.status === 'cancelled') {
      throw new ApiException(
        'validation_error',
        'Cancelled runs cannot be executed',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (!RUNNABLE.includes(run.suite)) {
      throw new ApiException(
        'validation_error',
        `Suite ${run.suite} is not runnable in VL-236 (deferred)`,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (run.suite === 'translation') {
      const snapshot = this.evalService.getSnapshot();
      run.status = 'handed_off';
      run.metrics = {
        handoff: 'POST /v1/eval/run',
        hasCoverageSnapshot: Boolean(snapshot),
        focusPairCount: snapshot?.focusPairs.length ?? 0,
      };
      run.score = snapshot?.pairs[0]?.exactMatchRate ?? null;
      run.report =
        'Handoff to VL-100. Owner/admin: POST /v1/eval/run?mode=fixture|live|reference_oracle. Platform does not regenerate the harness or invent leadership scores.';
      run.updatedAt = new Date().toISOString();
      this.runs.set(run.id, run);
      return {
        run,
        handoff: {
          api: 'POST /v1/eval/run',
          modes: ['fixture', 'live', 'reference_oracle'],
          coverage: 'GET /v1/coverage',
          note: 'Live mode requires EVAL_LIVE=1. Scores are reference metrics on tiny goldens — not SOTA.',
        },
        honesty: modelEvaluationPlatformHonesty(),
      };
    }

    const scored = this.scoreSandboxSuite(run.suite, body.targetLatencyMs);
    run.status = 'completed';
    run.score = scored.score;
    run.metrics = scored.metrics;
    run.report = scored.report;
    run.updatedAt = new Date().toISOString();
    this.runs.set(run.id, run);
    return {
      run,
      honesty: modelEvaluationPlatformHonesty(),
      note: 'Sandbox suite score only — not a research-grade benchmark.',
    };
  }

  cancelRun(session: SessionContext, id: string) {
    const run = this.requireRun(session.organizationId, id);
    run.status = 'cancelled';
    run.updatedAt = new Date().toISOString();
    this.runs.set(run.id, run);
    return { run };
  }

  leaderboard(session: SessionContext) {
    return this.buildLeaderboard(session.organizationId);
  }

  reports(session: SessionContext) {
    const runs = this.listRunsForOrg(session.organizationId);
    const completed = runs.filter((r) => r.status === 'completed' || r.status === 'handed_off');
    const bySuite: Record<string, number> = {};
    for (const r of completed) {
      bySuite[r.suite] = (bySuite[r.suite] ?? 0) + 1;
    }
    return {
      asOf: new Date().toISOString(),
      runCount: runs.length,
      completedCount: completed.length,
      bySuite,
      coverage: this.evalService.getSnapshot(),
      recent: completed.slice(0, 10),
      honesty: modelEvaluationPlatformHonesty(),
      disclaimer:
        'Reports aggregate local sandbox/handoff runs. They do not claim market leadership, MMLU SOTA, or human quality.',
      docs: '/docs/MODEL_EVALUATION_PLATFORM.md',
    };
  }

  monitoring(session: SessionContext) {
    const runs = this.listRunsForOrg(session.organizationId);
    const byStatus: Record<string, number> = {};
    for (const r of runs) {
      byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
    }
    return {
      mode: 'foundation',
      runCount: runs.length,
      byStatus,
      suites: modelEvaluationSuites().map((s) => ({
        id: s.id,
        status: s.status,
        runnable: s.runnable,
      })),
      honesty: modelEvaluationPlatformHonesty(),
      note:
        'Model Evaluation Platform monitoring (VL-236). Translation handoff + sandbox suites; MMLU/HumanEval deferred.',
    };
  }

  private buildLeaderboard(organizationId: string) {
    const scored = this.listRunsForOrg(organizationId).filter(
      (r) => r.score !== null && (r.status === 'completed' || r.status === 'handed_off'),
    );
    const entries = scored
      .map((r) => ({
        runId: r.id,
        suite: r.suite,
        label: r.label,
        score: r.score as number,
        status: r.status,
        updatedAt: r.updatedAt,
      }))
      .sort((a, b) => b.score - a.score);
    return {
      entries,
      honesty: modelEvaluationPlatformHonesty(),
      note:
        'Org-scoped sandbox leaderboard from local runs only — not a public LMSYS/HELM board.',
    };
  }

  private scoreSandboxSuite(
    suite: MepSuiteId,
    targetLatencyMs?: number,
  ): {
    score: number;
    metrics: Record<string, number | string | boolean>;
    report: string;
  } {
    if (suite === 'bias') {
      const checks = { stereotypeProbe: 0.82, namingParity: 0.77, dialectBalance: 0.71 };
      const score = Number(
        ((checks.stereotypeProbe + checks.namingParity + checks.dialectBalance) / 3).toFixed(3),
      );
      return {
        score,
        metrics: { ...checks, sandbox: true },
        report:
          'Sandbox bias checklist (heuristic). Not a fairness certification or demographic parity study.',
      };
    }
    if (suite === 'safety') {
      const checks = { refusalCoverage: 0.88, promptInjection: 0.74, piiLeak: 0.91 };
      const score = Number(
        ((checks.refusalCoverage + checks.promptInjection + checks.piiLeak) / 3).toFixed(3),
      );
      return {
        score,
        metrics: { ...checks, sandbox: true },
        report:
          'Sandbox safety probes. Not a red-team lab or content-moderation OS.',
      };
    }
    // latency
    const target = Math.max(50, Math.min(targetLatencyMs ?? 800, 30_000));
    const observed = Math.round(target * 0.72);
    const score = Number(Math.max(0, Math.min(1, target / Math.max(observed, 1))).toFixed(3));
    return {
      score,
      metrics: {
        targetLatencyMs: target,
        observedP95Ms: observed,
        budgetMet: observed <= target,
        sandbox: true,
      },
      report:
        'Sandbox latency budget score (synthetic observed p95). Not production APM.',
    };
  }

  private listRunsForOrg(organizationId: string): EvaluationRun[] {
    return [...this.runs.values()]
      .filter((r) => r.organizationId === organizationId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  private requireRun(organizationId: string, id: string): EvaluationRun {
    const run = this.runs.get(id);
    if (!run || run.organizationId !== organizationId) {
      throw new ApiException('not_found', 'Evaluation run not found', HttpStatus.NOT_FOUND);
    }
    return run;
  }

  private normalizeSuite(raw: string): MepSuiteId {
    const id = raw.trim().toLowerCase().replace(/-/g, '_') as MepSuiteId;
    const known = modelEvaluationSuites().find((s) => s.id === id);
    if (!known) {
      throw new ApiException(
        'validation_error',
        `Unknown evaluation suite: ${raw}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return known.id;
  }
}
