import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GatewayService } from '../gateway/gateway.service';
import { AuditService } from '../audit/audit.service';
import { UsageService } from '../usage/usage.service';
import { AudioService } from '../audio/audio.service';
import { ApiException } from '../common/errors/api-exception';
import { DEFAULT_WAKE_PHRASES, wakeWordEngineCatalog } from './wake-word-engine.catalog';
import { hasWakeHit, spotPhrases } from './wake-spotter';

export type WakeKeywordKind = 'wake_word' | 'keyword' | 'trigger';

const KINDS: WakeKeywordKind[] = ['wake_word', 'keyword', 'trigger'];

@Injectable()
export class WakeWordService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: GatewayService,
    private readonly audit: AuditService,
    private readonly usage: UsageService,
    private readonly audio: AudioService,
  ) {}

  engine() {
    return wakeWordEngineCatalog();
  }

  async analytics(organizationId: string) {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const events = await this.prisma.auditEvent.findMany({
      where: {
        organizationId,
        action: { startsWith: 'wake_word.' },
        createdAt: { gte: since },
      },
      select: { action: true, metadata: true },
      take: 5000,
    });
    const byAction: Record<string, number> = {};
    let detections = 0;
    let wakeHits = 0;
    for (const e of events) {
      byAction[e.action] = (byAction[e.action] ?? 0) + 1;
      const meta = (e.metadata ?? {}) as Record<string, unknown>;
      if (e.action === 'wake_word.detect' || e.action === 'wake_word.spot') {
        detections += 1;
        if (meta.wakeDetected === true) wakeHits += 1;
      }
    }
    const keywordCount = await this.prisma.wakeKeyword.count({ where: { organizationId } });
    return {
      windowDays: 30,
      total: events.length,
      byAction,
      detections,
      wakeHits,
      customKeywords: keywordCount,
      note: 'Org audit-derived Wake Word usage — not Porcupine accuracy metrics.',
    };
  }

  async listKeywords(organizationId: string, workspaceId: string, kind?: string) {
    const where: { organizationId: string; workspaceId: string; kind?: string } = {
      organizationId,
      workspaceId,
    };
    if (kind) {
      this.assertKind(kind);
      where.kind = kind;
    }
    const rows = await this.prisma.wakeKeyword.findMany({
      where,
      orderBy: [{ kind: 'asc' }, { phrase: 'asc' }],
    });
    return {
      data: rows.map((r) => ({
        id: r.id,
        phrase: r.phrase,
        kind: r.kind,
        enabled: r.enabled,
        createdAt: r.createdAt.toISOString(),
      })),
      defaultWakePhrases: [...DEFAULT_WAKE_PHRASES],
    };
  }

  async addKeyword(input: {
    organizationId: string;
    workspaceId: string;
    userId?: string;
    apiKeyId?: string;
    ip?: string;
    phrase: string;
    kind?: string;
  }) {
    const phrase = input.phrase?.trim().toLowerCase();
    if (!phrase || phrase.length < 2) {
      throw new ApiException(
        'validation_error',
        'phrase must be at least 2 characters',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (phrase.length > 120) {
      throw new ApiException(
        'validation_error',
        'phrase must be at most 120 characters',
        HttpStatus.BAD_REQUEST,
      );
    }
    const kind = this.assertKind(input.kind ?? 'keyword');
    const count = await this.prisma.wakeKeyword.count({
      where: { workspaceId: input.workspaceId },
    });
    if (count >= 200) {
      throw new ApiException(
        'validation_error',
        'Maximum 200 wake/keyword phrases per workspace',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const row = await this.prisma.wakeKeyword.create({
        data: {
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
          phrase,
          kind,
        },
      });
      await this.record(input, 'wake_word.keyword_added', 'POST /v1/wake-word/keywords', {
        phrase,
        kind,
      });
      return {
        id: row.id,
        phrase: row.phrase,
        kind: row.kind,
        enabled: row.enabled,
        createdAt: row.createdAt.toISOString(),
      };
    } catch {
      throw new ApiException(
        'conflict',
        'Phrase already exists for this kind in the workspace',
        HttpStatus.CONFLICT,
      );
    }
  }

  async removeKeyword(input: {
    organizationId: string;
    workspaceId: string;
    id: string;
    userId?: string;
    apiKeyId?: string;
    ip?: string;
  }) {
    const row = await this.prisma.wakeKeyword.findFirst({
      where: {
        id: input.id,
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
      },
    });
    if (!row) {
      throw new ApiException('not_found', 'Keyword not found', HttpStatus.NOT_FOUND);
    }
    await this.prisma.wakeKeyword.delete({ where: { id: row.id } });
    await this.record(input, 'wake_word.keyword_removed', 'DELETE /v1/wake-word/keywords/:id', {
      phrase: row.phrase,
      kind: row.kind,
    });
    return { deleted: true, id: row.id };
  }

  async detect(input: {
    text?: string;
    language?: string;
    file?: Express.Multer.File;
    includeDefaults?: boolean;
    organizationId: string;
    workspaceId: string;
    userId?: string;
    apiKeyId?: string;
    ip?: string;
    skipAudit?: boolean;
  }) {
    const { text, stt } = await this.resolveText(input);
    const phrases = await this.collectPhrases(input.organizationId, input.workspaceId, {
      includeDefaults: input.includeDefaults !== false,
      kinds: ['wake_word'],
    });
    const hits = spotPhrases(text, phrases).filter((h) => h.kind === 'wake_word');
    const wakeDetected = hasWakeHit(hits) || hits.length > 0;
    const result = {
      product: 'Wake Word Engine',
      wakeDetected,
      transcript: text,
      hits,
      inputMode: stt ? ('audio' as const) : ('text' as const),
      stt,
      note: 'Transcript wake spotting — not on-device Porcupine DNN (VL-157).',
    };
    if (!input.skipAudit) {
      await this.record(input, 'wake_word.detect', 'POST /v1/wake-word/detect', {
        wakeDetected,
        hitCount: hits.length,
        inputMode: result.inputMode,
      });
    }
    return result;
  }

  async spot(input: {
    text?: string;
    language?: string;
    file?: Express.Multer.File;
    keywords?: string[];
    organizationId: string;
    workspaceId: string;
    userId?: string;
    apiKeyId?: string;
    ip?: string;
  }) {
    const { text, stt } = await this.resolveText(input);
    const stored = await this.collectPhrases(input.organizationId, input.workspaceId, {
      includeDefaults: false,
      kinds: ['keyword', 'wake_word'],
    });
    const extra = (input.keywords ?? [])
      .map((k) => k.trim())
      .filter(Boolean)
      .map((phrase) => ({ phrase, kind: 'keyword' }));
    const hits = spotPhrases(text, [...stored, ...extra]);
    const result = {
      product: 'Keyword Spotting',
      transcript: text,
      hits,
      hitCount: hits.length,
      inputMode: stt ? ('audio' as const) : ('text' as const),
      stt,
      note: 'Text/STT keyword spotting — not acoustic KWS DNN (VL-157).',
    };
    await this.record(input, 'wake_word.spot', 'POST /v1/wake-word/spot', {
      hitCount: hits.length,
      wakeDetected: hits.some((h) => h.kind === 'wake_word'),
      inputMode: result.inputMode,
    });
    return result;
  }

  async triggers(input: {
    text?: string;
    language?: string;
    file?: Express.Multer.File;
    organizationId: string;
    workspaceId: string;
    userId?: string;
    apiKeyId?: string;
    ip?: string;
  }) {
    const { text, stt } = await this.resolveText(input);
    const phrases = await this.collectPhrases(input.organizationId, input.workspaceId, {
      includeDefaults: false,
      kinds: ['trigger'],
    });
    const hits = spotPhrases(text, phrases);
    const fired = hits.map((h) => ({
      phrase: h.phrase,
      action: 'notify' as const,
      matched: h.matched,
      start: h.start,
      end: h.end,
    }));
    await this.record(input, 'wake_word.triggers', 'POST /v1/wake-word/triggers', {
      fired: fired.length,
      wakeDetected: false,
    });
    return {
      product: 'Enterprise Triggers',
      transcript: text,
      fired,
      inputMode: stt ? ('audio' as const) : ('text' as const),
      stt,
      note: 'Trigger phrase hits + audit only — not a workflow orchestration engine (VL-157).',
    };
  }

  async *streamDetect(input: {
    text?: string;
    language?: string;
    file?: Express.Multer.File;
    includeDefaults?: boolean;
    organizationId: string;
    workspaceId: string;
    userId?: string;
    apiKeyId?: string;
    ip?: string;
  }): AsyncGenerator<
    | { event: 'start' }
    | { event: 'transcript'; text: string }
    | { event: 'hit'; phrase: string; kind: string }
    | { event: 'done'; wakeDetected: boolean; note: string }
    | { event: 'error'; message: string }
  > {
    try {
      yield { event: 'start' };
      const result = await this.detect(input);
      yield { event: 'transcript', text: result.transcript };
      for (const hit of result.hits) {
        yield { event: 'hit', phrase: hit.phrase, kind: hit.kind };
      }
      yield {
        event: 'done',
        wakeDetected: result.wakeDetected,
        note: result.note,
      };
    } catch (err) {
      yield {
        event: 'error',
        message: err instanceof Error ? err.message : 'Wake word detection failed',
      };
    }
  }

  private assertKind(kind: string): WakeKeywordKind {
    if (!KINDS.includes(kind as WakeKeywordKind)) {
      throw new ApiException(
        'validation_error',
        `kind must be one of: ${KINDS.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return kind as WakeKeywordKind;
  }

  private async collectPhrases(
    organizationId: string,
    workspaceId: string,
    opts: { includeDefaults: boolean; kinds: WakeKeywordKind[] },
  ) {
    const rows = await this.prisma.wakeKeyword.findMany({
      where: {
        organizationId,
        workspaceId,
        enabled: true,
        kind: { in: opts.kinds },
      },
      select: { phrase: true, kind: true },
    });
    const out = rows.map((r) => ({ phrase: r.phrase, kind: r.kind }));
    if (opts.includeDefaults && opts.kinds.includes('wake_word')) {
      for (const phrase of DEFAULT_WAKE_PHRASES) {
        out.push({ phrase, kind: 'wake_word' });
      }
    }
    return out;
  }

  private async resolveText(input: {
    text?: string;
    language?: string;
    file?: Express.Multer.File;
    organizationId: string;
    workspaceId: string;
    apiKeyId?: string;
  }): Promise<{
    text: string;
    stt?: { provider: string; durationSeconds: number; language?: string };
  }> {
    let text = input.text?.trim() ?? '';
    let stt: { provider: string; durationSeconds: number; language?: string } | undefined;

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
      text = result.text.trim();
      stt = {
        provider: result.provider,
        durationSeconds: result.durationSeconds,
        language: result.language,
      };
    }

    if (!text) {
      throw new ApiException(
        'validation_error',
        'text or audio file is required',
        HttpStatus.BAD_REQUEST,
      );
    }
    return { text, stt };
  }

  private async record(
    input: {
      organizationId: string;
      userId?: string;
      apiKeyId?: string;
      ip?: string;
    },
    action: string,
    route: string,
    metadata: Record<string, unknown>,
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
      metadata,
    });
  }
}
