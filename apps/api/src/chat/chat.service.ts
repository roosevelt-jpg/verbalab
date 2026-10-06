import { HttpStatus, Injectable } from '@nestjs/common';
import { GatewayService } from '../gateway/gateway.service';
import { UsageService } from '../usage/usage.service';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { TranslateService } from '../translate/translate.service';
import { ApiException } from '../common/errors/api-exception';
import { ChatMessage, ChatRole } from '../gateway/chat-provider';
import { PromptsService } from '../prompts/prompts.service';

export { LUGEMI_CHAT_SYSTEM } from './chat-prompt';
export function chatMaxMessages(): number {
  const raw = Number(process.env.CHAT_MAX_MESSAGES ?? 40);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 40;
}

export function chatMaxMessageChars(): number {
  const raw = Number(process.env.CHAT_MAX_MESSAGE_CHARS ?? 8_000);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 8_000;
}

@Injectable()
export class ChatService {
  constructor(
    private readonly gateway: GatewayService,
    private readonly usage: UsageService,
    private readonly audit: AuditService,
    private readonly prisma: PrismaService,
    private readonly translate: TranslateService,
    private readonly prompts: PromptsService,
  ) {}

  private normalizeMessages(raw: unknown): ChatMessage[] {
    if (!Array.isArray(raw) || raw.length === 0) {
      throw new ApiException('validation_error', 'messages must be a non-empty array', HttpStatus.BAD_REQUEST);
    }

    const maxMessages = chatMaxMessages();
    if (raw.length > maxMessages) {
      throw new ApiException(
        'validation_error',
        `messages exceeds maximum of ${maxMessages}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const maxChars = chatMaxMessageChars();
    const allowed: ChatRole[] = ['user', 'assistant', 'system'];
    const messages: ChatMessage[] = [];

    for (const item of raw) {
      if (!item || typeof item !== 'object') {
        throw new ApiException('validation_error', 'each message must be an object', HttpStatus.BAD_REQUEST);
      }
      const role = (item as { role?: unknown }).role;
      const content = (item as { content?: unknown }).content;
      if (typeof role !== 'string' || !allowed.includes(role as ChatRole)) {
        throw new ApiException(
          'validation_error',
          'message.role must be user, assistant, or system',
          HttpStatus.BAD_REQUEST,
        );
      }
      if (typeof content !== 'string' || content.trim().length === 0) {
        throw new ApiException(
          'validation_error',
          'message.content must be a non-empty string',
          HttpStatus.BAD_REQUEST,
        );
      }
      if ([...content].length > maxChars) {
        throw new ApiException(
          'validation_error',
          `message.content exceeds ${maxChars} characters`,
          HttpStatus.BAD_REQUEST,
        );
      }
      messages.push({ role: role as ChatRole, content });
    }

    if (!messages.some((m) => m.role === 'user')) {
      throw new ApiException('validation_error', 'at least one user message is required', HttpStatus.BAD_REQUEST);
    }

    return messages;
  }

  async completions(input: {
    messages: unknown;
    model?: string;
    /** Optional: translate the assistant reply into this registry language. */
    translateReplyTo?: string;
    organizationId: string;
    workspaceId: string;
    apiKeyId?: string;
    userId?: string;
    ip?: string;
  }) {
    const clientMessages = this.normalizeMessages(input.messages);
    // Drop client system prompts; use workspace-managed or code fallback persona.
    const conversation = clientMessages.filter((m) => m.role !== 'system');
    const system = await this.prompts.resolve({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      key: 'chat',
    });
    const messages: ChatMessage[] = [
      { role: 'system', content: system.body },
      ...conversation,
    ];

    if (input.model !== undefined && (typeof input.model !== 'string' || !input.model.trim())) {
      throw new ApiException('validation_error', 'model must be a non-empty string', HttpStatus.BAD_REQUEST);
    }

    const result = await this.gateway.chat({
      messages,
      model: input.model?.trim() || undefined,
    });

    let reply = result.message.content;
    let translated = false;
    let translateProvider: string | null = null;

    if (input.translateReplyTo) {
      const mt = await this.translate.translate({
        text: reply,
        source: 'auto',
        target: input.translateReplyTo,
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        apiKeyId: input.apiKeyId,
        userId: input.userId,
        ip: input.ip,
        skipReview: true,
      });
      reply = mt.text;
      translated = true;
      translateProvider = mt.provider;
    }

    await this.usage.recordChat({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      apiKeyId: input.apiKeyId,
      tokens: Math.max(1, result.totalTokens || [...reply].length),
      provider: result.provider,
    });

    let apiKeyPrefix: string | undefined;
    if (input.apiKeyId) {
      const key = await this.prisma.apiKey.findUnique({ where: { id: input.apiKeyId } });
      apiKeyPrefix = key?.prefix;
    }

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'chat.completed',
      route: 'POST /v1/chat/completions',
      ip: input.ip,
      apiKeyPrefix,
      metadata: {
        provider: result.provider,
        model: result.model,
        promptTokens: result.promptTokens,
        completionTokens: result.completionTokens,
        totalTokens: result.totalTokens,
        latencyMs: result.latencyMs,
        translated,
        translateReplyTo: input.translateReplyTo ?? null,
        translateProvider,
      },
    });

    return {
      id: `chatcmpl_${Date.now()}`,
      object: 'chat.completion',
      model: result.model,
      provider: result.provider,
      choices: [
        {
          index: 0,
          message: { role: 'assistant' as const, content: reply },
          finish_reason: 'stop',
        },
      ],
      usage: {
        prompt_tokens: result.promptTokens,
        completion_tokens: result.completionTokens,
        total_tokens: result.totalTokens,
      },
      translated,
      translateReplyTo: input.translateReplyTo ?? null,
    };
  }
}
