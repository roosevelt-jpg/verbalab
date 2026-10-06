import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GatewayService } from '../gateway/gateway.service';
import { ApiException } from '../common/errors/api-exception';
import { AuditService } from '../audit/audit.service';
import { LanguagesService } from '../languages/languages.service';
import { UsageService } from '../usage/usage.service';
import { AudioService } from '../audio/audio.service';
import { ACCENT_SEEDS } from './accent-seeds';
import { accentEngineCatalog, confidenceBand } from './accent-engine.catalog';

export type AccentScore = {
  code: string;
  nameEn: string;
  languageCode: string;
  score: number;
  matchedCues: string[];
};

@Injectable
export class AccentsService implements OnModuleInit {
  private readonly logger = new Logger(AccentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: GatewayService,
    private readonly audit: AuditService,
    private readonly languages: LanguagesService,
    private readonly usage: UsageService,
    private readonly audio: AudioService,
  ) {}

  async onModuleInit {
    await this.languages.seed;
    await this.seed;
  }

  async seed {
    for (const a of ACCENT_SEEDS) {
      await this.prisma.accent.upsert({
        where: { code: a.code },
        create: {
          code: a.code,
          languageCode: a.languageCode,
          nameEn: a.nameEn,
          nameNative: a.nameNative,
          region: a.region,
          relatedDialectCode: a.relatedDialectCode,
          cueTerms: a.cueTerms,
          notes: a.notes,
        },
        update: {
          languageCode: a.languageCode,
          nameEn: a.nameEn,
          nameNative: a.nameNative,
          region: a.region,
          relatedDialectCode: a.relatedDialectCode,
          cueTerms: a.cueTerms,
          notes: a.notes,
        },
      });
    }
    this.logger.log(JSON.stringify({ event: 'accents.seeded', count: ACCENT_SEEDS.length }));
  }

  async list(languageCode?: string) {
    const rows = await this.prisma.accent.findMany({
      where: languageCode ? { languageCode } : undefined,
      orderBy: [{ languageCode: 'asc' }, { code: 'asc' }],
    });
    return {
      data: rows.map((r) => this.toDto(r)),
      note: 'Curated spoken accent profiles — not acoustic phonetics ID.',
    };
  }

  async get(code: string) {
    const row = await this.prisma.accent.findUnique({ where: { code } });
    if (!row) {
      throw new ApiException('not_found', 'Accent not found', HttpStatus.NOT_FOUND);
    }
    return this.toDto(row);
  }

  engine {
    return accentEngineCatalog;
  }

  async analytics(organizationId: string) {
    const since = new Date(Date.now - 30 * 24 * 60 * 60 * 1000);
    const events = await this.prisma.auditEvent.findMany({
      where: {
        organizationId,
        action: { in: ['accent.detect', 'accent.classify'] },
        createdAt: { gte: since },
      },
      select: { action: true, metadata: true },
      take: 5000,
    });

    const detects = events.filter((e) => e.action === 'accent.detect').length;
    const classifies = events.filter((e) => e.action === 'accent.classify').length;
    const byAccent: Record<string, number> = {};
    const byInputMode: Record<string, number> = {};
    for (const e of events) {
      const meta = (e.metadata ?? {}) as Record<string, unknown>;
      const accent = typeof meta.accent === 'string' && meta.accent ? meta.accent : 'unknown';
      byAccent[accent] = (byAccent[accent] ?? 0) + 1;
      const mode = typeof meta.inputMode === 'string' ? meta.inputMode : 'unknown';
      byInputMode[mode] = (byInputMode[mode] ?? 0) + 1;
    }

    const profileCount = await this.prisma.accent.count;

    return {
      windowDays: 30,
      detects,
      classifies,
      total: detects + classifies,
      byAccent,
      byInputMode,
      registryProfiles: profileCount,
      note: 'Org audit-derived Accent Intelligence usage — not acoustic model quality metrics.',
    };
  }

  async classify(input: {
    text?: string;
    language?: string;
    file?: Express.Multer.File;
    organizationId: string;
    workspaceId: string;
    userId?: string;
    apiKeyId?: string;
    ip?: string;
  }) {
    const detected = await this.detect({ ...input, skipAudit: true });
    const band = confidenceBand(detected.confidence);
    const classification = {
      ...detected,
      classification: {
        label: detected.accent,
        name: detected.accentName,
        confidence: detected.confidence,
        confidenceBand: band,
        ranked: (detected.candidates ?? []).map(
          (
            c: {
              code: string;
              nameEn: string;
              languageCode: string;
              score: number;
              matchedCues: string[];
            },
            index: number,
          ) => ({
            rank: index + 1,
            code: c.code,
            nameEn: c.nameEn,
            languageCode: c.languageCode,
            score: c.score,
            matchedCues: c.matchedCues,
          }),
        ),
      },
      product: 'Accent Intelligence',
      note:
        band === 'none'
          ? 'No accent classified above threshold — cue scoring only. Not acoustic classification.'
          : `Accent classified with ${band} confidence via cue scoring. Not acoustic regional models.`,
    };

    await this.recordAudit(
      input,
      {
        language: detected.language,
        accent: detected.accent,
        provider: detected.provider,
        confidence: detected.confidence,
        inputMode: detected.inputMode,
      },
      'accent.classify',
      'POST /v1/accents/classify',
    );

    return classification;
  }

  async detect(input: {
    text?: string;
    language?: string;
    file?: Express.Multer.File;
    organizationId: string;
    workspaceId: string;
    userId?: string;
    apiKeyId?: string;
    ip?: string;
    skipAudit?: boolean;
  }) {
    let text = input.text?.trim ?? '';
    let stt:
      | {
          provider: string;
          durationSeconds: number;
          language?: string;
        }
      | undefined;

    if (input.file) {
      this.audio.assertAllowedAudio(input.file);
      const result = await this.gateway.transcribe({
        buffer: input.file.buffer,
        filename: input.file.originalname,
        mimeType: input.file.mimetype || 'application/octet-stream',
        language: input.language,
      });
      const durationSeconds = Math.max(1, Math.ceil(result.durationSeconds));
      await this.usage.recordStt({
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        apiKeyId: input.apiKeyId,
        seconds: durationSeconds,
        provider: result.provider,
      });
      text = result.text.trim;
      stt = {
        provider: result.provider,
        durationSeconds: result.durationSeconds,
        language: result.language,
      };
      if (!input.language && result.language) {
        input = { ...input, language: result.language };
      }
    }

    if (!text) {
      throw new ApiException(
        'validation_error',
        'text or audio file is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    let language = input.language?.trim.toLowerCase || '';
    let languageConfidence = 1;
    let languageProvider = 'hint';

    if (!language) {
      const detected = await this.gateway.detect({ text });
      language = detected.language;
      languageConfidence = detected.confidence;
      languageProvider = detected.provider;
    }

    const accents = await this.prisma.accent.findMany({
      where: { languageCode: language },
    });

    if (accents.length === 0) {
      const result = {
        language,
        languageConfidence,
        languageProvider,
        accent: null as string | null,
        accentName: null as string | null,
        confidence: 0,
        provider: 'none',
        inputMode: stt ? ('audio' as const) : ('text' as const),
        transcript: stt ? text : undefined,
        stt,
        candidates: [] as AccentScore[],
        note: `No curated accent profiles for language "${language}" yet. Not acoustic phonetics ID.`,
      };
      if (!input.skipAudit) {
        await this.recordAudit(input, result);
      }
      return result;
    }

    const scored = accents
      .map((a) => this.scoreAccent(text, a))
      .sort((a, b) => b.score - a.score);

    const best = scored[0]!;
    const second = scored[1]?.score ?? 0;
    const margin = best.score - second;

    let accent: string | null = null;
    let accentName: string | null = null;
    let confidence = best.score;
    let provider = stt ? 'stt_cues' : 'cues';

    if (best.score >= 0.15 && (scored.length === 1 || margin >= 0.05 || best.score >= 0.35)) {
      accent = best.code;
      accentName = best.nameEn;
    }

    if (!accent && scored.length > 1 && process.env.OPENAI_API_KEY?.trim) {
      const assisted = await this.assistWithLlm(text, language, scored.slice(0, 5));
      if (assisted) {
        accent = assisted.code;
        accentName = assisted.nameEn;
        confidence = Math.max(0.4, assisted.score);
        provider = stt ? 'stt_llm_assisted' : 'llm_assisted';
      }
    }

    const result = {
      language,
      languageConfidence,
      languageProvider,
      accent,
      accentName,
      confidence: Number(confidence.toFixed(4)),
      provider,
      inputMode: stt ? ('audio' as const) : ('text' as const),
      transcript: stt ? text : undefined,
      stt,
      candidates: scored.slice(0, 5),
      note:
        accent == null
          ? 'No accent profile selected with sufficient confidence — see candidates. Not acoustic phonetics ID.'
          : 'Spoken accent profile from transcript/text cues — not a dedicated acoustic accent classifier.',
    };

    if (!input.skipAudit) {
      await this.recordAudit(input, result);
    }
    return result;
  }

  private toDto(row: {
    id: string;
    code: string;
    languageCode: string;
    nameEn: string;
    nameNative: string | null;
    region: string | null;
    relatedDialectCode: string | null;
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
      relatedDialectCode: row.relatedDialectCode,
      cueTerms: Array.isArray(row.cueTerms) ? (row.cueTerms as string[]) : [],
      notes: row.notes,
    };
  }

  private scoreAccent(
    text: string,
    row: { code: string; nameEn: string; languageCode: string; cueTerms: unknown },
  ): AccentScore {
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
      .toLowerCase
      .normalize('NFKD')
      .replace(/\p{M}/gu, '')
      .replace(/\s+/g, ' ')
      .trim;
  }

  private async assistWithLlm(
    text: string,
    language: string,
    candidates: AccentScore[],
  ): Promise<AccentScore | null> {
    try {
      const catalog = candidates.map((c) => `${c.code}: ${c.nameEn}`).join('\n');
      const out = await this.gateway.chat({
        messages: [
          {
            role: 'system',
            content:
              'You classify spoken-accent profile from transcript text into one accent code from the list. Reply with ONLY the accent code, or NONE. This is not phonetic analysis.',
          },
          {
            role: 'user',
            content: `Language: ${language}\nAccents:\n${catalog}\n\nTranscript:\n${text.slice(0, 1500)}`,
          },
        ],
        model: process.env.OPENAI_CHAT_MODEL ?? 'gpt-4o-mini',
      });
      const raw = out.message.content.trim.split(/\s+/)[0]?.replace(/[^a-z0-9-]/gi, '');
      if (!raw || raw.toUpperCase === 'NONE') return null;
      const hit = candidates.find((c) => c.code === raw.toLowerCase);
      return hit ?? null;
    } catch (error) {
      this.logger.warn(
        JSON.stringify({
          event: 'accents.llm_assist_failed',
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
    result: {
      language: string;
      accent: string | null;
      provider: string;
      confidence: number;
      inputMode: string;
    },
    action = 'accent.detect',
    route = 'POST /v1/accents/detect',
  ) {
    let apiKeyPrefix: string | undefined;
    if (input.apiKeyId) {
      const key = await this.prisma.apiKey.findUnique({ where: { id: input.apiKeyId } });
      apiKeyPrefix = key?.prefix ?? undefined;
    }
    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action,
      route,
      ip: input.ip,
      apiKeyPrefix,
      metadata: {
        language: result.language,
        accent: result.accent,
        provider: result.provider,
        confidence: result.confidence,
        inputMode: result.inputMode,
      },
    });
  }
}
