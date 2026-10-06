import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { GatewayService } from '../gateway/gateway.service';
import { ApiException } from '../common/errors/api-exception';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { UsageService } from '../usage/usage.service';
import {
  applyGrammarRules,
  applySpellRules,
  GrammarIssue,
  GrammarIssueSeverity,
  GrammarIssueType,
} from './grammar-rules';
import { grammarIntelligenceCatalog } from './grammar-intelligence.catalog';
import { StyleService } from '../style/style.service';
import { isStyleProfileId } from '../style/style-profiles';

const MAX_CHARS = 12_000;

@Injectable()
export class GrammarService {
  private readonly logger = new Logger(GrammarService.name);

  constructor(
    private readonly gateway: GatewayService,
    private readonly audit: AuditService,
    private readonly prisma: PrismaService,
    private readonly usage: UsageService,
    private readonly style: StyleService,
  ) {}

  intelligence() {
    return grammarIntelligenceCatalog();
  }

  async spell(input: {
    text: string;
    language?: string;
    organizationId: string;
    workspaceId: string;
    userId?: string;
    apiKeyId?: string;
    ip?: string;
  }) {
    const text = input.text.trim();
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

    let language = input.language?.trim().toLowerCase() || 'en';
    if (!input.language?.trim()) {
      const detected = await this.gateway.detect({ text });
      language = detected.language;
    }

    const rules = applySpellRules(text);
    const result = {
      language,
      original: text,
      corrected: rules.corrected,
      changed: rules.corrected !== text,
      issues: rules.issues,
      issueCount: rules.issues.length,
      provider: 'rules' as const,
      note: 'Curated misspelling list only — not a full dictionary or Grammarly spell engine.',
    };

    await this.recordAudit(
      { ...input, route: 'POST /v1/grammar/spell', action: 'grammar.spell' },
      {
        language: result.language,
        provider: result.provider,
        issueCount: result.issueCount,
        changed: result.changed,
      },
    );
    return result;
  }

  async correct(input: {
    text: string;
    language?: string;
    organizationId: string;
    workspaceId: string;
    userId?: string;
    apiKeyId?: string;
    ip?: string;
  }) {
    const full = await this.check(input);
    return {
      language: full.language,
      original: full.original,
      corrected: full.corrected,
      changed: full.changed,
      issueCount: full.issueCount,
      provider: full.provider,
      model: full.model,
      note: 'Sentence correction via grammar pipeline.',
    };
  }

  async suggest(input: {
    text: string;
    language?: string;
    styleProfile?: string;
    organizationId: string;
    workspaceId: string;
    userId?: string;
    apiKeyId?: string;
    ip?: string;
  }) {
    const grammar = await this.check(input);
    const profile =
      input.styleProfile && isStyleProfileId(input.styleProfile)
        ? input.styleProfile
        : 'professional';

    const style = await this.style.rewrite({
      text: grammar.corrected,
      profile,
      language: grammar.language,
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      userId: input.userId,
      apiKeyId: input.apiKeyId,
      ip: input.ip,
    });

    const suggestions = [
      ...grammar.issues.map((i) => ({
        kind: 'grammar' as const,
        type: i.type,
        severity: i.severity,
        message: i.message,
        original: i.original,
        suggestion: i.suggestion,
      })),
      ...style.changes.map((c) => ({
        kind: 'style' as const,
        type: c.type,
        severity: 'suggestion' as const,
        message: c.message,
        original: c.original,
        suggestion: c.suggestion,
      })),
    ];

    return {
      language: grammar.language,
      original: grammar.original,
      grammarCorrected: grammar.corrected,
      styleRewritten: style.rewritten,
      styleProfile: profile,
      styleDisclaimer: style.disclaimer ?? null,
      changed: grammar.changed || style.changed,
      suggestions,
      suggestionCount: suggestions.length,
      providers: { grammar: grammar.provider, style: style.provider },
      note: 'Combined grammar + style writing suggestions. Domain profiles are tone-only.',
    };
  }

  async analytics(organizationId: string) {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [checks, spells, styles] = await Promise.all([
      this.prisma.auditEvent.count({
        where: {
          organizationId,
          action: 'grammar.check',
          createdAt: { gte: since },
        },
      }),
      this.prisma.auditEvent.count({
        where: {
          organizationId,
          action: 'grammar.spell',
          createdAt: { gte: since },
        },
      }),
      this.prisma.auditEvent.count({
        where: {
          organizationId,
          action: 'style.rewrite',
          createdAt: { gte: since },
        },
      }),
    ]);

    return {
      windowDays: 30,
      grammarChecks: checks,
      spellChecks: spells,
      styleRewrites: styles,
      note: 'Org audit-derived Grammar Intelligence usage — not a writing-quality scoreboard.',
    };
  }

  async check(input: {
    text: string;
    language?: string;
    organizationId: string;
    workspaceId: string;
    userId?: string;
    apiKeyId?: string;
    ip?: string;
  }) {
    const text = input.text.trim();
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

    let language = input.language?.trim().toLowerCase() || '';
    let languageProvider = 'hint';
    let languageConfidence = 1;
    if (!language) {
      const detected = await this.gateway.detect({ text });
      language = detected.language;
      languageProvider = detected.provider;
      languageConfidence = detected.confidence;
    }

    const rules = applyGrammarRules(text);
    let corrected = rules.corrected;
    let issues = [...rules.issues];
    let provider: 'rules' | 'llm' | 'rules+llm' = 'rules';
    let model: string | null = null;

    if (process.env.OPENAI_API_KEY?.trim()) {
      const llm = await this.assistWithLlm(text, language);
      if (llm) {
        model = llm.model;
        provider = issues.length > 0 ? 'rules+llm' : 'llm';
        if (llm.corrected.trim()) corrected = llm.corrected.trim();
        if (llm.issues.length > 0) {
          issues = this.mergeIssues(issues, llm.issues);
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

    const note =
      provider === 'rules'
        ? language === 'en' || language.startsWith('en')
          ? 'Deterministic English-leaning rules only — not a full grammar engine. Set OPENAI_API_KEY for LLM assist.'
          : `Rules-only pass for language "${language}" (English-leaning heuristics). Set OPENAI_API_KEY for broader LLM assist.`
        : 'LLM-assisted grammar check with deterministic rules baseline. Not Grammarly parity.';

    const result = {
      language,
      languageConfidence,
      languageProvider,
      original: text,
      corrected,
      changed: corrected !== text,
      issues,
      issueCount: issues.length,
      provider,
      model,
      note,
    };

    await this.recordAudit(input, result);
    return result;
  }

  private mergeIssues(base: GrammarIssue[], extra: GrammarIssue[]): GrammarIssue[] {
    const keys = new Set(
      base.map((i) => `${i.type}|${i.original ?? ''}|${i.suggestion ?? ''}|${i.message}`),
    );
    const out = [...base];
    for (const issue of extra) {
      const key = `${issue.type}|${issue.original ?? ''}|${issue.suggestion ?? ''}|${issue.message}`;
      if (keys.has(key)) continue;
      keys.add(key);
      out.push(issue);
    }
    return out;
  }

  private async assistWithLlm(
    text: string,
    language: string,
  ): Promise<{
    corrected: string;
    issues: GrammarIssue[];
    model: string;
    provider: string;
    totalTokens: number;
  } | null> {
    try {
      const out = await this.gateway.chat({
        messages: [
          {
            role: 'system',
            content:
              'You are a careful grammar and spelling checker. Reply with ONLY valid JSON: {"corrected":"...","issues":[{"type":"spelling|grammar|punctuation|spacing|capitalization|style|other","severity":"error|warning|suggestion","message":"...","original":"...","suggestion":"..."}]}. Preserve meaning and language. Do not invent vertical writing products.',
          },
          {
            role: 'user',
            content: `Language: ${language}\n\nText:\n${text.slice(0, MAX_CHARS)}`,
          },
        ],
        model: process.env.OPENAI_CHAT_MODEL ?? 'gpt-4o-mini',
      });

      const parsed = this.parseLlmJson(out.message.content);
      if (!parsed) return null;
      return {
        corrected: parsed.corrected,
        issues: parsed.issues,
        model: out.model,
        provider: out.provider,
        totalTokens: out.totalTokens || 1,
      };
    } catch (error) {
      this.logger.warn(
        JSON.stringify({
          event: 'grammar.llm_failed',
          reason: error instanceof Error ? error.message : 'llm failed',
        }),
      );
      return null;
    }
  }

  private parseLlmJson(content: string): { corrected: string; issues: GrammarIssue[] } | null {
    const start = content.indexOf('{');
    const end = content.lastIndexOf('}');
    if (start < 0 || end <= start) return null;
    try {
      const raw = JSON.parse(content.slice(start, end + 1)) as {
        corrected?: unknown;
        issues?: unknown;
      };
      if (typeof raw.corrected !== 'string') return null;
      const issues: GrammarIssue[] = [];
      if (Array.isArray(raw.issues)) {
        for (const item of raw.issues) {
          if (!item || typeof item !== 'object') continue;
          const row = item as Record<string, unknown>;
          const type = this.asIssueType(row.type);
          const severity = this.asSeverity(row.severity);
          if (typeof row.message !== 'string' || !row.message.trim()) continue;
          issues.push({
            type,
            severity,
            message: row.message.trim(),
            original: typeof row.original === 'string' ? row.original : undefined,
            suggestion: typeof row.suggestion === 'string' ? row.suggestion : undefined,
          });
        }
      }
      return { corrected: raw.corrected, issues };
    } catch {
      return null;
    }
  }

  private asIssueType(value: unknown): GrammarIssueType {
    const allowed: GrammarIssueType[] = [
      'spelling',
      'grammar',
      'punctuation',
      'spacing',
      'capitalization',
      'style',
      'other',
    ];
    return typeof value === 'string' && allowed.includes(value as GrammarIssueType)
      ? (value as GrammarIssueType)
      : 'other';
  }

  private asSeverity(value: unknown): GrammarIssueSeverity {
    const allowed: GrammarIssueSeverity[] = ['error', 'warning', 'suggestion'];
    return typeof value === 'string' && allowed.includes(value as GrammarIssueSeverity)
      ? (value as GrammarIssueSeverity)
      : 'warning';
  }

  private async recordAudit(
    input: {
      organizationId: string;
      userId?: string;
      apiKeyId?: string;
      ip?: string;
      route?: string;
      action?: string;
    },
    result: {
      language: string;
      provider: string;
      issueCount: number;
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
      action: input.action ?? 'grammar.check',
      route: input.route ?? 'POST /v1/grammar/check',
      ip: input.ip,
      apiKeyPrefix,
      metadata: {
        language: result.language,
        provider: result.provider,
        issueCount: result.issueCount,
        changed: result.changed,
      },
    });
  }
}
