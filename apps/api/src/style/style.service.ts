import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { GatewayService } from '../gateway/gateway.service';
import { ApiException } from '../common/errors/api-exception';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { UsageService } from '../usage/usage.service';
import { styleIntelligenceCatalog } from './style-intelligence.catalog';
import {
  applyStyleRules,
  detectTone,
  isStyleProfileId,
  STYLE_PROFILES,
  StyleChange,
  StyleProfileId,
} from './style-profiles';

const MAX_CHARS = 12_000;

@Injectable
export class StyleService {
  private readonly logger = new Logger(StyleService.name);

  constructor(
    private readonly gateway: GatewayService,
    private readonly audit: AuditService,
    private readonly prisma: PrismaService,
    private readonly usage: UsageService,
  ) {}

  intelligence {
    return styleIntelligenceCatalog;
  }

  profiles {
    return {
      data: STYLE_PROFILES,
      note:
        'Bounded style profiles. Domain tones include disclaimers — not certified vertical writing products.',
    };
  }

  async analytics(organizationId: string) {
    const since = new Date(Date.now - 30 * 24 * 60 * 60 * 1000);
    const [rewrites, detects, transforms, transfers] = await Promise.all([
      this.prisma.auditEvent.count({
        where: { organizationId, action: 'style.rewrite', createdAt: { gte: since } },
      }),
      this.prisma.auditEvent.count({
        where: { organizationId, action: 'style.detect', createdAt: { gte: since } },
      }),
      this.prisma.auditEvent.count({
        where: { organizationId, action: 'style.transform', createdAt: { gte: since } },
      }),
      this.prisma.auditEvent.count({
        where: { organizationId, action: 'style.transfer', createdAt: { gte: since } },
      }),
    ]);

    return {
      windowDays: 30,
      rewrites,
      toneDetections: detects,
      toneTransforms: transforms,
      styleTransfers: transfers,
      note: 'Org audit-derived Style Intelligence usage — not a brand-voice quality scoreboard.',
    };
  }

  async detect(input: {
    text: string;
    organizationId: string;
    userId?: string;
    apiKeyId?: string;
    ip?: string;
  }) {
    const text = this.requireText(input.text);
    const result = detectTone(text);

    await this.recordAudit(
      {
        organizationId: input.organizationId,
        userId: input.userId,
        apiKeyId: input.apiKeyId,
        ip: input.ip,
        action: 'style.detect',
        route: 'POST /v1/style/detect',
      },
      {
        language: null,
        profile: result.detectedTone,
        provider: 'rules',
        changeCount: result.signals.length,
        changed: false,
      },
    );

    return {
      ...result,
      original: text,
      provider: 'rules' as const,
    };
  }

  async transform(input: {
    text: string;
    targetTone: string;
    language?: string;
    organizationId: string;
    workspaceId: string;
    userId?: string;
    apiKeyId?: string;
    ip?: string;
  }) {
    const rewrite = await this.rewrite({
      ...input,
      profile: input.targetTone,
      auditAction: 'style.transform',
      auditRoute: 'POST /v1/style/transform',
    });
    return {
      ...rewrite,
      targetTone: rewrite.profile,
      operation: 'tone_transformation' as const,
    };
  }

  async transfer(input: {
    text: string;
    targetProfile: string;
    language?: string;
    organizationId: string;
    workspaceId: string;
    userId?: string;
    apiKeyId?: string;
    ip?: string;
  }) {
    const text = this.requireText(input.text);
    const source = detectTone(text);
    const rewrite = await this.rewrite({
      text,
      profile: input.targetProfile,
      language: input.language,
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      userId: input.userId,
      apiKeyId: input.apiKeyId,
      ip: input.ip,
      auditAction: 'style.transfer',
      auditRoute: 'POST /v1/style/transfer',
    });

    return {
      ...rewrite,
      sourceTone: source.detectedTone,
      sourceConfidence: source.confidence,
      sourceSignals: source.signals.slice(0, 12),
      targetProfile: rewrite.profile,
      operation: 'style_transfer' as const,
      note: `${rewrite.note} Style transfer detects source tone then rewrites to the target profile — not author cloning.`,
    };
  }

  async rewrite(input: {
    text: string;
    profile: string;
    language?: string;
    organizationId: string;
    workspaceId: string;
    userId?: string;
    apiKeyId?: string;
    ip?: string;
    auditAction?: string;
    auditRoute?: string;
  }) {
    const text = this.requireText(input.text);
    if (!isStyleProfileId(input.profile)) {
      throw new ApiException(
        'validation_error',
        `profile must be one of: ${STYLE_PROFILES.map((p) => p.id).join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    const profile = input.profile as StyleProfileId;

    let language = input.language?.trim.toLowerCase || '';
    let languageProvider = 'hint';
    let languageConfidence = 1;
    if (!language) {
      const detected = await this.gateway.detect({ text });
      language = detected.language;
      languageProvider = detected.provider;
      languageConfidence = detected.confidence;
    }

    const rules = applyStyleRules(text, profile);
    let rewritten = rules.rewritten;
    let changes = [...rules.changes];
    let provider: 'rules' | 'llm' | 'rules+llm' = 'rules';
    let model: string | null = null;

    if (process.env.OPENAI_API_KEY?.trim) {
      const llm = await this.assistWithLlm(text, profile, language);
      if (llm) {
        model = llm.model;
        provider = changes.length > 0 ? 'rules+llm' : 'llm';
        if (llm.rewritten.trim) rewritten = llm.rewritten.trim;
        if (llm.changes.length > 0) {
          changes = this.mergeChanges(changes, llm.changes);
        }
        await this.usage.recordChat({
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
          apiKeyId: input.apiKeyId,
          tokens: Math.max(1, llm.totalTokens),
          provider: llm.provider,
        });
      }
    }

    const profileMeta = STYLE_PROFILES.find((p) => p.id === profile)!;
    const result = {
      language,
      languageConfidence,
      languageProvider,
      profile,
      profileName: profileMeta.name,
      domain: profileMeta.domain ?? 'general',
      disclaimer: profileMeta.disclaimer ?? null,
      original: text,
      rewritten,
      changed: rewritten !== text,
      changes,
      changeCount: changes.length,
      provider,
      model,
      note: profileMeta.disclaimer
        ? `${profileMeta.disclaimer} ${
            provider === 'rules'
              ? 'Deterministic tone transforms only.'
              : 'LLM-assisted tone rewrite with deterministic baseline.'
          }`
        : provider === 'rules'
          ? 'Deterministic English-leaning style transforms — not a full style-transfer product. Set OPENAI_API_KEY for LLM rewrite.'
          : 'LLM-assisted rewrite with deterministic baseline. Not a vertical writing OS.',
    };

    await this.recordAudit(
      {
        organizationId: input.organizationId,
        userId: input.userId,
        apiKeyId: input.apiKeyId,
        ip: input.ip,
        action: input.auditAction ?? 'style.rewrite',
        route: input.auditRoute ?? 'POST /v1/style/rewrite',
      },
      {
        language: result.language,
        profile: result.profile,
        provider: result.provider,
        changeCount: result.changeCount,
        changed: result.changed,
      },
    );
    return result;
  }

  private requireText(raw: string) {
    const text = raw.trim;
    if (!text) {
      throw new ApiException('validation_error', 'text is required', HttpStatus.BAD_REQUEST);
    }
    if ([...text].length > MAX_CHARS) {
      throw new ApiException(
        'validation_error',
        `text exceeds maximum of ${MAX_CHARS} characters`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return text;
  }

  private mergeChanges(base: StyleChange[], extra: StyleChange[]): StyleChange[] {
    const keys = new Set(base.map((c) => `${c.type}|${c.original ?? ''}|${c.suggestion ?? ''}|${c.message}`));
    const out = [...base];
    for (const change of extra) {
      const key = `${change.type}|${change.original ?? ''}|${change.suggestion ?? ''}|${change.message}`;
      if (keys.has(key)) continue;
      keys.add(key);
      out.push(change);
    }
    return out;
  }

  private async assistWithLlm(
    text: string,
    profile: StyleProfileId,
    language: string,
  ): Promise<{
    rewritten: string;
    changes: StyleChange[];
    model: string;
    provider: string;
    totalTokens: number;
  } | null> {
    try {
      const profileMeta = STYLE_PROFILES.find((p) => p.id === profile)!;
      const out = await this.gateway.chat({
        messages: [
          {
            role: 'system',
            content:
              'You rewrite text to match a writing style profile. Reply with ONLY valid JSON: {"rewritten":"...","changes":[{"type":"formality|filler|contraction|spacing|other","message":"...","original":"...","suggestion":"..."}]}. Preserve meaning and language. Do not invent legal/medical claims.',
          },
          {
            role: 'user',
            content: `Language: ${language}\nProfile: ${profile} (${profileMeta.description})\n\nText:\n${text.slice(0, MAX_CHARS)}`,
          },
        ],
        model: process.env.OPENAI_CHAT_MODEL ?? 'gpt-4o-mini',
      });

      const parsed = this.parseLlmJson(out.message.content);
      if (!parsed) return null;
      return {
        rewritten: parsed.rewritten,
        changes: parsed.changes,
        model: out.model,
        provider: out.provider,
        totalTokens: out.totalTokens || 1,
      };
    } catch (error) {
      this.logger.warn(
        JSON.stringify({
          event: 'style.llm_failed',
          reason: error instanceof Error ? error.message : 'llm failed',
        }),
      );
      return null;
    }
  }

  private parseLlmJson(content: string): { rewritten: string; changes: StyleChange[] } | null {
    const start = content.indexOf('{');
    const end = content.lastIndexOf('}');
    if (start < 0 || end <= start) return null;
    try {
      const raw = JSON.parse(content.slice(start, end + 1)) as {
        rewritten?: unknown;
        changes?: unknown;
      };
      if (typeof raw.rewritten !== 'string') return null;
      const changes: StyleChange[] = [];
      if (Array.isArray(raw.changes)) {
        for (const item of raw.changes) {
          if (!item || typeof item !== 'object') continue;
          const row = item as Record<string, unknown>;
          if (typeof row.message !== 'string' || !row.message.trim) continue;
          const type =
            row.type === 'formality' ||
            row.type === 'filler' ||
            row.type === 'contraction' ||
            row.type === 'spacing' ||
            row.type === 'other'
              ? row.type
              : 'other';
          changes.push({
            type,
            message: row.message.trim,
            original: typeof row.original === 'string' ? row.original : undefined,
            suggestion: typeof row.suggestion === 'string' ? row.suggestion : undefined,
          });
        }
      }
      return { rewritten: raw.rewritten, changes };
    } catch {
      return null;
    }
  }

  private async recordAudit(
    input: {
      organizationId: string;
      userId?: string;
      apiKeyId?: string;
      ip?: string;
      action: string;
      route: string;
    },
    result: {
      language: string | null;
      profile: string;
      provider: string;
      changeCount: number;
      changed: boolean;
    },
  ) {
    let apiKeyPrefix: string | undefined;
    if (input.apiKeyId) {
      const key = await this.prisma.apiKey.findUnique({ where: { id: input.apiKeyId } });
      apiKeyPrefix = key?.prefix ?? undefined;
    }
    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: input.action,
      route: input.route,
      ip: input.ip,
      apiKeyPrefix,
      metadata: {
        language: result.language,
        profile: result.profile,
        provider: result.provider,
        changeCount: result.changeCount,
        changed: result.changed,
      },
    });
  }
}
