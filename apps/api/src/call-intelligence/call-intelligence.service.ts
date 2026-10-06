import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { GatewayService } from '../gateway/gateway.service';
import { AuditService } from '../audit/audit.service';
import { UsageService } from '../usage/usage.service';
import { AudioService } from '../audio/audio.service';
import { LocalStorageService } from '../documents/local-storage.service';
import { ApiException } from '../common/errors/api-exception';
import { callIntelligenceEngineCatalog } from './call-engine.catalog';
import { analyzeCallTranscript, CallAnalysis } from './call-analysis';

type CallRow = {
  id: string;
  organizationId: string;
  workspaceId: string;
  externalRef: string | null;
  direction: string;
  status: string;
  durationSeconds: number | null;
  language: string | null;
  recordingKey: string | null;
  recordingFilename: string | null;
  mimeType: string | null;
  transcript: string | null;
  summary: string | null;
  analysisJson: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable
export class CallIntelligenceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: GatewayService,
    private readonly audit: AuditService,
    private readonly usage: UsageService,
    private readonly audio: AudioService,
    private readonly storage: LocalStorageService,
  ) {}

  engine {
    return callIntelligenceEngineCatalog;
  }

  async analytics(organizationId: string) {
    const since = new Date(Date.now - 30 * 24 * 60 * 60 * 1000);
    const [events, calls] = await Promise.all([
      this.prisma.auditEvent.findMany({
        where: {
          organizationId,
          action: { startsWith: 'call_intelligence.' },
          createdAt: { gte: since },
        },
        select: { action: true },
        take: 5000,
      }),
      this.prisma.callRecord.count({
        where: { organizationId, createdAt: { gte: since } },
      }),
    ]);
    const byAction: Record<string, number> = {};
    for (const e of events) {
      byAction[e.action] = (byAction[e.action] ?? 0) + 1;
    }
    return {
      windowDays: 30,
      total: events.length,
      byAction,
      callsCreated: calls,
      note: 'Org audit-derived Call Intelligence usage — not CCaaS SLA metrics.',
    };
  }

  async report(organizationId: string, workspaceId: string) {
    const since = new Date(Date.now - 30 * 24 * 60 * 60 * 1000);
    const rows = await this.prisma.callRecord.findMany({
      where: { organizationId, workspaceId, createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });

    const byStatus: Record<string, number> = {};
    const bySentiment: Record<string, number> = {};
    let complianceFlags = 0;
    let qaSum = 0;
    let qaCount = 0;

    for (const row of rows) {
      byStatus[row.status] = (byStatus[row.status] ?? 0) + 1;
      const analysis = row.analysisJson as CallAnalysis | null;
      if (analysis?.sentiment?.label) {
        bySentiment[analysis.sentiment.label] =
          (bySentiment[analysis.sentiment.label] ?? 0) + 1;
      }
      if (analysis?.compliance?.flags?.length) {
        complianceFlags += analysis.compliance.flags.filter(
          (f) => f.severity === 'warn' || f.severity === 'critical',
        ).length;
      }
      if (typeof analysis?.qa?.score === 'number') {
        qaSum += analysis.qa.score;
        qaCount += 1;
      }
    }

    return {
      windowDays: 30,
      totalCalls: rows.length,
      byStatus,
      bySentiment,
      complianceFlagCount: complianceFlags,
      averageQaScore: qaCount ? Number((qaSum / qaCount).toFixed(1)) : null,
      recent: rows.slice(0, 10).map((r) => this.serialize(r)),
      note: 'Workspace Call Intelligence report — heuristic aggregates.',
    };
  }

  async listCalls(organizationId: string, workspaceId: string, limit = 50) {
    const rows = await this.prisma.callRecord.findMany({
      where: { organizationId, workspaceId },
      orderBy: { createdAt: 'desc' },
      take: Math.min(100, Math.max(1, limit)),
    });
    return { data: rows.map((r) => this.serialize(r)) };
  }

  async getCall(organizationId: string, workspaceId: string, id: string) {
    const row = await this.requireCall(organizationId, workspaceId, id);
    return this.serialize(row, true);
  }

  async createCall(input: {
    organizationId: string;
    workspaceId: string;
    userId?: string;
    apiKeyId?: string;
    ip?: string;
    transcript?: string;
    language?: string;
    externalRef?: string;
    direction?: string;
    file?: Express.Multer.File;
    analyze?: boolean;
  }) {
    let transcript = input.transcript?.trim ?? '';
    let durationSeconds: number | undefined;
    let language = input.language;
    let recordingKey: string | undefined;
    let recordingFilename: string | undefined;
    let mimeType: string | undefined;
    let status = 'created';

    if (input.file) {
      this.audio.assertAllowedAudio(input.file);
      recordingFilename = input.file.originalname;
      mimeType = input.file.mimetype || 'application/octet-stream';
      const idForKey = `tmp_${Date.now}`;
      recordingKey = `calls/${input.organizationId}/${input.workspaceId}/${idForKey}-${sanitizeName(recordingFilename)}`;
      await this.storage.writeBuffer(recordingKey, input.file.buffer);
      status = 'recorded';

      if (!transcript) {
        const result = await this.gateway.transcribe({
          buffer: input.file.buffer,
          filename: input.file.originalname,
          mimeType,
          language: input.language,
        });
        const seconds = Math.max(1, Math.ceil(result.durationSeconds));
        await this.usage.recordStt({
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
          apiKeyId: input.apiKeyId,
          seconds,
          provider: result.provider,
        });
        transcript = result.text.trim;
        durationSeconds = result.durationSeconds;
        language = result.language ?? language;
        status = 'transcribed';
      }
    }

    if (!transcript && !recordingKey) {
      throw new ApiException(
        'validation_error',
        'transcript or audio file is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const direction = normalizeDirection(input.direction);
    let analysis: CallAnalysis | null = null;
    let summary: string | null = null;
    if (transcript && input.analyze !== false) {
      analysis = analyzeCallTranscript(transcript);
      summary = analysis.summary;
      status = 'analyzed';
    } else if (transcript) {
      status = status === 'recorded' ? 'transcribed' : 'transcribed';
    }

    const row = await this.prisma.callRecord.create({
      data: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        externalRef: input.externalRef?.trim || null,
        direction,
        status,
        durationSeconds: durationSeconds ?? null,
        language: language ?? null,
        recordingKey: recordingKey ?? null,
        recordingFilename: recordingFilename ?? null,
        mimeType: mimeType ?? null,
        transcript: transcript || null,
        summary,
        analysisJson: analysis ? (analysis as unknown as Prisma.InputJsonValue) : undefined,
      },
    });

    // Rewrite storage key to include real id when we used tmp path
    if (recordingKey && recordingKey.includes('/tmp_')) {
      const newKey = `calls/${input.organizationId}/${input.workspaceId}/${row.id}-${sanitizeName(recordingFilename ?? 'audio.bin')}`;
      try {
        const buf = await this.storage.readBuffer(recordingKey);
        await this.storage.writeBuffer(newKey, buf);
        await this.storage.tryUnlink(recordingKey);
        await this.prisma.callRecord.update({
          where: { id: row.id },
          data: { recordingKey: newKey },
        });
        row.recordingKey = newKey;
      } catch {
        // keep tmp key if rename fails
      }
    }

    await this.record(input, 'call_intelligence.create', 'POST /v1/call-intelligence/calls', {
      callId: row.id,
      status: row.status,
      hasRecording: Boolean(row.recordingKey),
    });

    return this.serialize(row, true);
  }

  async analyzeCall(input: {
    organizationId: string;
    workspaceId: string;
    id: string;
    userId?: string;
    apiKeyId?: string;
    ip?: string;
  }) {
    const row = await this.requireCall(input.organizationId, input.workspaceId, input.id);
    let transcript = row.transcript?.trim ?? '';

    if (!transcript && row.recordingKey) {
      const buffer = await this.storage.readBuffer(row.recordingKey);
      const result = await this.gateway.transcribe({
        buffer,
        filename: row.recordingFilename ?? 'call.wav',
        mimeType: row.mimeType ?? 'application/octet-stream',
        language: row.language ?? undefined,
      });
      const seconds = Math.max(1, Math.ceil(result.durationSeconds));
      await this.usage.recordStt({
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        apiKeyId: input.apiKeyId,
        seconds,
        provider: result.provider,
      });
      transcript = result.text.trim;
      row.transcript = transcript;
      row.durationSeconds = result.durationSeconds;
      row.language = result.language ?? row.language;
    }

    if (!transcript) {
      throw new ApiException(
        'validation_error',
        'Call has no transcript or recording to analyze',
        HttpStatus.BAD_REQUEST,
      );
    }

    const analysis = analyzeCallTranscript(transcript);
    const updated = await this.prisma.callRecord.update({
      where: { id: row.id },
      data: {
        transcript,
        durationSeconds: row.durationSeconds,
        language: row.language,
        summary: analysis.summary,
        analysisJson: analysis as unknown as Prisma.InputJsonValue,
        status: 'analyzed',
      },
    });

    await this.record(input, 'call_intelligence.analyze', 'POST /v1/call-intelligence/calls/:id/analyze', {
      callId: row.id,
      sentiment: analysis.sentiment.label,
      qaScore: analysis.qa.score,
    });

    return this.serialize(updated, true);
  }

  async *streamAnalyze(input: {
    organizationId: string;
    workspaceId: string;
    transcript?: string;
    language?: string;
    file?: Express.Multer.File;
    userId?: string;
    apiKeyId?: string;
    ip?: string;
  }): AsyncGenerator<
    | { event: 'start' }
    | { event: 'call'; id: string }
    | { event: 'summary'; summary: string }
    | { event: 'sentiment'; label: string }
    | { event: 'done'; note: string }
    | { event: 'error'; message: string }
  > {
    try {
      yield { event: 'start' };
      const created = await this.createCall({
        ...input,
        analyze: true,
      });
      yield { event: 'call', id: created.id };
      if (created.summary) yield { event: 'summary', summary: created.summary };
      const sentiment = (created.analysis as CallAnalysis | null)?.sentiment?.label;
      if (sentiment) yield { event: 'sentiment', label: sentiment };
      yield {
        event: 'done',
        note: 'Call Intelligence stream complete.',
      };
    } catch (err) {
      yield {
        event: 'error',
        message: err instanceof Error ? err.message : 'Call analysis failed',
      };
    }
  }

  private async requireCall(organizationId: string, workspaceId: string, id: string) {
    const row = await this.prisma.callRecord.findFirst({
      where: { id, organizationId, workspaceId },
    });
    if (!row) {
      throw new ApiException('not_found', 'Call not found', HttpStatus.NOT_FOUND);
    }
    return row;
  }

  private serialize(row: CallRow, full = false) {
    const analysis = (row.analysisJson as CallAnalysis | null) ?? null;
    return {
      id: row.id,
      externalRef: row.externalRef,
      direction: row.direction,
      status: row.status,
      durationSeconds: row.durationSeconds,
      language: row.language,
      hasRecording: Boolean(row.recordingKey),
      recordingFilename: row.recordingFilename,
      transcript: full ? row.transcript : row.transcript ? row.transcript.slice(0, 240) : null,
      summary: row.summary,
      analysis: full ? analysis : analysis
        ? {
            sentiment: analysis.sentiment,
            intent: analysis.intent,
            emotion: analysis.emotion,
            qa: { score: analysis.qa.score },
            compliance: { riskScore: analysis.compliance.riskScore },
          }
        : null,
      createdAt: row.createdAt.toISOString,
      updatedAt: row.updatedAt.toISOString,
    };
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

function normalizeDirection(value?: string): string {
  const v = (value ?? 'unknown').toLowerCase;
  if (v === 'inbound' || v === 'outbound' || v === 'unknown') return v;
  return 'unknown';
}

function sanitizeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
}
