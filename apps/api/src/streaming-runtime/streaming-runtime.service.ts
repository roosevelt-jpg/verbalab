import { HttpStatus, Injectable } from '@nestjs/common';
import type { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ApiException } from '../common/errors/api-exception';
import {
  STREAM_KINDS,
  streamingCeilings,
  streamingRuntimeCatalog,
  streamingRuntimeMode,
  streamingSurfaces,
  streamingTransports,
  type StreamKind,
} from './streaming-runtime.catalog';

type AuthCtx = {
  organizationId: string;
  workspaceId: string;
  userId?: string;
  ip?: string;
};

@Injectable
export class StreamingRuntimeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  engine {
    return {
      ...streamingRuntimeCatalog,
      ceilings: streamingCeilings,
      mode: streamingRuntimeMode,
      spendSafety: {
        hardSpendCeilingsRequired: true,
        note:
          'Streaming Runtime does not provision GPUs or open-ended vendor fan-out. Sandbox chunk streams are local SSE. Vendor calls remain on existing Gateway product streams.',
      },
    };
  }

  surfaces(kind?: string) {
    const all = streamingSurfaces;
    const filtered = kind
      ? all.filter((s) => s.kind === kind.toLowerCase)
      : all;
    return {
      surfaces: filtered,
      honesty: streamingRuntimeCatalog.honesty,
      note: 'Discoverable stream surfaces — prefer existing product SSE where listed.',
    };
  }

  transports {
    return {
      transports: streamingTransports,
      honesty: streamingRuntimeCatalog.honesty,
    };
  }

  async listSessions(input: AuthCtx & { status?: string; kind?: string }) {
    const rows = await this.prisma.streamingSession.findMany({
      where: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        ...(input.status ? { status: input.status } : {}),
        ...(input.kind ? { kind: input.kind.toLowerCase } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return {
      sessions: rows.map((r) => this.serialize(r)),
      note: 'Org/workspace-scoped sandbox stream sessions.',
    };
  }

  async createSession(
    input: AuthCtx & { kind?: string; label?: string; text?: string },
  ) {
    this.assertEnabled;
    const kind = this.normalizeKind(input.kind ?? 'llm');
    if (kind === 'video') {
      throw new ApiException(
        'validation_error',
        'Video streaming is deferred',
        HttpStatus.BAD_REQUEST,
      );
    }
    const surface = streamingSurfaces.find((s) => s.kind === kind);
    const row = await this.prisma.streamingSession.create({
      data: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        kind,
        transport: 'sse',
        status: 'open',
        label: (input.label ?? '').slice(0, 200),
        chunkCount: 0,
        metadata: {
          textPreview: (input.text ?? '').slice(0, 120),
          surfaceApi: surface?.api ?? null,
          existingSurface: surface?.existing ?? false,
        },
      },
    });
    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'streaming_runtime.session_created',
      route: 'POST /v1/streaming-runtime/sessions',
      ip: input.ip,
      metadata: { id: row.id, kind },
    });
    return {
      session: this.serialize(row),
      redirect: surface?.existing ? surface.api : 'POST /v1/streaming-runtime/stream',
      note: surface?.existing
        ? 'Prefer the existing product SSE for this kind; session is for tracking only.'
        : 'Use POST /v1/streaming-runtime/stream with sessionId to emit sandbox chunks.',
    };
  }

  async closeSession(input: AuthCtx & { id: string }) {
    const row = await this.requireSession(input);
    const updated = await this.prisma.streamingSession.update({
      where: { id: row.id },
      data: { status: 'closed' },
    });
    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'streaming_runtime.session_closed',
      route: 'POST /v1/streaming-runtime/sessions/:id/close',
      ip: input.ip,
      metadata: { id: row.id },
    });
    return { session: this.serialize(updated) };
  }

  /**
   * Sandbox SSE chunk stream for llm/translation demo text.
   * Speech/voice kinds emit meta redirecting to existing product streams.
   */
  async writeStream(
    input: AuthCtx & {
      kind?: string;
      text?: string;
      sessionId?: string;
      chunkDelayMs?: number;
    },
    res: Response,
  ) {
    this.assertEnabled;
    const kind = this.normalizeKind(input.kind ?? 'llm');
    const ceilings = streamingCeilings;
    const surface = streamingSurfaces.find((s) => s.kind === kind);

    res.status(200);
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.;

    const write = (event: string, data: unknown) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    let sessionId = input.sessionId?.trim || null;
    if (sessionId) {
      const existing = await this.prisma.streamingSession.findFirst({
        where: {
          id: sessionId,
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
        },
      });
      if (!existing) {
        write('error', { message: 'session not found' });
        res.end;
        return;
      }
    } else {
      const created = await this.prisma.streamingSession.create({
        data: {
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
          kind,
          transport: 'sse',
          status: 'streaming',
          label: 'auto',
          chunkCount: 0,
          metadata: {},
        },
      });
      sessionId = created.id;
    }

    write('meta', {
      product: 'streaming-runtime',
      sessionId,
      kind,
      transport: 'sse',
      surfaceApi: surface?.api ?? null,
      existingSurface: surface?.existing ?? false,
      honesty: streamingRuntimeCatalog.honesty,
      note: 'Sandbox SSE — not WebSocket/gRPC/video OS.',
    });

    if (kind === 'video') {
      write('error', { message: 'Video streaming is deferred', code: 'deferred' });
      write('done', { ok: false, deferred: true });
      await this.finishSession(sessionId, 0, 'failed');
      res.end;
      return;
    }

    if (surface?.existing && (kind === 'speech' || kind === 'voice')) {
      write('redirect', {
        api: surface.api,
        message: `Use existing ${surface.name} at ${surface.api} — not regenerated here.`,
      });
      write('done', {
        ok: true,
        redirected: true,
        honesty: { regeneratesExistingStreams: false },
      });
      await this.finishSession(sessionId, 0, 'closed');
      await this.audit.record({
        organizationId: input.organizationId,
        userId: input.userId,
        action: 'streaming_runtime.redirected',
        route: 'POST /v1/streaming-runtime/stream',
        ip: input.ip,
        metadata: { sessionId, kind, api: surface.api },
      });
      res.end;
      return;
    }

    const text =
      (input.text ?? '').trim ||
      (kind === 'translation'
        ? 'Habari dunia — sandbox translation stream.'
        : 'Hello from Lugemi Streaming Runtime sandbox.');

    const tokens = this.tokenize(text, ceilings.maxChunksPerStream);
    const delay = Math.min(50, Math.max(0, input.chunkDelayMs ?? 0));

    let i = 0;
    for (const token of tokens) {
      i += 1;
      write('chunk', {
        index: i,
        token,
        kind,
        sessionId,
      });
      if (delay > 0) {
        await new Promise((r) => setTimeout(r, delay));
      }
    }

    write('done', {
      ok: true,
      chunks: i,
      sessionId,
      ceilings,
      honesty: streamingRuntimeCatalog.honesty,
    });

    await this.finishSession(sessionId, i, 'closed');
    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'streaming_runtime.streamed',
      route: 'POST /v1/streaming-runtime/stream',
      ip: input.ip,
      metadata: { sessionId, kind, chunks: i },
    });
    res.end;
  }

  async analytics(input: AuthCtx) {
    const since = new Date(Date.now - 30 * 24 * 60 * 60 * 1000);
    const [total, streaming, closed, audits, chunks] = await Promise.all([
      this.prisma.streamingSession.count({
        where: {
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
        },
      }),
      this.prisma.streamingSession.count({
        where: {
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
          status: 'streaming',
        },
      }),
      this.prisma.streamingSession.count({
        where: {
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
          status: 'closed',
        },
      }),
      this.prisma.auditEvent.count({
        where: {
          organizationId: input.organizationId,
          action: { startsWith: 'streaming_runtime.' },
          createdAt: { gte: since },
        },
      }),
      this.prisma.streamingSession.aggregate({
        where: {
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
        },
        _sum: { chunkCount: true },
      }),
    ]);
    return {
      workspace: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
      },
      sessionsTotal: total,
      streaming,
      closed,
      chunksTotal: chunks._sum.chunkCount ?? 0,
      auditsLast30d: audits,
      note: 'Streaming Runtime analytics. ≠ AI Runtime Analytics.',
    };
  }

  async monitoring(input: AuthCtx) {
    const [engine, analytics] = await Promise.all([
      Promise.resolve(this.engine),
      this.analytics(input),
    ]);
    return {
      generatedAt: new Date.toISOString,
      mode: streamingRuntimeMode,
      analytics,
      honesty: engine.honesty,
      spendSafety: engine.spendSafety,
      deferred: engine.capabilities
        .filter((c) => c.status === 'deferred')
        .map((c) => c.id),
      note: 'Streaming Runtime monitoring snapshot.',
    };
  }

  private assertEnabled {
    if (streamingRuntimeMode === 'disabled') {
      throw new ApiException(
        'streaming_runtime_disabled',
        'Streaming Runtime mode is disabled (LUGEMI_STREAMING_RUNTIME_MODE=disabled).',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  private normalizeKind(raw: string): StreamKind {
    const k = raw.toLowerCase as StreamKind;
    if (!STREAM_KINDS.includes(k)) {
      throw new ApiException(
        'validation_error',
        `kind must be one of ${STREAM_KINDS.join('|')}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return k;
  }

  private async requireSession(input: AuthCtx & { id: string }) {
    const row = await this.prisma.streamingSession.findFirst({
      where: {
        id: input.id,
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
      },
    });
    if (!row) {
      throw new ApiException(
        'not_found',
        'Streaming session not found',
        HttpStatus.NOT_FOUND,
      );
    }
    return row;
  }

  private async finishSession(id: string, chunkCount: number, status: string) {
    await this.prisma.streamingSession.update({
      where: { id },
      data: { chunkCount, status },
    });
  }

  private tokenize(text: string, maxChunks: number): string[] {
    const parts = text.split(/(\s+)/).filter((p) => p.length > 0);
    if (parts.length === 0) return ['…'];
    if (parts.length <= maxChunks) return parts;
    const out: string[] = [];
    const bucket = Math.ceil(parts.length / maxChunks);
    for (let i = 0; i < parts.length; i += bucket) {
      out.push(parts.slice(i, i + bucket).join(''));
      if (out.length >= maxChunks) break;
    }
    return out;
  }

  private serialize(r: {
    id: string;
    organizationId: string;
    workspaceId: string;
    kind: string;
    transport: string;
    status: string;
    label: string;
    chunkCount: number;
    metadata: unknown;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: r.id,
      organizationId: r.organizationId,
      workspaceId: r.workspaceId,
      kind: r.kind,
      transport: r.transport,
      status: r.status,
      label: r.label,
      chunkCount: r.chunkCount,
      metadata: r.metadata,
      createdAt: r.createdAt.toISOString,
      updatedAt: r.updatedAt.toISOString,
    };
  }
}
