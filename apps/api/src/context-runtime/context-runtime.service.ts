import { createHash } from 'crypto';
import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ContextEngineService } from '../context-engine/context-engine.service';
import { IntelligentCacheService } from '../intelligent-cache/intelligent-cache.service';
import { ApiException } from '../common/errors/api-exception';
import {
  CONTEXT_RUNTIME_PRIORITIES,
  contextRuntimeCatalog,
  contextRuntimeCeilings,
  contextRuntimeMode,
} from './context-runtime.catalog';

type AuthCtx = {
  organizationId: string;
  workspaceId: string;
  apiKeyId?: string;
  userId?: string;
  ip?: string;
};

type ContextBlock = {
  id: string;
  kind: string;
  priority: number;
  content: string;
  chars: number;
  truncated?: boolean;
};

type AssembleInput = AuthCtx & {
  query?: string;
  conversationId?: string;
  projectKey?: string;
  subjectUserId?: string;
  promptKey?: 'chat' | 'rag';
  modelHint?: string;
  providerHint?: string;
  include?: Record<string, boolean>;
  maxChars?: number;
  documentK?: number;
  memoryLimit?: number;
  useCache?: boolean;
  priorityOverrides?: Record<string, number>;
};

@Injectable()
export class ContextRuntimeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly contextEngine: ContextEngineService,
    private readonly cache: IntelligentCacheService,
  ) {}

  engine() {
    return {
      ...contextRuntimeCatalog(),
      ceilings: contextRuntimeCeilings(),
      mode: contextRuntimeMode(),
      priorities: CONTEXT_RUNTIME_PRIORITIES,
    };
  }

  scopes() {
    return {
      scopes: CONTEXT_RUNTIME_PRIORITIES.map((p) => ({ id: p.kind, priority: p.priority })),
      layer: 'kernel',
      note: 'Context Runtime scopes map onto Context Engine sources + model block.',
      honesty: contextRuntimeCatalog().honesty,
    };
  }

  async assemble(input: AssembleInput) {
    this.assertEnabled();
    const ceilings = contextRuntimeCeilings();
    const maxChars = Math.min(
      ceilings.maxChars,
      Math.max(500, Math.floor(input.maxChars ?? ceilings.maxChars)),
    );
    const useCache = input.useCache === true;
    const cacheKey = this.cacheKey(input, maxChars);

    if (useCache) {
      try {
        const hit = await this.cache.lookup({
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
          userId: input.userId,
          ip: input.ip,
          namespace: 'context',
          key: cacheKey,
        });
        if (hit.hit && hit.entry?.value) {
          const value = hit.entry.value as {
            promptContext?: string;
            blocks?: ContextBlock[];
            included?: string[];
          };
          if (typeof value.promptContext === 'string') {
            await this.audit.record({
              organizationId: input.organizationId,
              userId: input.userId,
              action: 'context_runtime.assembled',
              route: 'POST /v1/context-runtime/assemble',
              ip: input.ip,
              metadata: { cache: 'hit', chars: value.promptContext.length },
            });
            return {
              ...value,
              assembledAt: new Date().toISOString(),
              organizationId: input.organizationId,
              workspaceId: input.workspaceId,
              cache: 'hit' as const,
              honesty: contextRuntimeCatalog().honesty,
              note: 'Cache hit from Intelligent Cache namespace=context.',
            };
          }
        }
      } catch {
        // continue
      }
    }

    const include = { ...(input.include ?? {}) };
    // knowledge alias → documents + knowledgeGraph
    if (include.knowledge === true) {
      include.documents = include.documents ?? true;
      include.knowledgeGraph = include.knowledgeGraph ?? true;
    }

    const base = await this.contextEngine.assemble({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      apiKeyId: input.apiKeyId,
      userId: input.userId,
      ip: input.ip,
      query: input.query,
      conversationId: input.conversationId,
      projectKey: input.projectKey,
      subjectUserId: input.subjectUserId,
      promptKey: input.promptKey,
      include,
      maxChars: Math.min(32000, maxChars * 2), // assemble raw then re-prioritize/compress
      documentK: input.documentK,
      memoryLimit: input.memoryLimit,
    });

    let blocks: ContextBlock[] = (base.blocks as ContextBlock[]).map((b) => ({
      ...b,
      priority: this.priorityFor(b.kind, input.priorityOverrides),
    }));

    if (input.modelHint?.trim() || input.providerHint?.trim()) {
      const content = `Model context: model=${input.modelHint?.trim() || 'default'}, provider=${input.providerHint?.trim() || 'gateway'}.`;
      blocks.push({
        id: 'model',
        kind: 'model',
        priority: this.priorityFor('model', input.priorityOverrides),
        content,
        chars: content.length,
      });
      if (!base.included.includes('model')) base.included.push('model');
    }

    // knowledge alias label when docs/KG present
    if (
      (base.included.includes('documents') || base.included.includes('knowledgeGraph')) &&
      !base.included.includes('knowledge')
    ) {
      base.included.push('knowledge');
    }

    const prioritized = this.prioritizeBlocks(blocks, input.priorityOverrides);
    const compressed = this.compressBlocks(prioritized.blocks, maxChars);
    const promptContext = compressed.blocks
      .map((b) => `## ${b.kind}\n${b.content}`)
      .join('\n\n');

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'context_runtime.assembled',
      route: 'POST /v1/context-runtime/assemble',
      ip: input.ip,
      metadata: {
        included: base.included,
        beforeChars: compressed.beforeChars,
        afterChars: compressed.afterChars,
        truncated: compressed.truncated,
        cache: 'miss',
      },
    });

    const result = {
      assembledAt: new Date().toISOString(),
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      query: base.query,
      included: base.included,
      blocks: compressed.blocks,
      promptContext,
      compression: {
        maxChars,
        beforeChars: compressed.beforeChars,
        afterChars: compressed.afterChars,
        truncated: compressed.truncated,
        method: 'priority_char_budget',
      },
      prioritization: {
        order: prioritized.blocks.map((b) => b.kind),
        overrides: input.priorityOverrides ?? {},
      },
      cache: useCache ? ('miss' as const) : ('skipped' as const),
      honesty: contextRuntimeCatalog().honesty,
      note: 'Kernel assemble over Context Engine — not infinite context / LLM summarization OS.',
    };

    if (useCache) {
      try {
        await this.cache.put({
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
          userId: input.userId,
          ip: input.ip,
          namespace: 'context',
          key: cacheKey,
          value: {
            promptContext: result.promptContext,
            blocks: result.blocks,
            included: result.included,
            runtime: 'context-runtime',
          },
          ttlSec: ceilings.cacheTtlSec,
          labels: ['context-runtime'],
        });
      } catch {
        // non-fatal
      }
    }

    return result;
  }

  async retrieve(input: AssembleInput) {
    const assembled = await this.assemble(input);
    return {
      query: assembled.query,
      included: assembled.included,
      blocks: assembled.blocks,
      promptContext: assembled.promptContext,
      compression: assembled.compression,
      honesty: assembled.honesty,
      note: 'Retrieval façade over assemble.',
    };
  }

  prioritize(
    input: AuthCtx & {
      blocks?: ContextBlock[];
      priorityOverrides?: Record<string, number>;
      maxChars?: number;
    },
  ) {
    this.assertEnabled();
    const blocks = input.blocks ?? [];
    if (!blocks.length) {
      throw new ApiException(
        'validation_error',
        'blocks array is required',
        HttpStatus.BAD_REQUEST,
      );
    }
    const prioritized = this.prioritizeBlocks(blocks, input.priorityOverrides);
    const maxChars = input.maxChars
      ? Math.min(contextRuntimeCeilings().maxChars, Math.max(100, input.maxChars))
      : undefined;
    const final = maxChars
      ? this.compressBlocks(prioritized.blocks, maxChars)
      : {
          blocks: prioritized.blocks,
          beforeChars: prioritized.blocks.reduce((n, b) => n + b.chars, 0),
          afterChars: prioritized.blocks.reduce((n, b) => n + b.chars, 0),
          truncated: false,
        };
    return {
      blocks: final.blocks,
      order: final.blocks.map((b) => b.kind),
      compression: maxChars
        ? {
            maxChars,
            beforeChars: final.beforeChars,
            afterChars: final.afterChars,
            truncated: final.truncated,
          }
        : null,
      note: 'Priority reorder (lower priority number kept first under budget).',
    };
  }

  compress(
    input: AuthCtx & {
      blocks?: ContextBlock[];
      text?: string;
      maxChars?: number;
      priorityOverrides?: Record<string, number>;
    },
  ) {
    this.assertEnabled();
    const maxChars = Math.min(
      contextRuntimeCeilings().maxChars,
      Math.max(40, Math.floor(input.maxChars ?? contextRuntimeCeilings().maxChars)),
    );
    let blocks = input.blocks;
    if (!blocks?.length && input.text?.trim()) {
      blocks = [
        {
          id: 'text',
          kind: 'workspace',
          priority: 20,
          content: input.text.trim(),
          chars: input.text.trim().length,
        },
      ];
    }
    if (!blocks?.length) {
      throw new ApiException(
        'validation_error',
        'blocks or text is required',
        HttpStatus.BAD_REQUEST,
      );
    }
    const prioritized = this.prioritizeBlocks(blocks, input.priorityOverrides);
    const compressed = this.compressBlocks(prioritized.blocks, maxChars);
    return {
      blocks: compressed.blocks,
      promptContext: compressed.blocks.map((b) => `## ${b.kind}\n${b.content}`).join('\n\n'),
      beforeChars: compressed.beforeChars,
      afterChars: compressed.afterChars,
      truncated: compressed.truncated,
      maxChars,
      honesty: { llmSummarization: false },
      note: 'Char-budget truncation — not LLM summarization OS.',
    };
  }

  async analytics(input: AuthCtx) {
    this.assertEnabled();
    const start = new Date();
    start.setUTCDate(1);
    start.setUTCHours(0, 0, 0, 0);
    const assemblies = await this.prisma.auditEvent.count({
      where: {
        organizationId: input.organizationId,
        action: 'context_runtime.assembled',
        createdAt: { gte: start },
      },
    });
    return {
      periodStart: start.toISOString(),
      workspaceId: input.workspaceId,
      assemblies,
      honesty: contextRuntimeCatalog().honesty,
      note: 'Context Runtime analytics.',
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
        note: 'Context Runtime assembles text only; Agent/Workflow action gates remain –222.',
      },
    };
  }

  private assertEnabled() {
    if (contextRuntimeMode() === 'disabled') {
      throw new ApiException(
        'context_runtime_disabled',
        'Context Runtime mode is disabled (LUGEMI_CONTEXT_RUNTIME_MODE=disabled).',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  private priorityFor(kind: string, overrides?: Record<string, number>) {
    if (overrides && typeof overrides[kind] === 'number') return overrides[kind]!;
    return (
      CONTEXT_RUNTIME_PRIORITIES.find((p) => p.kind === kind)?.priority ?? 100
    );
  }

  private prioritizeBlocks(blocks: ContextBlock[], overrides?: Record<string, number>) {
    const mapped = blocks.map((b) => ({
      ...b,
      priority: this.priorityFor(b.kind, overrides),
      chars: b.chars || b.content.length,
    }));
    mapped.sort((a, b) => a.priority - b.priority || a.kind.localeCompare(b.kind));
    return { blocks: mapped };
  }

  private compressBlocks(blocks: ContextBlock[], maxChars: number) {
    const sorted = [...blocks].sort((a, b) => a.priority - b.priority);
    let used = 0;
    const out: ContextBlock[] = [];
    for (const block of sorted) {
      const remaining = maxChars - used;
      if (remaining <= 0) break;
      if (block.content.length <= remaining) {
        out.push(block);
        used += block.content.length;
      } else {
        const sliced = `${block.content.slice(0, Math.max(0, remaining - 1))}…`;
        out.push({ ...block, content: sliced, chars: sliced.length, truncated: true });
        used += sliced.length;
        break;
      }
    }
    const beforeChars = blocks.reduce((n, b) => n + (b.chars || b.content.length), 0);
    const afterChars = out.reduce((n, b) => n + b.chars, 0);
    return {
      blocks: out,
      beforeChars,
      afterChars,
      truncated: afterChars < beforeChars || out.some((b) => b.truncated),
    };
  }

  private cacheKey(input: AssembleInput, maxChars: number) {
    const payload = JSON.stringify({
      q: input.query ?? null,
      c: input.conversationId ?? null,
      p: input.projectKey ?? null,
      u: input.subjectUserId ?? null,
      pk: input.promptKey ?? null,
      m: input.modelHint ?? null,
      pr: input.providerHint ?? null,
      i: input.include ?? null,
      o: input.priorityOverrides ?? null,
      maxChars,
    });
    return `cr:${createHash('sha256').update(payload).digest('hex').slice(0, 24)}`;
  }
}
