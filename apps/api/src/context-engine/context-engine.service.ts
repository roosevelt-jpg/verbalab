import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { KnowledgeService } from '../knowledge/knowledge.service';
import { MemoryCloudService } from '../memory-cloud/memory-cloud.service';
import { KnowledgeGraphService } from '../knowledge-graph/knowledge-graph.service';
import { PromptsService } from '../prompts/prompts.service';
import { ApiException } from '../common/errors/api-exception';
import { contextEngineCatalog } from './context-engine.catalog';

type AuthCtx = {
  organizationId: string;
  workspaceId: string;
  apiKeyId?: string;
  userId?: string;
  ip?: string;
};

type IncludeFlags = {
  conversation?: boolean;
  documents?: boolean;
  organization?: boolean;
  project?: boolean;
  language?: boolean;
  user?: boolean;
  workspace?: boolean;
  historical?: boolean;
  knowledgeGraph?: boolean;
  prompt?: boolean;
};

type ContextBlock = {
  id: string;
  kind: string;
  priority: number;
  content: string;
  chars: number;
  truncated?: boolean;
};

@Injectable()
export class ContextEngineService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly knowledge: KnowledgeService,
    private readonly memory: MemoryCloudService,
    private readonly knowledgeGraph: KnowledgeGraphService,
    private readonly prompts: PromptsService,
  ) {}

  engine() {
    return contextEngineCatalog();
  }

  sources() {
    return {
      sources: [
        { id: 'language', status: 'shipped', from: 'workspace defaults' },
        { id: 'workspace', status: 'shipped', from: 'workspace + memory' },
        { id: 'organization', status: 'shipped', from: 'organization + memory' },
        { id: 'user', status: 'shipped', from: 'subject memories' },
        { id: 'project', status: 'shipped', from: 'project memories' },
        { id: 'conversation', status: 'shipped', from: 'conversation memories' },
        { id: 'historical', status: 'shipped', from: 'long_term/shared memories' },
        { id: 'documents', status: 'shipped', from: 'vector search' },
        { id: 'knowledgeGraph', status: 'partial', from: 'entity name list' },
        { id: 'prompt', status: 'shipped', from: 'prompts resolve (chat/rag)' },
      ],
      note: 'Context sources assembled by . Realtime deferred.',
    };
  }

  private flag(include: IncludeFlags | undefined, key: keyof IncludeFlags, defaultValue = true) {
    if (!include || include[key] === undefined) return defaultValue;
    return Boolean(include[key]);
  }

  private compress(blocks: ContextBlock[], maxChars: number) {
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
        const sliced = block.content.slice(0, Math.max(0, remaining - 1)) + '…';
        out.push({
          ...block,
          content: sliced,
          chars: sliced.length,
          truncated: true,
        });
        used += sliced.length;
        break;
      }
    }
    const beforeChars = blocks.reduce((n, b) => n + b.chars, 0);
    const afterChars = out.reduce((n, b) => n + b.chars, 0);
    return {
      blocks: out.sort((a, b) => a.priority - b.priority),
      beforeChars,
      afterChars,
      truncated: afterChars < beforeChars || out.some((b) => b.truncated),
    };
  }

  async assemble(
    input: AuthCtx & {
      query?: string;
      conversationId?: string;
      projectKey?: string;
      subjectUserId?: string;
      promptKey?: 'chat' | 'rag';
      include?: IncludeFlags;
      maxChars?: number;
      documentK?: number;
      memoryLimit?: number;
    },
  ) {
    const maxChars = Math.min(Math.max(input.maxChars ?? 8000, 500), 32000);
    const memoryLimit = Math.min(Math.max(input.memoryLimit ?? 8, 1), 40);
    const documentK = Math.min(Math.max(input.documentK ?? 4, 1), 12);
    const subjectUserId = input.subjectUserId ?? input.userId;
    const include = input.include;

    const [org, workspace] = await Promise.all([
      this.prisma.organization.findUnique({
        where: { id: input.organizationId },
        select: { id: true, name: true, plan: true },
      }),
      this.prisma.workspace.findFirst({
        where: { id: input.workspaceId, organizationId: input.organizationId },
        select: {
          id: true,
          name: true,
          defaultSourceLang: true,
          defaultTargetLang: true,
        },
      }),
    ]);

    if (!org || !workspace) {
      throw new ApiException('not_found', 'organization or workspace not found', HttpStatus.NOT_FOUND);
    }

    const blocks: ContextBlock[] = [];
    const included: string[] = [];

    if (this.flag(include, 'language')) {
      included.push('language');
      const content = `Language defaults: source=${workspace.defaultSourceLang}, target=${workspace.defaultTargetLang}.`;
      blocks.push({ id: 'language', kind: 'language', priority: 10, content, chars: content.length });
    }

    if (this.flag(include, 'workspace')) {
      included.push('workspace');
      const mem = await this.memory.list({
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        scope: 'workspace',
        limit: memoryLimit,
      });
      const lines = [
        `Workspace: ${workspace.name} (${workspace.id}).`,
        ...mem.data.map((m) => `- ${m.content}`),
      ];
      const content = lines.join('\n');
      blocks.push({ id: 'workspace', kind: 'workspace', priority: 20, content, chars: content.length });
    }

    if (this.flag(include, 'organization')) {
      included.push('organization');
      const mem = await this.memory.list({
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        scope: 'organization',
        limit: memoryLimit,
      });
      const lines = [
        `Organization: ${org.name} (plan=${org.plan}).`,
        ...mem.data.map((m) => `- ${m.content}`),
      ];
      const content = lines.join('\n');
      blocks.push({
        id: 'organization',
        kind: 'organization',
        priority: 25,
        content,
        chars: content.length,
      });
    }

    if (this.flag(include, 'user') && subjectUserId) {
      included.push('user');
      const mem = await this.memory.list({
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        subjectUserId,
        limit: memoryLimit,
      });
      const lines = [`User subject: ${subjectUserId}.`, ...mem.data.map((m) => `- ${m.content}`)];
      const content = lines.join('\n');
      blocks.push({ id: 'user', kind: 'user', priority: 30, content, chars: content.length });
    }

    if (this.flag(include, 'project') && input.projectKey?.trim()) {
      included.push('project');
      const mem = await this.memory.list({
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        scope: 'project',
        projectKey: input.projectKey.trim(),
        limit: memoryLimit,
      });
      const lines = [
        `Project: ${input.projectKey.trim()}.`,
        ...mem.data.map((m) => `- ${m.content}`),
      ];
      const content = lines.join('\n');
      blocks.push({ id: 'project', kind: 'project', priority: 35, content, chars: content.length });
    }

    if (this.flag(include, 'conversation') && input.conversationId?.trim()) {
      included.push('conversation');
      const mem = await this.memory.list({
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        scope: 'conversation',
        conversationId: input.conversationId.trim(),
        limit: memoryLimit,
      });
      const lines = [
        `Conversation: ${input.conversationId.trim()}.`,
        ...mem.data.map((m) => `- ${m.content}`),
      ];
      const content = lines.join('\n');
      blocks.push({
        id: 'conversation',
        kind: 'conversation',
        priority: 40,
        content,
        chars: content.length,
      });
    }

    if (this.flag(include, 'historical')) {
      included.push('historical');
      const [longTerm, shared] = await Promise.all([
        this.memory.list({
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
          kind: 'long_term',
          limit: memoryLimit,
        }),
        this.memory.list({
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
          kind: 'shared',
          limit: Math.ceil(memoryLimit / 2),
        }),
      ]);
      const lines = [
        'Historical memory:',
        ...longTerm.data.map((m) => `- [long_term] ${m.content}`),
        ...shared.data.map((m) => `- [shared] ${m.content}`),
      ];
      const content = lines.join('\n');
      blocks.push({
        id: 'historical',
        kind: 'historical',
        priority: 45,
        content,
        chars: content.length,
      });
    }

    if (this.flag(include, 'prompt')) {
      included.push('prompt');
      const key = input.promptKey === 'chat' ? 'chat' : 'rag';
      const resolved = await this.prompts.resolve({
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        key,
      });
      const content = `System prompt (${key}, ${resolved.source}): ${resolved.body}`;
      blocks.push({ id: 'prompt', kind: 'prompt', priority: 15, content, chars: content.length });
    }

    if (this.flag(include, 'documents') && input.query?.trim()) {
      included.push('documents');
      const search = await this.knowledge.searchVectors({
        query: input.query.trim(),
        k: documentK,
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        apiKeyId: input.apiKeyId,
        userId: input.userId,
        ip: input.ip,
      });
      const lines = [
        `Document retrieval for: ${search.query}`,
        ...search.hits.map(
          (h) => `[${h.rank}] (${h.filename}, score=${h.score.toFixed(3)}) ${h.content}`,
        ),
      ];
      const content = lines.join('\n');
      blocks.push({ id: 'documents', kind: 'documents', priority: 50, content, chars: content.length });
    }

    if (this.flag(include, 'knowledgeGraph')) {
      included.push('knowledgeGraph');
      const entities = await this.knowledgeGraph.listEntities({
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        q: input.query?.trim() || undefined,
        limit: 12,
      });
      const lines = [
        'Knowledge graph entities:',
        ...entities.data.map((e) => `- ${e.name} (${e.type})`),
      ];
      const content = lines.join('\n');
      blocks.push({
        id: 'knowledgeGraph',
        kind: 'knowledgeGraph',
        priority: 55,
        content,
        chars: content.length,
      });
    }

    const compressed = this.compress(blocks, maxChars);
    const promptContext = compressed.blocks
      .map((b) => `## ${b.kind}\n${b.content}`)
      .join('\n\n');

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'context_engine.assembled',
      route: 'POST /v1/context-engine/assemble',
      ip: input.ip,
      metadata: {
        included,
        beforeChars: compressed.beforeChars,
        afterChars: compressed.afterChars,
        truncated: compressed.truncated,
        blockCount: compressed.blocks.length,
      },
    });

    return {
      assembledAt: new Date().toISOString(),
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      query: input.query?.trim() || null,
      included,
      blocks: compressed.blocks,
      promptContext,
      compression: {
        maxChars,
        beforeChars: compressed.beforeChars,
        afterChars: compressed.afterChars,
        truncated: compressed.truncated,
        method: 'priority_char_budget',
      },
      note: 'Assembled context for AI requests. Not an infinite context window; LLM summarization deferred.',
    };
  }

  async analytics(organizationId: string, workspaceId: string) {
    const start = new Date();
    start.setUTCDate(1);
    start.setUTCHours(0, 0, 0, 0);
    const assemblies = await this.prisma.auditEvent.count({
      where: {
        organizationId,
        action: 'context_engine.assembled',
        createdAt: { gte: start },
      },
    });
    return {
      periodStart: start.toISOString(),
      assemblies,
      workspaceId,
      note: 'Context Engine analytics from assemble audits.',
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
      assemblies: analytics.assemblies,
      infiniteContextWindow: engine.honesty.infiniteContextWindow,
      realtimePush: engine.honesty.realtimePush,
      deferred: engine.capabilities.filter((c) => c.status === 'deferred').map((c) => c.id),
      note: 'Context Engine monitoring snapshot.',
    };
  }
}
