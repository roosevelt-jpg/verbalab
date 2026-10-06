import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import IORedis from 'ioredis';
import { rateLimitWindowSec } from '../billing/plans';

export type RateLimitHit = {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSec: number;
  scope: 'key' | 'org';
};

type MemoryBucket = { count: number; resetAt: number };

@Injectable()
export class RateLimitService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RateLimitService.name);
  private redis: IORedis | null = null;
  private readonly memory = new Map<string, MemoryBucket>();

  private useMemory(): boolean {
    return (
      process.env.RATE_LIMIT_MEMORY === '1' ||
      process.env.JOBS_INLINE === '1' ||
      process.env.RATE_LIMIT_DISABLED === '1' ||
      !process.env.REDIS_URL?.trim()
    );
  }

  async onModuleInit() {
    if (this.useMemory()) {
      this.logger.warn(
        process.env.REDIS_URL?.trim()
          ? 'Rate limits using in-memory store (RATE_LIMIT_MEMORY / JOBS_INLINE)'
          : 'REDIS_URL unset — rate limits using in-memory store',
      );
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
      await this.redis.connect();
      this.logger.log('Rate limit Redis connected');
    } catch (error) {
      this.logger.warn(
        `Rate limit Redis unavailable (${error instanceof Error ? error.message : 'unknown'}); using memory`,
      );
      await this.redis?.quit().catch(() => undefined);
      this.redis = null;
    }
  }

  async onModuleDestroy() {
    await this.redis?.quit().catch(() => undefined);
    this.redis = null;
  }

  /** Test hook — force memory backend and clear counters. */
  resetForTests() {
    this.memory.clear();
  }

  private windowMeta(nowMs = Date.now()) {
    const windowSec = rateLimitWindowSec();
    const windowStart = Math.floor(nowMs / 1000 / windowSec) * windowSec;
    const retryAfterSec = Math.max(1, windowStart + windowSec - Math.floor(nowMs / 1000));
    return { windowSec, windowStart, retryAfterSec };
  }

  private async incr(key: string, windowSec: number, windowStart: number): Promise<number> {
    if (this.redis) {
      const redisKey = `${key}:${windowStart}`;
      const count = await this.redis.incr(redisKey);
      if (count === 1) {
        await this.redis.expire(redisKey, windowSec + 1);
      }
      return count;
    }

    const resetAt = (windowStart + windowSec) * 1000;
    const existing = this.memory.get(key);
    if (!existing || existing.resetAt <= Date.now()) {
      this.memory.set(key, { count: 1, resetAt });
      return 1;
    }
    existing.count += 1;
    return existing.count;
  }

  async consume(input: {
    scope: 'key' | 'org';
    id: string;
    limit: number;
  }): Promise<RateLimitHit> {
    if (process.env.RATE_LIMIT_DISABLED === '1') {
      return {
        allowed: true,
        limit: input.limit,
        remaining: input.limit,
        retryAfterSec: 0,
        scope: input.scope,
      };
    }

    const { windowSec, windowStart, retryAfterSec } = this.windowMeta();
    const key = `rl:${input.scope}:${input.id}`;
    const count = await this.incr(key, windowSec, windowStart);
    const allowed = count <= input.limit;
    return {
      allowed,
      limit: input.limit,
      remaining: Math.max(0, input.limit - count),
      retryAfterSec: allowed ? 0 : retryAfterSec,
      scope: input.scope,
    };
  }
}
