import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { BillingService } from '../billing/billing.service';
import { ApiException } from '../common/errors/api-exception';
import {
  DECISION_KINDS,
  DECISION_MODELS,
  DECISION_ROUTES,
  DECISION_TOOLS,
  DECISION_WORKFLOWS,
  DecisionKind,
  decisionEngineCatalog,
} from './decision-engine.catalog';

type AuthCtx = {
  organizationId: string;
  workspaceId: string;
  apiKeyId?: string;
  userId?: string;
  ip?: string;
};

type DecisionResult = {
  kind: DecisionKind;
  decision: string;
  confidence: number;
  reasons: string[];
  alternatives: Array<{ id: string; score: number; note: string }>;
  metadata: Record<string, unknown>;
};

@Injectable
export class DecisionEngineService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly billing: BillingService,
  ) {}

  engine {
    return decisionEngineCatalog;
  }

  kinds {
    return {
      kinds: DECISION_KINDS.map((id) => ({ id })),
      deferred: ['enterprise_brms'],
      note: 'Decision kinds for light rules helpers.',
    };
  }

  private assertKind(raw: string | undefined): DecisionKind {
    const kind = (raw?.trim || 'routing') as DecisionKind;
    if (!(DECISION_KINDS as readonly string[]).includes(kind)) {
      if (kind === ('enterprise_brms' as DecisionKind)) {
        throw new ApiException(
          'validation_error',
          'kind=enterprise_brms is deferred — not Drools/Pega BRMS',
          HttpStatus.BAD_REQUEST,
        );
      }
      throw new ApiException(
        'validation_error',
        `kind must be one of: ${DECISION_KINDS.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return kind;
  }

  private textScore(query: string, ...parts: Array<string | null | undefined>): number {
    const q = query.trim.toLowerCase;
    if (!q) return 0.35;
    const hay = parts.filter(Boolean).join(' ').toLowerCase;
    if (!hay) return 0;
    let score = 0;
    if (hay.includes(q)) score += 0.55;
    const tokens = q.split(/\s+/).filter((t) => t.length > 1);
    let hits = 0;
    for (const t of tokens) {
      if (hay.includes(t)) hits += 1;
    }
    if (tokens.length) score += 0.45 * (hits / tokens.length);
    return Math.min(1, score);
  }

  private async orgContext(organizationId: string) {
    const [org, billing] = await Promise.all([
      this.prisma.organization.findUnique({
        where: { id: organizationId },
        select: {
          plan: true,
          disabledAt: true,
          allowVendorTraining: true,
          retentionDays: true,
          persistSourceText: true,
          characterQuota: true,
        },
      }),
      this.billing.getSummary(organizationId),
    ]);
    return {
      plan: org?.plan ?? 'free',
      isPro: (org?.plan ?? 'free') === 'pro',
      disabled: Boolean(org?.disabledAt),
      allowVendorTraining: org?.allowVendorTraining ?? false,
      retentionDays: org?.retentionDays ?? 30,
      persistSourceText: org?.persistSourceText ?? false,
      characterQuota: billing.characterQuota,
      charactersRemaining: billing.charactersRemaining,
      charactersUsed: billing.charactersUsed,
    };
  }

  private decideModelSelection(input: {
    query?: string;
    family?: string;
    quality?: string;
    isPro: boolean;
  }): DecisionResult {
    const family = (input.family?.trim || 'chat').toLowerCase;
    const quality = (input.quality?.trim || 'good').toLowerCase;
    const preferEconomy = quality === 'economy' || quality === 'low';
    const scored = DECISION_MODELS.filter((m) => m.family === family || !input.family)
      .map((m) => {
        let score = this.textScore(input.query ?? '', m.id, m.family, m.costTier, m.quality);
        if (m.family === family) score += 0.35;
        if (preferEconomy && m.costTier === 'economy') score += 0.25;
        if (!preferEconomy && m.quality === 'high') score += 0.2;
        if (m.requiresPro && !input.isPro) score -= 0.5;
        return { m, score: Math.max(0, Math.min(1, score)) };
      })
      .sort((a, b) => b.score - a.score);
    const top = scored[0];
    if (!top || (top.m.requiresPro && !input.isPro && scored.every((s) => s.m.requiresPro))) {
      const fallback = DECISION_MODELS.find((m) => m.family === family && !m.requiresPro);
      return {
        kind: 'model_selection',
        decision: fallback?.id ?? 'gpt-4o-mini',
        confidence: 0.55,
        reasons: ['No eligible model for plan; using free-tier default'],
        alternatives: [],
        metadata: { family, planGated: true },
      };
    }
    const pick =
      top.m.requiresPro && !input.isPro
        ? scored.find((s) => !s.m.requiresPro) ?? top
        : top;
    return {
      kind: 'model_selection',
      decision: pick.m.id,
      confidence: pick.score,
      reasons: [
        `Selected ${pick.m.id} for family=${pick.m.family}`,
        pick.m.requiresPro ? 'Pro plan eligible' : 'Available on free plan',
        `costTier=${pick.m.costTier}`,
      ],
      alternatives: scored.slice(1, 4).map((s) => ({
        id: s.m.id,
        score: s.score,
        note: s.m.costTier,
      })),
      metadata: { family, quality, requiresPro: pick.m.requiresPro },
    };
  }

  private decideRouting(query?: string): DecisionResult {
    const q = query?.trim || 'chat';
    const scored = DECISION_ROUTES.map((r) => ({
      r,
      score: this.textScore(q, r.id, ...r.intentTags),
    })).sort((a, b) => b.score - a.score);
    const top = scored[0]!;
    return {
      kind: 'routing',
      decision: top.r.id,
      confidence: top.score,
      reasons: [`Intent matched route ${top.r.id}`, `API ${top.r.api}`],
      alternatives: scored.slice(1, 4).map((s) => ({
        id: s.r.id,
        score: s.score,
        note: s.r.api,
      })),
      metadata: { api: top.r.api, console: top.r.console },
    };
  }

  private decideFallback(query?: string): DecisionResult {
    const route = this.decideRouting(query);
    const chains: Record<string, string[]> = {
      translate: ['google_translate', 'detect_then_retry', 'manual_review'],
      chat: ['primary_chat', 'economy_chat', 'rag_then_chat'],
      rag: ['vector_search', 'filename_rank', 'chat_without_rag'],
      tts: ['tts-1', 'openai_stock_voice', 'plain_text_fallback'],
      embed: ['text-embedding-3-small', 'hash_stub_dev'],
      reason: ['chain_of_thought', 'chat_direct'],
    };
    const chain = chains[route.decision] ?? ['primary', 'secondary', 'manual_review'];
    return {
      kind: 'fallback',
      decision: chain[0]!,
      confidence: 0.7,
      reasons: [`Fallback chain for route=${route.decision}`, ...chain.map((c, i) => `${i + 1}. ${c}`)],
      alternatives: chain.slice(1).map((id, i) => ({
        id,
        score: Math.max(0.2, 0.6 - i * 0.15),
        note: 'fallback step',
      })),
      metadata: { route: route.decision, chain },
    };
  }

  private decideConfidence(input: {
    query?: string;
    signalStrength?: number;
    matched?: boolean;
  }): DecisionResult {
    const base = input.matched === false ? 0.25 : 0.55;
    const signal =
      typeof input.signalStrength === 'number'
        ? Math.max(0, Math.min(1, input.signalStrength))
        : this.textScore(input.query ?? 'ok', 'ok', 'confident', 'clear');
    const confidence = Number(Math.min(1, base + signal * 0.45).toFixed(2));
    return {
      kind: 'confidence',
      decision: confidence >= 0.7 ? 'high' : confidence >= 0.4 ? 'medium' : 'low',
      confidence,
      reasons: [
        `Heuristic confidence=${confidence}`,
        'Not a calibrated ML probability',
      ],
      alternatives: [],
      metadata: { signal, matched: input.matched ?? null },
    };
  }

  private decideRisk(input: {
    query?: string;
    charactersRemaining: number;
    disabled: boolean;
  }): DecisionResult {
    const text = input.query ?? '';
    const flags: string[] = [];
    if (input.disabled) flags.push('org_disabled');
    if (input.charactersRemaining <= 0) flags.push('quota_exhausted');
    if (/\b[\w.+-]+@[\w.-]+\.\w+\b/.test(text)) flags.push('email_like');
    if (/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/.test(text)) flags.push('phone_like');
    if (/ignore\s+(all\s+)?(previous|prior)\s+instructions/i.test(text)) {
      flags.push('injection_phrase');
    }
    if (/sk-[A-Za-z0-9]{20,}/.test(text)) flags.push('secret_like');
    const level =
      flags.includes('org_disabled') || flags.includes('secret_like')
        ? 'high'
        : flags.length >= 2
          ? 'medium'
          : flags.length === 1
            ? 'low'
            : 'none';
    return {
      kind: 'risk',
      decision: level,
      confidence: flags.length ? 0.75 : 0.6,
      reasons: flags.length ? flags.map((f) => `flag:${f}`) : ['No light risk flags'],
      alternatives: [],
      metadata: { flags },
    };
  }

  private decidePolicy(org: Awaited<ReturnType<DecisionEngineService['orgContext']>>): DecisionResult {
    const allow = !org.disabled && org.charactersRemaining > 0;
    const reasons = [
      `plan=${org.plan}`,
      `vendorTraining=${org.allowVendorTraining}`,
      `retentionDays=${org.retentionDays}`,
      `persistSourceText=${org.persistSourceText}`,
      `charactersRemaining=${org.charactersRemaining}`,
    ];
    if (org.disabled) reasons.unshift('Organization disabled');
    if (org.charactersRemaining <= 0) reasons.unshift('Character quota exhausted');
    return {
      kind: 'policy',
      decision: allow ? 'allow' : 'deny',
      confidence: 0.9,
      reasons,
      alternatives: allow
        ? [{ id: 'deny', score: 0.1, note: 'Would deny if quota/disabled' }]
        : [{ id: 'allow', score: 0.1, note: 'Blocked by policy signals' }],
      metadata: {
        plan: org.plan,
        allowVendorTraining: org.allowVendorTraining,
        retentionDays: org.retentionDays,
      },
    };
  }

  private decideSafety(query?: string): DecisionResult {
    const text = query ?? '';
    const hits: string[] = [];
    if (/ignore\s+(all\s+)?(previous|prior)\s+instructions/i.test(text)) {
      hits.push('prompt_injection');
    }
    if (/you\s+are\s+now\s+(dan|jailbroken)/i.test(text)) hits.push('jailbreak');
    if (/sk-[A-Za-z0-9]{20,}/.test(text)) hits.push('api_key_leak');
    if (/\b(kill|bomb|weaponize)\b/i.test(text)) hits.push('violence_keyword');
    const decision = hits.length ? 'block' : 'allow';
    return {
      kind: 'safety',
      decision,
      confidence: hits.length ? 0.8 : 0.65,
      reasons: hits.length ? hits.map((h) => `safety:${h}`) : ['No pattern safety hits'],
      alternatives: [],
      metadata: { hits, moderationOs: false },
    };
  }

  private decideTools(query?: string): DecisionResult {
    const q = query ?? '';
    const scored = DECISION_TOOLS.map((t) => ({
      t,
      score: this.textScore(q, t.id, t.name, ...t.tags),
    })).sort((a, b) => b.score - a.score);
    const top = scored[0]!;
    return {
      kind: 'tool_selection',
      decision: top.t.id,
      confidence: top.score,
      reasons: [`Suggest tool ${top.t.id}`, `API ${top.t.api}`, 'Does not execute tools'],
      alternatives: scored.slice(1, 4).map((s) => ({
        id: s.t.id,
        score: s.score,
        note: s.t.api,
      })),
      metadata: { api: top.t.api, executesTools: false },
    };
  }

  private decideWorkflow(query?: string): DecisionResult {
    const q = query ?? '';
    const scored = DECISION_WORKFLOWS.map((w) => ({
      w,
      score: this.textScore(q, w.id, w.name, ...w.tags),
    })).sort((a, b) => b.score - a.score);
    const top = scored[0]!;
    return {
      kind: 'workflow',
      decision: top.w.id,
      confidence: top.score,
      reasons: [`Workflow ${top.w.name}`, ...top.w.apis.map((a) => `step:${a}`)],
      alternatives: scored.slice(1, 3).map((s) => ({
        id: s.w.id,
        score: s.score,
        note: s.w.name,
      })),
      metadata: { apis: top.w.apis },
    };
  }

  private decideCost(input: { query?: string; family?: string; isPro: boolean }): DecisionResult {
    const family = (input.family?.trim || 'chat').toLowerCase;
    const economy = DECISION_MODELS.find((m) => m.family === family && m.costTier === 'economy');
    const premium = DECISION_MODELS.find((m) => m.family === family && m.costTier === 'standard');
    const pick =
      economy && (!premium || !input.isPro || /cheap|cost|economy|budget/i.test(input.query ?? ''))
        ? economy
        : premium ?? economy;
    return {
      kind: 'cost',
      decision: pick?.id ?? 'gpt-4o-mini',
      confidence: 0.72,
      reasons: [
        `Cost-aware pick for family=${family}`,
        pick?.costTier === 'economy' ? 'Prefer economy tier' : 'Standard tier available on Pro',
      ],
      alternatives: premium && pick?.id !== premium.id
        ? [{ id: premium.id, score: 0.5, note: 'higher cost / quality' }]
        : [],
      metadata: { family, costTier: pick?.costTier ?? 'economy' },
    };
  }

  async decide(
    input: AuthCtx & {
      kind?: string;
      query?: string;
      family?: string;
      quality?: string;
      signalStrength?: number;
      matched?: boolean;
    },
  ) {
    const kind = this.assertKind(input.kind);
    const org = await this.orgContext(input.organizationId);

    let result: DecisionResult;
    switch (kind) {
      case 'model_selection':
        result = this.decideModelSelection({
          query: input.query,
          family: input.family,
          quality: input.quality,
          isPro: org.isPro,
        });
        break;
      case 'routing':
        result = this.decideRouting(input.query);
        break;
      case 'fallback':
        result = this.decideFallback(input.query);
        break;
      case 'confidence':
        result = this.decideConfidence({
          query: input.query,
          signalStrength: input.signalStrength,
          matched: input.matched,
        });
        break;
      case 'risk':
        result = this.decideRisk({
          query: input.query,
          charactersRemaining: org.charactersRemaining,
          disabled: org.disabled,
        });
        break;
      case 'policy':
        result = this.decidePolicy(org);
        break;
      case 'safety':
        result = this.decideSafety(input.query);
        break;
      case 'tool_selection':
        result = this.decideTools(input.query);
        break;
      case 'workflow':
        result = this.decideWorkflow(input.query);
        break;
      case 'cost':
        result = this.decideCost({
          query: input.query,
          family: input.family,
          isPro: org.isPro,
        });
        break;
    }

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'decision_engine.decided',
      route: 'POST /v1/decision-engine/decide',
      ip: input.ip,
      metadata: {
        kind,
        decision: result.decision,
        confidence: result.confidence,
      },
    });

    return {
      ...result,
      honesty: {
        enterpriseBrms: false,
        droolsPegaParity: false,
        lightRules: true,
        trainsDecisionModels: false,
        executesTools: false,
      },
      note: 'Light rules decision helper. Not an enterprise BRMS.',
    };
  }

  async analytics(organizationId: string, workspaceId: string) {
    const start = new Date;
    start.setUTCDate(1);
    start.setUTCHours(0, 0, 0, 0);
    const decisions = await this.prisma.auditEvent.count({
      where: {
        organizationId,
        action: 'decision_engine.decided',
        createdAt: { gte: start },
      },
    });
    return {
      periodStart: start.toISOString,
      decisions,
      workspaceId,
      note: 'Decision Engine analytics.',
    };
  }

  async monitoring(organizationId: string, workspaceId: string) {
    const [analytics, engine] = await Promise.all([
      this.analytics(organizationId, workspaceId),
      Promise.resolve(this.engine),
    ]);
    return {
      generatedAt: new Date.toISOString,
      periodStart: analytics.periodStart,
      decisions: analytics.decisions,
      enterpriseBrms: engine.honesty.enterpriseBrms,
      deferred: engine.capabilities.filter((c) => c.status === 'deferred').map((c) => c.id),
      note: 'Decision Engine monitoring snapshot.',
    };
  }
}
