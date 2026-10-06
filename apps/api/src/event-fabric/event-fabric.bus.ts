import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { randomUUID } from 'crypto';
import IORedis from 'ioredis';

export type CloudEvent = {
  specversion: '1.0';
  id: string;
  source: string;
  type: string;
  time: string;
  datacontenttype: string;
  dataschema: string | null;
  eventVersion: string;
  subject: string | null;
  data: unknown;
  topic: string;
  attempt: number;
  streamId: string;
};

export type PublishInput = {
  topic: string;
  type: string;
  source?: string;
  data?: unknown;
  eventVersion?: string;
  dataschema?: string | null;
  subject?: string | null;
};

export type PollResult = {
  events: CloudEvent[];
  backend: 'redis_streams' | 'memory';
  group: string;
  topic: string;
};

type MemoryEntry = {
  streamId: string;
  event: CloudEvent;
  pending: boolean;
};

type TopicStats = {
  published: number;
  consumed: number;
  failed: number;
  dlq: number;
  retried: number;
};

const DEFAULT_MAX_ATTEMPTS = 3;
const STREAM_PREFIX = 'vl:ef:';
const GROUP = 'event-fabric';

@Injectable
export class EventFabricBus implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventFabricBus.name);
  private redis: IORedis | null = null;
  private backend: 'redis_streams' | 'memory' = 'memory';
  private readonly memory = new Map<string, MemoryEntry[]>;
  private readonly dlq = new Map<string, CloudEvent[]>;
  private readonly snapshots = new Map<string, { topic: string; lastId: string; at: string }>;
  private readonly stats = new Map<string, TopicStats>;
  private streamSeq = 0;

  private preferMemory: boolean {
    return (
      process.env.EVENT_FABRIC_MEMORY === '1' ||
      process.env.JOBS_INLINE === '1' ||
      process.env.RATE_LIMIT_MEMORY === '1'
    );
  }

  async onModuleInit {
    if (this.preferMemory) {
      this.backend = 'memory';
      this.logger.warn('Event Fabric using in-memory streams (EVENT_FABRIC_MEMORY / JOBS_INLINE)');
      return;
    }

    try {
      const url = process.env.REDIS_URL ?? 'redis://127.0.0.1:6379';
      this.redis = new IORedis(url, {
        maxRetriesPerRequest: 1,
        enableReadyCheck: true,
        lazyConnect: true,
        connectTimeout: 2_000,
      });
      await this.redis.connect;
      this.backend = 'redis_streams';
      this.logger.log('Event Fabric Redis Streams connected');
    } catch (error) {
      this.logger.warn(
        `Event Fabric Redis unavailable (${error instanceof Error ? error.message : 'unknown'}); using memory`,
      );
      await this.redis?.quit.catch( => undefined);
      this.redis = null;
      this.backend = 'memory';
    }
  }

  async onModuleDestroy {
    await this.redis?.quit.catch( => undefined);
    this.redis = null;
  }

  /** Test hook — force memory backend and clear state. */
  resetForTests {
    this.memory.clear;
    this.dlq.clear;
    this.snapshots.clear;
    this.stats.clear;
    this.streamSeq = 0;
    this.backend = 'memory';
    this.redis = null;
  }

  activeBackend {
    return this.backend;
  }

  private ensureStats(topic: string): TopicStats {
    let s = this.stats.get(topic);
    if (!s) {
      s = { published: 0, consumed: 0, failed: 0, dlq: 0, retried: 0 };
      this.stats.set(topic, s);
    }
    return s;
  }

  private streamKey(topic: string) {
    return `${STREAM_PREFIX}${topic}`;
  }

  private dlqKey(topic: string) {
    return `${STREAM_PREFIX}${topic}:dlq`;
  }

  private nextStreamId {
    this.streamSeq += 1;
    return `${Date.now}-${this.streamSeq}`;
  }

  private toCloudEvent(input: PublishInput, streamId: string, attempt = 0): CloudEvent {
    return {
      specversion: '1.0',
      id: randomUUID,
      source: input.source ?? '/lugemi/event-fabric',
      type: input.type,
      time: new Date.toISOString,
      datacontenttype: 'application/json',
      dataschema: input.dataschema ?? null,
      eventVersion: input.eventVersion ?? '1',
      subject: input.subject ?? null,
      data: input.data ?? {},
      topic: input.topic,
      attempt,
      streamId,
    };
  }

  async publish(input: PublishInput): Promise<CloudEvent> {
    const topic = input.topic.trim || 'default';
    const streamId = this.nextStreamId;
    const event = this.toCloudEvent({ ...input, topic }, streamId);

    if (this.redis && this.backend === 'redis_streams') {
      const key = this.streamKey(topic);
      try {
        await this.redis.xgroup('CREATE', key, GROUP, '0', 'MKSTREAM').catch( => undefined);
        const id = await this.redis.xadd(
          key,
          '*',
          'payload',
          JSON.stringify(event),
        );
        event.streamId = id ?? streamId;
      } catch (error) {
        this.logger.warn(
          `Redis XADD failed (${error instanceof Error ? error.message : 'unknown'}); memory fallback`,
        );
        this.backend = 'memory';
        this.memoryPublish(topic, event);
      }
    } else {
      this.memoryPublish(topic, event);
    }

    this.ensureStats(topic).published += 1;
    return event;
  }

  private memoryPublish(topic: string, event: CloudEvent) {
    const list = this.memory.get(topic) ?? [];
    list.push({ streamId: event.streamId, event, pending: false });
    this.memory.set(topic, list);
    this.rememberHistory(topic, [event]);
  }

  async poll(params: {
    topic: string;
    count?: number;
    eventVersion?: string;
  }): Promise<PollResult> {
    const topic = params.topic.trim || 'default';
    const count = Math.min(Math.max(params.count ?? 10, 1), 100);
    let events: CloudEvent[] = [];

    if (this.redis && this.backend === 'redis_streams') {
      const key = this.streamKey(topic);
      try {
        await this.redis.xgroup('CREATE', key, GROUP, '0', 'MKSTREAM').catch( => undefined);
        const rows = (await this.redis.xreadgroup(
          'GROUP',
          GROUP,
          'worker-1',
          'COUNT',
          count,
          'STREAMS',
          key,
          '>',
        )) as Array<[string, Array<[string, string[]]>]> | null;

        if (rows?.[0]?.[1]) {
          for (const [id, fields] of rows[0][1]) {
            const payloadIdx = fields.indexOf('payload');
            const raw = payloadIdx >= 0 ? fields[payloadIdx + 1] : null;
            if (!raw) continue;
            const event = JSON.parse(raw) as CloudEvent;
            event.streamId = id;
            events.push(event);
            await this.redis.xack(key, GROUP, id);
          }
        }
      } catch (error) {
        this.logger.warn(
          `Redis XREADGROUP failed (${error instanceof Error ? error.message : 'unknown'}); memory fallback`,
        );
        this.backend = 'memory';
        events = this.memoryPoll(topic, count);
      }
    } else {
      events = this.memoryPoll(topic, count);
    }

    if (params.eventVersion) {
      events = events.filter((e) => e.eventVersion === params.eventVersion);
    }

    this.rememberHistory(topic, events);

    const stats = this.ensureStats(topic);
    stats.consumed += events.length;
    this.snapshots.set(`${topic}:${GROUP}`, {
      topic,
      lastId: events[events.length - 1]?.streamId ?? '0-0',
      at: new Date.toISOString,
    });

    return { events, backend: this.backend, group: GROUP, topic };
  }

  private memoryPoll(topic: string, count: number): CloudEvent[] {
    const list = this.memory.get(topic) ?? [];
    const out: CloudEvent[] = [];
    for (const entry of list) {
      if (entry.pending) continue;
      entry.pending = true;
      out.push(entry.event);
      if (out.length >= count) break;
    }
    // Ack: drop pending entries that were returned
    this.memory.set(
      topic,
      list.filter((e) => !out.some((ev) => ev.streamId === e.streamId)),
    );
    return out;
  }

  async fail(params: {
    topic: string;
    streamId: string;
    reason?: string;
    maxAttempts?: number;
    event?: Partial<CloudEvent>;
  }): Promise<{ action: 'retry' | 'dlq'; event: CloudEvent }> {
    const topic = params.topic.trim || 'default';
    const maxAttempts = params.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
    const stats = this.ensureStats(topic);
    stats.failed += 1;

    const history = this.memory.get(`__history__:${topic}`) ?? [];
    const fromHistory = history.find((e) => e.streamId === params.streamId)?.event;

    const base: CloudEvent = {
      specversion: '1.0',
      id: params.event?.id ?? fromHistory?.id ?? randomUUID,
      source: params.event?.source ?? fromHistory?.source ?? '/lugemi/event-fabric',
      type: params.event?.type ?? fromHistory?.type ?? 'com.lugemi.event.fail',
      time: params.event?.time ?? fromHistory?.time ?? new Date.toISOString,
      datacontenttype: 'application/json',
      dataschema: params.event?.dataschema ?? fromHistory?.dataschema ?? null,
      eventVersion: params.event?.eventVersion ?? fromHistory?.eventVersion ?? '1',
      subject: params.event?.subject ?? fromHistory?.subject ?? params.streamId,
      data: params.event?.data ?? fromHistory?.data ?? { streamId: params.streamId },
      topic,
      attempt: (params.event?.attempt ?? fromHistory?.attempt ?? 0) + 1,
      streamId: params.streamId,
    };

    if (base.attempt >= maxAttempts) {
      await this.pushDlq(topic, {
        ...base,
        data: {
          ...(typeof base.data === 'object' && base.data ? (base.data as object) : {}),
          failReason: params.reason ?? 'max_attempts',
        },
      });
      stats.dlq += 1;
      return { action: 'dlq', event: base };
    }

    const requeued = await this.publish({
      topic,
      type: base.type,
      source: base.source,
      data: base.data,
      eventVersion: base.eventVersion,
      dataschema: base.dataschema,
      subject: base.subject,
    });
    requeued.attempt = base.attempt;
    stats.retried += 1;
    return { action: 'retry', event: requeued };
  }

  private async pushDlq(topic: string, event: CloudEvent) {
    if (this.redis && this.backend === 'redis_streams') {
      try {
        await this.redis.xadd(this.dlqKey(topic), '*', 'payload', JSON.stringify(event));
        return;
      } catch {
        /* fall through */
      }
    }
    const list = this.dlq.get(topic) ?? [];
    list.push(event);
    this.dlq.set(topic, list);
  }

  async listDlq(topic: string, limit = 50): Promise<CloudEvent[]> {
    const t = topic.trim || 'default';
    if (this.redis && this.backend === 'redis_streams') {
      try {
        const rows = await this.redis.xrevrange(this.dlqKey(t), '+', '-', 'COUNT', limit);
        return rows.map(([id, fields]) => {
          const payloadIdx = fields.indexOf('payload');
          const raw = payloadIdx >= 0 ? fields[payloadIdx + 1] : '{}';
          const event = JSON.parse(raw) as CloudEvent;
          event.streamId = id;
          return event;
        });
      } catch {
        /* fall through */
      }
    }
    return (this.dlq.get(t) ?? []).slice(-limit).reverse;
  }

  async retryFromDlq(params: {
    topic: string;
    streamId: string;
  }): Promise<CloudEvent | null> {
    const topic = params.topic.trim || 'default';
    let event: CloudEvent | null = null;

    if (this.redis && this.backend === 'redis_streams') {
      try {
        const rows = await this.redis.xrange(this.dlqKey(topic), params.streamId, params.streamId);
        if (rows[0]) {
          const fields = rows[0][1];
          const payloadIdx = fields.indexOf('payload');
          const raw = payloadIdx >= 0 ? fields[payloadIdx + 1] : null;
          if (raw) {
            event = JSON.parse(raw) as CloudEvent;
            await this.redis.xdel(this.dlqKey(topic), params.streamId);
          }
        }
      } catch {
        /* fall through */
      }
    }

    if (!event) {
      const list = this.dlq.get(topic) ?? [];
      const idx = list.findIndex((e) => e.streamId === params.streamId);
      if (idx >= 0) {
        event = list[idx];
        list.splice(idx, 1);
        this.dlq.set(topic, list);
      }
    }

    if (!event) return null;
    this.ensureStats(topic).retried += 1;
    return this.publish({
      topic,
      type: event.type,
      source: event.source,
      data: event.data,
      eventVersion: event.eventVersion,
      dataschema: event.dataschema,
      subject: event.subject,
    });
  }

  async replay(params: {
    topic: string;
    afterId?: string;
    count?: number;
  }): Promise<{ events: CloudEvent[]; backend: 'redis_streams' | 'memory'; afterId: string }> {
    const topic = params.topic.trim || 'default';
    const count = Math.min(Math.max(params.count ?? 20, 1), 100);
    const afterId = params.afterId ?? '0-0';

    if (this.redis && this.backend === 'redis_streams') {
      try {
        const rows = await this.redis.xrange(
          this.streamKey(topic),
          afterId === '0-0' ? '-' : `(${afterId}`,
          '+',
          'COUNT',
          count,
        );
        const events = rows.map(([id, fields]) => {
          const payloadIdx = fields.indexOf('payload');
          const raw = payloadIdx >= 0 ? fields[payloadIdx + 1] : '{}';
          const event = JSON.parse(raw) as CloudEvent;
          event.streamId = id;
          return event;
        });
        return { events, backend: 'redis_streams', afterId };
      } catch {
        /* fall through */
      }
    }

    const list = this.memory.get(topic) ?? [];
    // Also include already-acked history: keep a replay buffer
    const history = this.memory.get(`__history__:${topic}`) ?? list;
    const events: CloudEvent[] = [];
    let past = afterId === '0-0';
    for (const entry of history) {
      if (!past) {
        if (entry.streamId === afterId) past = true;
        continue;
      }
      events.push(entry.event);
      if (events.length >= count) break;
    }
    return { events, backend: 'memory', afterId };
  }

  /** Keep history for memory replay after poll acks. */
  rememberHistory(topic: string, events: CloudEvent[]) {
    const key = `__history__:${topic}`;
    const hist = this.memory.get(key) ?? [];
    for (const event of events) {
      hist.push({ streamId: event.streamId, event, pending: false });
    }
    // Cap history
    this.memory.set(key, hist.slice(-500));
  }

  listSnapshots {
    return Array.from(this.snapshots.values);
  }

  analytics {
    const topics = Array.from(this.stats.entries).map(([topic, s]) => ({
      topic,
      ...s,
    }));
    return {
      backend: this.backend,
      topics,
      totals: topics.reduce(
        (acc, t) => ({
          published: acc.published + t.published,
          consumed: acc.consumed + t.consumed,
          failed: acc.failed + t.failed,
          dlq: acc.dlq + t.dlq,
          retried: acc.retried + t.retried,
        }),
        { published: 0, consumed: 0, failed: 0, dlq: 0, retried: 0 },
      ),
    };
  }

  monitoring {
    return {
      mode: 'event_fabric',
      backend: this.backend,
      redisConnected: Boolean(this.redis && this.backend === 'redis_streams'),
      snapshots: this.listSnapshots.length,
      analytics: this.analytics.totals,
    };
  }
}
