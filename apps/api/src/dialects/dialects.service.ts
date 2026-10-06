import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GatewayService } from '../gateway/gateway.service';
import { ApiException } from '../common/errors/api-exception';
import { AuditService } from '../audit/audit.service';
import { LanguagesService } from '../languages/languages.service';
import { DIALECT_SEEDS } from './dialect-seeds';
import { dialectEngineCatalog } from './dialect-engine.catalog';

export type DialectScore = {
  code: string;
  nameEn: string;
  languageCode: string;
  score: number;
  matchedCues: string[];
};

@Injectable()
export class DialectsService implements OnModuleInit {
  private readonly logger = new Logger(DialectsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: GatewayService,
    private readonly audit: AuditService,
    /** Ensures language registry seeds before dialect FK upserts. */
    private readonly languages: LanguagesService,
  ) {}

  async onModuleInit() {
    await this.languages.seed();
    await this.seed();
  }

  engine() {
    return dialectEngineCatalog();
  }

  async seed() {
    let seeded = 0;
    for (const d of DIALECT_SEEDS) {
      const language = await this.prisma.language.findUnique({ where: { code: d.languageCode } });
      if (!language) continue;
      seeded += 1;
      await this.prisma.dialect.upsert({
        where: { code: d.code },
        create: {
          code: d.code,
          languageCode: d.languageCode,
          nameEn: d.nameEn,
          nameNative: d.nameNative,
          region: d.region,
          cueTerms: d.cueTerms,
          notes: d.notes,
        },
        update: {
          languageCode: d.languageCode,
          nameEn: d.nameEn,
          nameNative: d.nameNative,
          region: d.region,
          cueTerms: d.cueTerms,
          notes: d.notes,
        },
      });
    }
    this.logger.log(
      JSON.stringify({ event: 'dialects.seeded', count: seeded }),
    );
  }

  async list(languageCode?: string) {
    const rows = await this.prisma.dialect.findMany({
      where: languageCode ? { languageCode } : undefined,
      orderBy: [{ languageCode: 'asc' }, { code: 'asc' }],
    });
    return {
      data: rows.map((r) => this.toDto(r)),
      note: 'Curated registry — not unlimited dialect coverage.',
    };
  }

  async get(code: string) {
    const row = await this.prisma.dialect.findUnique({ where: { code } });
    if (!row) {
      throw new ApiException('not_found', 'Dialect not found', HttpStatus.NOT_FOUND);
    }
    return this.toDto(row);
  }

  async detect(input: {
    text: string;
    language?: string;
    organizationId: string;
    userId?: string;
    apiKeyId?: string;
    ip?: string;
  }) {
    const text = input.text.trim();
    if (!text) {
      throw new ApiException('validation_error', 'text is required', HttpStatus.BAD_REQUEST);
    }

    let language = input.language?.trim().toLowerCase() || '';
    let languageConfidence = 1;
    let languageProvider = 'hint';

    if (!language) {
      const detected = await this.gateway.detect({ text });
      language = detected.language;
      languageConfidence = detected.confidence;
      languageProvider = detected.provider;
    }

    const dialects = await this.prisma.dialect.findMany({
      where: { languageCode: language },
    });

    if (dialects.length === 0) {
      const result = {
        language,
        languageConfidence,
        languageProvider,
        dialect: null as string | null,
        dialectName: null as string | null,
        confidence: 0,
        provider: 'none',
        candidates: [] as DialectScore[],
        note: `No curated dialects for language "${language}" yet.`,
      };
      await this.recordAudit(input, result);
      return result;
    }

    const scored = dialects
      .map((d) => this.scoreDialect(text, d))
      .sort((a, b) => b.score - a.score);

    const best = scored[0];
    const second = scored[1]?.score ?? 0;
    const margin = best.score - second;

    let dialect: string | null = null;
    let dialectName: string | null = null;
    let confidence = best.score;
    let provider = 'cues';

    // Require a real cue hit and separation from runner-up.
    if (best.score >= 0.15 && (scored.length === 1 || margin >= 0.05 || best.score >= 0.35)) {
      dialect = best.code;
      dialectName = best.nameEn;
    }

    // Optional LLM assist when cues are weak but language has multiple dialects.
    if (!dialect && scored.length > 1 && process.env.OPENAI_API_KEY?.trim()) {
      const assisted = await this.assistWithLlm(text, language, scored.slice(0, 5));
      if (assisted) {
        dialect = assisted.code;
        dialectName = assisted.nameEn;
        confidence = Math.max(0.4, assisted.score);
        provider = 'llm_assisted';
      }
    }

    const result = {
      language,
      languageConfidence,
      languageProvider,
      dialect,
      dialectName,
      confidence: Number(confidence.toFixed(4)),
      provider,
      candidates: scored.slice(0, 5),
      note:
        dialect == null
          ? 'No dialect selected with sufficient confidence — see candidates.'
          : 'Dialect labels are registry-bound heuristics; not speech accent detection.',
    };

    await this.recordAudit(input, result);
    return result;
  }

  private toDto(row: {
    id: string;
    code: string;
    languageCode: string;
    nameEn: string;
    nameNative: string | null;
    region: string | null;
    cueTerms: unknown;
    notes: string | null;
  }) {
    return {
      id: row.id,
      code: row.code,
      languageCode: row.languageCode,
      nameEn: row.nameEn,
      nameNative: row.nameNative,
      region: row.region,
      cueTerms: Array.isArray(row.cueTerms) ? (row.cueTerms as string[]) : [],
      notes: row.notes,
    };
  }

  private scoreDialect(
    text: string,
    row: { code: string; nameEn: string; languageCode: string; cueTerms: unknown },
  ): DialectScore {
    const cues = Array.isArray(row.cueTerms) ? (row.cueTerms as string[]) : [];
    const normalized = this.normalize(text);
    const matched: string[] = [];
    for (const cue of cues) {
      const c = this.normalize(cue);
      if (c && normalized.includes(c)) matched.push(cue);
    }
    const score = cues.length === 0 ? 0 : matched.length / cues.length;
    return {
      code: row.code,
      nameEn: row.nameEn,
      languageCode: row.languageCode,
      score: Number(score.toFixed(4)),
      matchedCues: matched,
    };
  }

  private normalize(value: string) {
    return value
      .toLowerCase()
      .normalize('NFKD')
      .replace(/\p{M}/gu, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private async assistWithLlm(
    text: string,
    language: string,
    candidates: DialectScore[],
  ): Promise<DialectScore | null> {
    try {
      const catalog = candidates
        .map((c) => `${c.code}: ${c.nameEn}`)
        .join('\n');
      const out = await this.gateway.chat({
        messages: [
          {
            role: 'system',
            content:
              'You classify text into one dialect code from the provided list. Reply with ONLY the dialect code, or NONE.',
          },
          {
            role: 'user',
            content: `Language: ${language}\nDialects:\n${catalog}\n\nText:\n${text.slice(0, 1500)}`,
          },
        ],
        model: process.env.OPENAI_CHAT_MODEL ?? 'gpt-4o-mini',
      });
      const raw = out.message.content.trim().split(/\s+/)[0]?.replace(/[^a-z0-9-]/gi, '');
      if (!raw || raw.toUpperCase() === 'NONE') return null;
      const hit = candidates.find((c) => c.code === raw.toLowerCase());
      return hit ?? null;
    } catch (error) {
      this.logger.warn(
        JSON.stringify({
          event: 'dialects.llm_assist_failed',
          reason: error instanceof Error ? error.message : 'assist failed',
        }),
      );
      return null;
    }
  }

  private async recordAudit(
    input: {
      organizationId: string;
      userId?: string;
      apiKeyId?: string;
      ip?: string;
    },
    result: { language: string; dialect: string | null; provider: string; confidence: number },
  ) {
    let apiKeyPrefix: string | undefined;
    if (input.apiKeyId) {
      const key = await this.prisma.apiKey.findUnique({ where: { id: input.apiKeyId } });
      apiKeyPrefix = key?.prefix ?? undefined;
    }
    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'dialect.detect',
      route: 'POST /v1/dialects/detect',
      ip: input.ip,
      apiKeyPrefix,
      metadata: {
        language: result.language,
        dialect: result.dialect,
        provider: result.provider,
        confidence: result.confidence,
      },
    });
  }
}
