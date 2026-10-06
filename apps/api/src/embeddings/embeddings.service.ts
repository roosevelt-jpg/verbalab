import { HttpStatus, Injectable } from '@nestjs/common';
import { GatewayService } from '../gateway/gateway.service';
import { UsageService } from '../usage/usage.service';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { ApiException } from '../common/errors/api-exception';

export function embeddingsMaxInputs(): number {
  const raw = Number(process.env.EMBEDDINGS_MAX_INPUTS ?? 64);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 64;
}

export function embeddingsMaxChars(): number {
  const raw = Number(process.env.EMBEDDINGS_MAX_CHARS ?? 8_000);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 8_000;
}

@Injectable()
export class EmbeddingsService {
  constructor(
    private readonly gateway: GatewayService,
    private readonly usage: UsageService,
    private readonly audit: AuditService,
    private readonly prisma: PrismaService,
  ) {}

  private normalizeInput(raw: unknown): string[] {
    const texts: string[] = [];
    if (typeof raw === 'string') {
      texts.push(raw);
    } else if (Array.isArray(raw)) {
      for (const item of raw) {
        if (typeof item !== 'string') {
          throw new ApiException(
            'validation_error',
            'input array items must be strings',
            HttpStatus.BAD_REQUEST,
          );
        }
        texts.push(item);
      }
    } else {
      throw new ApiException(
        'validation_error',
        'input must be a string or string array',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (texts.length === 0) {
      throw new ApiException('validation_error', 'input is required', HttpStatus.BAD_REQUEST);
    }

    const maxInputs = embeddingsMaxInputs();
    if (texts.length > maxInputs) {
      throw new ApiException(
        'validation_error',
        `input exceeds maximum of ${maxInputs} texts`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const maxChars = embeddingsMaxChars();
    for (const text of texts) {
      if (text.trim().length === 0) {
        throw new ApiException(
          'validation_error',
          'input texts must be non-empty',
          HttpStatus.BAD_REQUEST,
        );
      }
      if ([...text].length > maxChars) {
        throw new ApiException(
          'validation_error',
          `each input text must be ≤ ${maxChars} characters`,
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    return texts;
  }

  async create(input: {
    input: unknown;
    model?: string;
    organizationId: string;
    workspaceId: string;
    apiKeyId?: string;
    userId?: string;
    ip?: string;
  }) {
    const texts = this.normalizeInput(input.input);
    if (input.model !== undefined && (typeof input.model !== 'string' || !input.model.trim())) {
      throw new ApiException('validation_error', 'model must be a non-empty string', HttpStatus.BAD_REQUEST);
    }

    const result = await this.gateway.embed({
      input: texts.length === 1 ? texts[0]! : texts,
      model: input.model?.trim() || undefined,
    });

    const tokens = Math.max(1, result.totalTokens || texts.reduce((sum, t) => sum + [...t].length, 0));
    await this.usage.recordEmbeddings({
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      apiKeyId: input.apiKeyId,
      tokens,
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
      action: 'embeddings.created',
      route: 'POST /v1/embeddings',
      ip: input.ip,
      apiKeyPrefix,
      metadata: {
        provider: result.provider,
        model: result.model,
        inputs: texts.length,
        dimensions: result.data[0]?.embedding.length ?? 0,
        promptTokens: result.promptTokens,
        totalTokens: result.totalTokens,
        latencyMs: result.latencyMs,
      },
    });

    return {
      object: 'list' as const,
      data: result.data.map((item) => ({
        object: 'embedding' as const,
        index: item.index,
        embedding: item.embedding,
      })),
      model: result.model,
      provider: result.provider,
      usage: {
        prompt_tokens: result.promptTokens,
        total_tokens: result.totalTokens,
      },
    };
  }
}
