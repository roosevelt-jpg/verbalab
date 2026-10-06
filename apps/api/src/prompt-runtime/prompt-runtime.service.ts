import { createHash } from 'crypto';
import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { PromptsService } from '../prompts/prompts.service';
import { PromptIntelligenceService } from '../prompt-intelligence/prompt-intelligence.service';
import { IntelligentCacheService } from '../intelligent-cache/intelligent-cache.service';
import { ApiException } from '../common/errors/api-exception';
import {
  PROMPT_KEYS,
  PromptKey,
  defaultPromptBody,
  isPromptKey,
} from '../prompts/prompt-defaults';
import {
  PROMPT_RUNTIME_ROUTES,
  promptRuntimeCatalog,
  promptRuntimeCeilings,
  promptRuntimeMode,
} from './prompt-runtime.catalog';

type AuthCtx = {
  organizationId: string;
  workspaceId: string;
  userId?: string;
  ip?: string;
};

const VAR_RE = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g;

@Injectable()
export class PromptRuntimeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly prompts: PromptsService,
    private readonly promptIntel: PromptIntelligenceService,
    private readonly cache: IntelligentCacheService,
  ) {}

  engine() {
    return {
      ...promptRuntimeCatalog(),
      ceilings: promptRuntimeCeilings(),
      mode: promptRuntimeMode(),
      routes: PROMPT_RUNTIME_ROUTES,
    };
  }

  keys() {
    return {
      keys: PROMPT_KEYS.map((id) => ({ id })),
      layer: 'kernel',
      note: 'Prompt Runtime keys map onto managed prompts.',
      honesty: promptRuntimeCatalog().honesty,
    };
  }

  async registry(input: AuthCtx) {
    this.assertEnabled();
    const reg = await this.promptIntel.registry(input.organizationId, input.workspaceId);
    return {
      ...reg,
      note: 'Prompt Runtime registry façade over existing.',
    };
  }

  async templates(input: AuthCtx) {
    this.assertEnabled();
    const listed = await this.prompts.list(input.organizationId, input.workspaceId);
    const templates = await Promise.all(
      listed.map(async (item) => {
        const resolved = await this.prompts.resolve({
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
          key: item.key as PromptKey,
        });
        return {
          key: item.key,
          activeVersion: item.activeVersion,
          usingFallback: item.usingFallback,
          source: resolved.source,
          variables: this.extractVariables(resolved.body),
          preview: resolved.body.slice(0, 160),
        };
      }),
    );
    return {
      templates,
      note: 'Managed templates (chat/rag/voice_faq). CRUD remains on /v1/prompts.',
    };
  }

  route(input: { feature?: string }) {
    this.assertEnabled();
    const feature = (input.feature ?? '').trim().toLowerCase();
    if (!feature) {
      throw new ApiException('validation_error', 'feature is required', HttpStatus.BAD_REQUEST);
    }
    const hit = PROMPT_RUNTIME_ROUTES.find((r) => r.feature === feature);
    if (!hit) {
      return {
        feature,
        key: null as string | null,
        matched: false,
        routes: PROMPT_RUNTIME_ROUTES,
        honesty: { promptMeshOs: false },
        note: 'No sandbox route for feature — pass key explicitly to execute.',
      };
    }
    return {
      feature,
      key: hit.key,
      matched: true,
      notes: hit.notes,
      honesty: { promptMeshOs: false },
      note: 'Sandbox feature→key map — not a prompt mesh OS.',
    };
  }

  async versions(input: AuthCtx & { key?: string }) {
    this.assertEnabled();
    const key = this.requireKey(input.key);
    return this.prompts.listVersions({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      key,
    });
  }

  async render(
    input: AuthCtx & {
      key?: string;
      body?: string;
      version?: number;
      variables?: Record<string, string>;
    },
  ) {
    this.assertEnabled();
    const resolved = await this.resolveBody(input);
    const variables = input.variables ?? {};
    const rendered = this.applyVariables(resolved.body, variables);
    const missing = this.extractVariables(rendered);
    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'prompt_runtime.rendered',
      route: 'POST /v1/prompt-runtime/render',
      ip: input.ip,
      metadata: {
        key: resolved.key,
        chars: rendered.length,
        missingCount: missing.length,
      },
    });
    return {
      key: resolved.key,
      source: resolved.source,
      version: resolved.version,
      body: rendered,
      variablesApplied: Object.keys(variables),
      missingVariables: missing,
      chars: [...rendered].length,
      note: '{{name}} substitution only — not a templating OS.',
    };
  }

  async validate(
    input: AuthCtx & {
      key?: string;
      body?: string;
      version?: number;
      variables?: Record<string, string>;
    },
  ) {
    this.assertEnabled();
    const ceilings = promptRuntimeCeilings();
    const rendered = await this.render(input);
    const findings: Array<{ id: string; severity: string; message: string }> = [];
    if (!rendered.body.trim()) {
      findings.push({ id: 'empty', severity: 'error', message: 'Rendered prompt is empty' });
    }
    if (rendered.chars > ceilings.maxRenderedChars) {
      findings.push({
        id: 'too-long',
        severity: 'error',
        message: `Rendered prompt exceeds maxRenderedChars (${ceilings.maxRenderedChars})`,
      });
    }
    for (const v of rendered.missingVariables) {
      findings.push({
        id: `missing:${v}`,
        severity: 'warn',
        message: `Unresolved variable {{${v}}}`,
      });
    }
    const ok = findings.every((f) => f.severity !== 'error');
    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'prompt_runtime.validated',
      route: 'POST /v1/prompt-runtime/validate',
      ip: input.ip,
      metadata: { key: rendered.key, ok, findingCount: findings.length },
    });
    return {
      key: rendered.key,
      ok,
      findings,
      chars: rendered.chars,
      ceilings,
      note: 'Heuristic validation — not a formal prompt schema OS.',
    };
  }

  async securityScan(
    input: AuthCtx & { key?: string; body?: string; version?: number },
  ) {
    this.assertEnabled();
    const scan = await this.promptIntel.securityScan({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      userId: input.userId,
      ip: input.ip,
      key: input.key,
      body: input.body,
      version: input.version,
    });
    return {
      ...scan,
      note: 'Delegates to Prompt Intelligence pattern scan — not a red-team harness OS.',
    };
  }

  async optimize(
    input: AuthCtx & {
      key?: string;
      body?: string;
      version?: number;
      maxChars?: number;
    },
  ) {
    this.assertEnabled();
    const resolved = await this.resolveBody(input);
    const maxChars = Math.min(
      promptRuntimeCeilings().maxRenderedChars,
      Math.max(40, Math.floor(input.maxChars ?? 4000)),
    );
    const tips: string[] = [];
    let optimized = resolved.body.trim();
    if (optimized.length > maxChars) {
      optimized = `${optimized.slice(0, Math.max(0, maxChars - 16)).trim()}…[trimmed]`;
      tips.push(`Trimmed to maxChars=${maxChars}`);
    }
    if (/\s{2,}/.test(optimized)) {
      optimized = optimized.replace(/\s{2,}/g, ' ');
      tips.push('Collapsed repeated whitespace');
    }
    if (!/you are|assistant|system/i.test(optimized)) {
      tips.push('Consider an explicit role/instruction line');
    }
    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'prompt_runtime.optimized',
      route: 'POST /v1/prompt-runtime/optimize',
      ip: input.ip,
      metadata: { key: resolved.key, tips: tips.length },
    });
    return {
      key: resolved.key,
      source: resolved.source,
      version: resolved.version,
      beforeChars: [...resolved.body].length,
      afterChars: [...optimized].length,
      body: optimized,
      tips,
      honesty: {
        autoPromptResearchLab: false,
        evolutionaryOptimizer: false,
        heuristicOnly: true,
      },
      note: 'Heuristic optimize stub — not an auto-prompt research lab.',
    };
  }

  async execute(
    input: AuthCtx & {
      key?: string;
      feature?: string;
      body?: string;
      version?: number;
      variables?: Record<string, string>;
      useCache?: boolean;
      skipSecurity?: boolean;
    },
  ) {
    this.assertEnabled();
    let key = input.key;
    if (!key && input.feature) {
      const routed = this.route({ feature: input.feature });
      if (!routed.key) {
        throw new ApiException(
          'validation_error',
          `No prompt route for feature=${input.feature}; pass key`,
          HttpStatus.BAD_REQUEST,
        );
      }
      key = routed.key;
    }
    const resolvedKey = this.requireKey(key);

    const variables = input.variables ?? {};
    const cacheKey = this.cacheKey(resolvedKey, input.version, input.body, variables);
    const useCache = input.useCache !== false;

    if (useCache) {
      try {
        const hit = await this.cache.lookup({
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
          userId: input.userId,
          ip: input.ip,
          namespace: 'prompt',
          key: cacheKey,
        });
        if (hit.hit && hit.entry?.value) {
          const value = hit.entry.value as {
            body?: string;
            source?: string;
            version?: number | null;
          };
          if (typeof value.body === 'string') {
            await this.audit.record({
              organizationId: input.organizationId,
              userId: input.userId,
              action: 'prompt_runtime.executed',
              route: 'POST /v1/prompt-runtime/execute',
              ip: input.ip,
              metadata: { key: resolvedKey, cache: 'hit' },
            });
            return {
              key: resolvedKey,
              source: value.source ?? 'cache',
              version: value.version ?? null,
              body: value.body,
              chars: [...value.body].length,
              cache: 'hit' as const,
              security: null,
              honesty: promptRuntimeCatalog().honesty,
              note: 'Cache hit from Intelligent Cache namespace=prompt — execute does not call an LLM.',
            };
          }
        }
      } catch {
        // Cache disabled or ceiling — continue without cache.
      }
    }

    const rendered = await this.render({
      ...input,
      key: resolvedKey,
      variables,
    });
    const validation = await this.validate({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      userId: input.userId,
      ip: input.ip,
      key: resolvedKey,
      body: rendered.body,
      variables: {},
    });
    if (!validation.ok) {
      throw new ApiException(
        'prompt_runtime_invalid',
        validation.findings.find((f) => f.severity === 'error')?.message ??
          'Rendered prompt failed validation',
        HttpStatus.BAD_REQUEST,
      );
    }

    let security: Awaited<ReturnType<PromptIntelligenceService['securityScan']>> | null = null;
    if (!input.skipSecurity) {
      security = await this.securityScan({
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        userId: input.userId,
        ip: input.ip,
        key: resolvedKey,
        body: rendered.body,
      });
      if (!security.ok) {
        throw new ApiException(
          'prompt_runtime_security',
          'Prompt failed security pattern scan',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    if (useCache) {
      try {
        await this.cache.put({
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
          userId: input.userId,
          ip: input.ip,
          namespace: 'prompt',
          key: cacheKey,
          value: {
            body: rendered.body,
            source: rendered.source,
            version: rendered.version,
            runtime: 'prompt-runtime',
          },
          ttlSec: promptRuntimeCeilings().cacheTtlSec,
          labels: ['prompt-runtime', resolvedKey],
        });
      } catch {
        // Non-fatal
      }
    }

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'prompt_runtime.executed',
      route: 'POST /v1/prompt-runtime/execute',
      ip: input.ip,
      metadata: { key: resolvedKey, cache: 'miss', chars: rendered.chars },
    });

    return {
      key: resolvedKey,
      source: rendered.source,
      version: rendered.version,
      body: rendered.body,
      chars: rendered.chars,
      missingVariables: rendered.missingVariables,
      cache: useCache ? ('miss' as const) : ('skipped' as const),
      security: security
        ? { ok: security.ok, findingCount: security.findings.length }
        : null,
      honesty: promptRuntimeCatalog().honesty,
      note: 'Sandbox execute — resolve/render/validate only; does not call an LLM.',
    };
  }

  async analytics(input: AuthCtx) {
    this.assertEnabled();
    const start = new Date();
    start.setUTCDate(1);
    start.setUTCHours(0, 0, 0, 0);
    const actions = [
      'prompt_runtime.executed',
      'prompt_runtime.rendered',
      'prompt_runtime.validated',
      'prompt_runtime.optimized',
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
    return {
      periodStart: start.toISOString(),
      workspaceId: input.workspaceId,
      events: counts.reduce((s, c) => s + c.count, 0),
      byAction: Object.fromEntries(counts.map((c) => [c.action, c.count])),
      honesty: promptRuntimeCatalog().honesty,
      note: 'Prompt Runtime analytics.',
    };
  }

  async monitoring(input: AuthCtx) {
    const [engine, analytics, templates] = await Promise.all([
      Promise.resolve(this.engine()),
      this.analytics(input),
      this.templates(input),
    ]);
    return {
      mode: engine.mode,
      ceilings: engine.ceilings,
      analytics,
      templateCount: templates.templates.length,
      honesty: engine.honesty,
      safety: {
        agentActionBoundariesRequired: true,
        note: 'Prompt Runtime prepares text only; Agent/Workflow action gates remain –222.',
      },
    };
  }

  private assertEnabled() {
    if (promptRuntimeMode() === 'disabled') {
      throw new ApiException(
        'prompt_runtime_disabled',
        'Prompt Runtime mode is disabled (LUGEMI_PROMPT_RUNTIME_MODE=disabled).',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  private requireKey(raw: string | undefined): PromptKey {
    if (!raw || !isPromptKey(raw)) {
      throw new ApiException(
        'validation_error',
        `key must be one of ${PROMPT_KEYS.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return raw;
  }

  private async resolveBody(
    input: AuthCtx & { key?: string; body?: string; version?: number },
  ): Promise<{ key: PromptKey; body: string; source: string; version: number | null }> {
    if (input.body?.trim() && !input.key) {
      return {
        key: 'chat',
        body: input.body.trim(),
        source: 'draft',
        version: null,
      };
    }
    const key = this.requireKey(input.key ?? 'chat');
    if (input.body?.trim()) {
      return { key, body: input.body.trim(), source: 'draft', version: null };
    }
    if (input.version != null) {
      const listed = await this.prompts.listVersions({
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        key,
      });
      const match = listed.versions.find((v) => v.version === input.version);
      if (!match) {
        throw new ApiException('not_found', 'Prompt version not found', HttpStatus.NOT_FOUND);
      }
      return { key, body: match.body, source: 'version', version: match.version };
    }
    const resolved = await this.prompts.resolve({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      key,
    });
    return {
      key,
      body: resolved.body || defaultPromptBody(key),
      source: resolved.source,
      version: resolved.version,
    };
  }

  private extractVariables(body: string): string[] {
    const found = new Set<string>();
    for (const m of body.matchAll(VAR_RE)) {
      found.add(m[1]!);
    }
    return [...found];
  }

  private applyVariables(body: string, variables: Record<string, string>): string {
    return body.replace(VAR_RE, (_full, name: string) => {
      if (Object.prototype.hasOwnProperty.call(variables, name)) {
        return String(variables[name] ?? '');
      }
      return `{{${name}}}`;
    });
  }

  private cacheKey(
    key: string,
    version: number | undefined,
    body: string | undefined,
    variables: Record<string, string>,
  ) {
    const payload = JSON.stringify({
      key,
      version: version ?? null,
      body: body?.trim() ?? null,
      variables,
    });
    const hash = createHash('sha256').update(payload).digest('hex').slice(0, 24);
    return `pr:${key}:${hash}`;
  }
}
