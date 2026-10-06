import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { GatewayService } from '../gateway/gateway.service';
import { UsageService } from '../usage/usage.service';
import { ContextEngineService } from '../context-engine/context-engine.service';
import { KnowledgeGraphService } from '../knowledge-graph/knowledge-graph.service';
import { ApiException } from '../common/errors/api-exception';
import { ChatMessage } from '../gateway/chat-provider';
import {
  REASONING_STRATEGIES,
  REASONING_TOOL_CATALOG,
  ReasoningStrategy,
  reasoningCloudCatalog,
} from './reasoning-cloud.catalog';

type AuthCtx = {
  organizationId: string;
  workspaceId: string;
  apiKeyId?: string;
  userId?: string;
  ip?: string;
};

@Injectable()
export class ReasoningCloudService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly gateway: GatewayService,
    private readonly usage: UsageService,
    private readonly contextEngine: ContextEngineService,
    private readonly knowledgeGraph: KnowledgeGraphService,
  ) {}

  engine() {
    return reasoningCloudCatalog();
  }

  strategies() {
    return {
      strategies: REASONING_STRATEGIES.map((id) => ({
        id,
        status:
          id === 'tree_of_thought' ||
          id === 'graph_reasoning' ||
          id === 'tool_selection' ||
          id === 'agent'
            ? 'partial'
            : 'shipped',
      })),
      tools: REASONING_TOOL_CATALOG,
      note: 'Prompt strategies over LLM gateway (VL-186). Not a custom reasoner kernel.',
    };
  }

  private assertStrategy(raw: string | undefined): ReasoningStrategy {
    const strategy = (raw?.trim() || 'chain_of_thought') as ReasoningStrategy;
    if (!(REASONING_STRATEGIES as readonly string[]).includes(strategy)) {
      throw new ApiException(
        'validation_error',
        `strategy must be one of: ${REASONING_STRATEGIES.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return strategy;
  }

  private systemPrompt(strategy: ReasoningStrategy, language?: string): string {
    const lang = language?.trim()
      ? ` Reason and answer in language code "${language.trim()}" when possible.`
      : '';
    const base =
      'You are VerbaLab Reasoning Cloud. Use careful multi-step reasoning. Do not invent tools or APIs that do not exist.';
    switch (strategy) {
      case 'chain_of_thought':
        return `${base}${lang}\nRespond with numbered reasoning steps, then a final line starting with "Answer:".`;
      case 'tree_of_thought':
        return `${base}${lang}\nYou evaluate candidate reasoning branches and pick the best. Be concise.`;
      case 'graph_reasoning':
        return `${base}${lang}\nUse the provided knowledge-graph neighborhood facts when relevant. Numbered steps, then "Answer:".`;
      case 'planning':
        return `${base}${lang}\nProduce an ordered plan (numbered), risks, then "Next action:".`;
      case 'decision':
        return `${base}${lang}\nList options, criteria, tradeoffs, then "Recommendation:".`;
      case 'problem_solving':
        return `${base}${lang}\nDiagnose the problem, list options, then "Solution:".`;
      case 'tool_selection':
        return `${base}${lang}\nChoose from ONLY the provided tool catalog. Explain briefly, then "Selected tools:" as a comma-separated list of tool ids. Do not claim you executed anything.`;
      case 'agent':
        return `${base}${lang}\nAct as a single-shot helpful agent. Outline thought → action suggestion → "Answer:". You cannot call tools in this turn.`;
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

  private async chatOnce(input: {
    messages: ChatMessage[];
    model?: string;
    organizationId: string;
    workspaceId: string;
    apiKeyId?: string;
  }) {
    const result = await this.gateway.chat({
      messages: input.messages,
      model: input.model,
    });
    await this.usage.recordChat({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      apiKeyId: input.apiKeyId,
      tokens: Math.max(1, result.totalTokens || [...result.message.content].length),
      provider: result.provider,
    });
    return result;
  }

  async reason(
    input: AuthCtx & {
      problem: string;
      strategy?: string;
      language?: string;
      model?: string;
      retrieve?: boolean;
      entityId?: string;
      maxChars?: number;
    },
  ) {
    const problem = input.problem?.trim();
    if (!problem) {
      throw new ApiException('validation_error', 'problem is required', HttpStatus.BAD_REQUEST);
    }
    const strategy = this.assertStrategy(input.strategy);
    const model = input.model?.trim() || undefined;

    let contextBlock: string | null = null;
    if (input.retrieve !== false) {
      const assembled = await this.contextEngine.assemble({
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        apiKeyId: input.apiKeyId,
        userId: input.userId,
        ip: input.ip,
        query: problem,
        maxChars: input.maxChars ?? 4000,
        promptKey: 'rag',
        include: {
          language: true,
          workspace: true,
          historical: true,
          documents: true,
          prompt: false,
          knowledgeGraph: strategy === 'graph_reasoning',
          organization: false,
          user: false,
          project: false,
          conversation: false,
        },
      });
      contextBlock = assembled.promptContext;
    }

    if (strategy === 'graph_reasoning' && input.entityId) {
      const neighborhood = await this.knowledgeGraph.neighborhood({
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        entityId: input.entityId,
      });
      const graphText = [
        `Entity: ${neighborhood.entity.name} (${neighborhood.entity.type})`,
        ...neighborhood.relationships.map(
          (r) =>
            `- ${r.type}: ${r.fromEntityId === neighborhood.entity.id ? '→' : '←'} ${r.toEntityId === neighborhood.entity.id ? r.fromEntityId : r.toEntityId}${r.label ? ` (${r.label})` : ''}`,
        ),
        ...neighborhood.neighbors.map((n) => `- neighbor: ${n.name} (${n.type})`),
      ].join('\n');
      contextBlock = [contextBlock, '## knowledge_graph_neighborhood', graphText]
        .filter(Boolean)
        .join('\n\n');
    }

    const system = this.systemPrompt(strategy, input.language);
    let answer: string;
    let branches: Array<{ id: string; content: string }> | undefined;
    let selectedTools: string[] | undefined;
    let provider: string;
    let modelUsed: string;
    let totalTokens = 0;
    let calls = 0;

    if (strategy === 'tree_of_thought') {
      const branchPrompt: ChatMessage[] = [
        { role: 'system', content: system },
        ...(contextBlock
          ? [{ role: 'user' as const, content: `Context:\n${contextBlock}` }]
          : []),
        {
          role: 'user',
          content: `Problem: ${problem}\n\nPropose exactly 2 distinct candidate approaches labeled Branch A and Branch B. Keep each under 6 lines.`,
        },
      ];
      const branchResult = await this.chatOnce({
        messages: branchPrompt,
        model,
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        apiKeyId: input.apiKeyId,
      });
      calls += 1;
      totalTokens += branchResult.totalTokens;
      branches = [
        { id: 'A', content: branchResult.message.content },
        { id: 'B', content: '(evaluated jointly in pick step)' },
      ];

      const pickMessages: ChatMessage[] = [
        { role: 'system', content: system },
        {
          role: 'user',
          content: `Problem: ${problem}\n\nCandidates:\n${branchResult.message.content}\n\nPick the better branch, explain briefly in numbered steps, then "Answer:".`,
        },
      ];
      const pick = await this.chatOnce({
        messages: pickMessages,
        model,
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        apiKeyId: input.apiKeyId,
      });
      calls += 1;
      totalTokens += pick.totalTokens;
      answer = pick.message.content;
      provider = pick.provider;
      modelUsed = pick.model;
    } else {
      const toolSection =
        strategy === 'tool_selection'
          ? `\n\nTool catalog:\n${REASONING_TOOL_CATALOG.map((t) => `- ${t.id}: ${t.name} (${t.api})`).join('\n')}`
          : '';
      const messages: ChatMessage[] = [
        { role: 'system', content: system },
        ...(contextBlock
          ? [{ role: 'user' as const, content: `Context:\n${contextBlock}` }]
          : []),
        {
          role: 'user',
          content: `Problem: ${problem}${toolSection}`,
        },
      ];
      const result = await this.chatOnce({
        messages,
        model,
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        apiKeyId: input.apiKeyId,
      });
      calls += 1;
      totalTokens += result.totalTokens;
      answer = result.message.content;
      provider = result.provider;
      modelUsed = result.model;

      if (strategy === 'tool_selection') {
        const match = answer.match(/Selected tools:\s*(.+)/i);
        selectedTools = match
          ? match[1]
              .split(',')
              .map((s) => s.trim().toLowerCase())
              .filter((id) => REASONING_TOOL_CATALOG.some((t) => t.id === id))
          : [];
      }
    }

    const steps = this.parseSteps(answer);

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'reasoning_cloud.reasoned',
      route: 'POST /v1/reasoning-cloud/reason',
      ip: input.ip,
      metadata: {
        strategy,
        provider,
        model: modelUsed,
        calls,
        totalTokens,
        retrieved: Boolean(contextBlock),
        language: input.language ?? null,
      },
    });

    return {
      id: `reason_${Date.now()}`,
      strategy,
      problem,
      language: input.language?.trim() || null,
      steps,
      answer,
      branches,
      selectedTools,
      retrieved: Boolean(contextBlock),
      provider,
      model: modelUsed,
      usage: { total_tokens: totalTokens, calls },
      honesty: {
        customReasonerKernel: false,
        toolExecution: false,
        fullTreeOfThought: strategy === 'tree_of_thought' ? false : undefined,
      },
      note: 'LLM-gateway reasoning (VL-186). Not a proprietary symbolic reasoner OS.',
    };
  }

  async analytics(organizationId: string, workspaceId: string) {
    const start = new Date();
    start.setUTCDate(1);
    start.setUTCHours(0, 0, 0, 0);
    const [reasons, chatUsage] = await Promise.all([
      this.prisma.auditEvent.count({
        where: {
          organizationId,
          action: 'reasoning_cloud.reasoned',
          createdAt: { gte: start },
        },
      }),
      this.usage.summary(organizationId),
    ]);
    return {
      periodStart: start.toISOString(),
      reasonRequests: reasons,
      chatTokens: chatUsage.chat.tokens,
      workspaceId,
      note: 'Reasoning Cloud analytics (VL-186). Tokens shared with chat metering.',
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
      reasonRequests: analytics.reasonRequests,
      customReasonerKernel: engine.honesty.customReasonerKernel,
      agentOs: engine.honesty.agentOs,
      deferred: engine.capabilities.filter((c) => c.status === 'deferred').map((c) => c.id),
      note: 'Reasoning Cloud monitoring snapshot (VL-186).',
    };
  }
}
