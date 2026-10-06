import { createHash } from 'crypto';
import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ApiException } from '../common/errors/api-exception';
import {
  CACHE_NAMESPACES,
  cacheCeilings,
  cacheNamespaces,
  intelligentCacheCatalog,
  intelligentCacheMode,
  type CacheNamespace,
} from './intelligent-cache.catalog';

type AuthCtx = {
  organizationId: string;
  workspaceId: string;
  userId?: string;
  ip?: string;
};

@Injectable()
export class IntelligentCacheService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  engine() {
    return {
      ...intelligentCacheCatalog(),
      ceilings: cacheCeilings(),
      mode: intelligentCacheMode(),
      spendSafety: {
        hardSpendCeilingsRequired: true,
        note:
          'Intelligent Cache stores sandbox entry payloads in Postgres. It does not provision Redis Cluster or auto-cache every Gateway call. Cost Optimization still owns spend caps.',
      },
    };
  }

  namespaces() {
    return {
      namespaces: cacheNamespaces(),
      honesty: intelligentCacheCatalog().honesty,
    };
  }

  ceilings() {
    return cacheCeilings();
  }

  async listEntries(
    input: AuthCtx & { namespace?: string; limit?: number },
  ) {
    await this.purgeExpired(input);
    const take = Math.min(100, Math.max(1, input.limit ?? 50));
    const rows = await this.prisma.cacheEntry.findMany({
      where: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        ...(input.namespace ? { namespace: input.namespace.toLowerCase() } : {}),
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: { updatedAt: 'desc' },
      take,
    });
    return {
      entries: rows.map((r) => this.serialize(r, false)),
      note: 'Org/workspace-scoped active cache entries.',
    };
  }

  async put(
    input: AuthCtx & {
      namespace?: string;
      key?: string;
      text?: string;
      value?: unknown;
      ttlSec?: number;
      labels?: string[];
    },
  ) {
    this.assertEnabled();
    const namespace = this.normalizeNamespace(input.namespace ?? 'translation');
    const cacheKey = this.resolveKey(namespace, input.key, input.text);
    const ceilings = cacheCeilings();
    const ttlSec = Math.min(
      ceilings.defaultTtlSec * 2,
      Math.max(30, Math.floor(input.ttlSec ?? ceilings.defaultTtlSec)),
    );
    const expiresAt = new Date(Date.now() + ttlSec * 1000);
    const valueJson = (input.value ?? { ok: true }) as object;

    await this.purgeExpired(input);

    const existing = await this.prisma.cacheEntry.findUnique({
      where: {
        organizationId_workspaceId_namespace_cacheKey: {
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
          namespace,
          cacheKey,
        },
      },
    });

    if (!existing) {
      const active = await this.prisma.cacheEntry.count({
        where: {
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      });
      if (active >= ceilings.maxEntriesPerWorkspace) {
        throw new ApiException(
          'cache_ceiling',
          `Hard entry ceiling exceeded: ${active} >= maxEntriesPerWorkspace ${ceilings.maxEntriesPerWorkspace}`,
          HttpStatus.PAYMENT_REQUIRED,
        );
      }
    }

    const row = await this.prisma.cacheEntry.upsert({
      where: {
        organizationId_workspaceId_namespace_cacheKey: {
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
          namespace,
          cacheKey,
        },
      },
      create: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        namespace,
        cacheKey,
        valueJson,
        hits: 0,
        misses: 0,
        expiresAt,
        labels: (input.labels ?? []).slice(0, 16),
        metadata: {
          sandboxLogicalOnly: true,
          semanticMode: namespace === 'semantic' ? 'normalized_hash' : 'exact_key',
        },
      },
      update: {
        valueJson,
        expiresAt,
        labels: (input.labels ?? []).slice(0, 16),
        updatedAt: new Date(),
      },
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'intelligent_cache.put',
      route: 'POST /v1/intelligent-cache/put',
      ip: input.ip,
      metadata: { id: row.id, namespace, cacheKey, ttlSec },
    });

    return {
      entry: this.serialize(row, true),
      ceilings,
      honesty: intelligentCacheCatalog().honesty,
      note: 'Sandbox cache entry stored — Gateway is not auto-wired.',
    };
  }

  async lookup(
    input: AuthCtx & { namespace?: string; key?: string; text?: string },
  ) {
    this.assertEnabled();
    const namespace = this.normalizeNamespace(input.namespace ?? 'translation');
    const cacheKey = this.resolveKey(namespace, input.key, input.text);
    await this.purgeExpired(input);

    const row = await this.prisma.cacheEntry.findUnique({
      where: {
        organizationId_workspaceId_namespace_cacheKey: {
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
          namespace,
          cacheKey,
        },
      },
    });

    if (!row || (row.expiresAt && row.expiresAt.getTime() <= Date.now())) {
      if (row?.expiresAt && row.expiresAt.getTime() <= Date.now()) {
        await this.prisma.cacheEntry.delete({ where: { id: row.id } }).catch(() => undefined);
      }
      // Track miss on a sentinel? Skip — return miss only.
      await this.audit.record({
        organizationId: input.organizationId,
        userId: input.userId,
        action: 'intelligent_cache.miss',
        route: 'POST /v1/intelligent-cache/lookup',
        ip: input.ip,
        metadata: { namespace, cacheKey },
      });
      return {
        hit: false,
        namespace,
        cacheKey,
        entry: null,
        honesty: intelligentCacheCatalog().honesty,
        note: 'Cache miss.',
      };
    }

    const updated = await this.prisma.cacheEntry.update({
      where: { id: row.id },
      data: { hits: { increment: 1 } },
    });

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'intelligent_cache.hit',
      route: 'POST /v1/intelligent-cache/lookup',
      ip: input.ip,
      metadata: { id: row.id, namespace, cacheKey },
    });

    return {
      hit: true,
      namespace,
      cacheKey,
      entry: this.serialize(updated, true),
      honesty: intelligentCacheCatalog().honesty,
      note: 'Cache hit (exact key / normalized hash).',
    };
  }

  async invalidate(
    input: AuthCtx & {
      id?: string;
      namespace?: string;
      key?: string;
      text?: string;
      allInNamespace?: boolean;
    },
  ) {
    this.assertEnabled();
    let deleted = 0;

    if (input.id) {
      const res = await this.prisma.cacheEntry.deleteMany({
        where: {
          id: input.id,
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
        },
      });
      deleted = res.count;
    } else if (input.allInNamespace && input.namespace) {
      const namespace = this.normalizeNamespace(input.namespace);
      const res = await this.prisma.cacheEntry.deleteMany({
        where: {
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
          namespace,
        },
      });
      deleted = res.count;
    } else if (input.namespace && (input.key || input.text)) {
      const namespace = this.normalizeNamespace(input.namespace);
      const cacheKey = this.resolveKey(namespace, input.key, input.text);
      const res = await this.prisma.cacheEntry.deleteMany({
        where: {
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
          namespace,
          cacheKey,
        },
      });
      deleted = res.count;
    } else {
      throw new ApiException(
        'validation_error',
        'Provide id, or namespace+key/text, or namespace with allInNamespace=true',
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.audit.record({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'intelligent_cache.invalidated',
      route: 'POST /v1/intelligent-cache/invalidate',
      ip: input.ip,
      metadata: { deleted },
    });

    return {
      deleted,
      note: 'Sandbox entries removed.',
      honesty: intelligentCacheCatalog().honesty,
    };
  }

  async analytics(input: AuthCtx) {
    await this.purgeExpired(input);
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [total, byNs, sumHits, audits] = await Promise.all([
      this.prisma.cacheEntry.count({
        where: {
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
        },
      }),
      this.prisma.cacheEntry.groupBy({
        by: ['namespace'],
        where: {
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
        },
        _count: true,
        _sum: { hits: true },
      }),
      this.prisma.cacheEntry.aggregate({
        where: {
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
        },
        _sum: { hits: true },
      }),
      this.prisma.auditEvent.count({
        where: {
          organizationId: input.organizationId,
          action: { startsWith: 'intelligent_cache.' },
          createdAt: { gte: since },
        },
      }),
    ]);
    return {
      workspace: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
      },
      entriesTotal: total,
      hitsTotal: sumHits._sum.hits ?? 0,
      byNamespace: byNs.map((r) => ({
        namespace: r.namespace,
        entries: r._count,
        hits: r._sum.hits ?? 0,
      })),
      auditsLast30d: audits,
      note: 'Intelligent Cache analytics. ≠ AI Runtime Analytics.',
    };
  }

  async monitoring(input: AuthCtx) {
    const [engine, analytics] = await Promise.all([
      Promise.resolve(this.engine()),
      this.analytics(input),
    ]);
    return {
      generatedAt: new Date().toISOString(),
      mode: intelligentCacheMode(),
      analytics,
      honesty: engine.honesty,
      spendSafety: engine.spendSafety,
      deferred: engine.capabilities
        .filter((c) => c.status === 'deferred')
        .map((c) => c.id),
      note: 'Intelligent Cache monitoring snapshot.',
    };
  }

  private assertEnabled() {
    if (intelligentCacheMode() === 'disabled') {
      throw new ApiException(
        'intelligent_cache_disabled',
        'Intelligent Cache mode is disabled (LUGEMI_INTELLIGENT_CACHE_MODE=disabled).',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  private normalizeNamespace(raw: string): CacheNamespace {
    const n = raw.toLowerCase() as CacheNamespace;
    if (!CACHE_NAMESPACES.includes(n)) {
      throw new ApiException(
        'validation_error',
        `namespace must be one of ${CACHE_NAMESPACES.join('|')}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return n;
  }

  private resolveKey(
    namespace: CacheNamespace,
    key?: string,
    text?: string,
  ): string {
    if (key?.trim()) return key.trim().slice(0, 256);
    if (text?.trim()) {
      const normalized =
        namespace === 'semantic'
          ? text.trim().toLowerCase().replace(/\s+/g, ' ')
          : text.trim();
      return createHash('sha256').update(`${namespace}:${normalized}`).digest('hex');
    }
    throw new ApiException(
      'validation_error',
      'key or text is required',
      HttpStatus.BAD_REQUEST,
    );
  }

  private async purgeExpired(input: AuthCtx) {
    await this.prisma.cacheEntry.deleteMany({
      where: {
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        expiresAt: { lte: new Date() },
      },
    });
  }

  private serialize(
    r: {
      id: string;
      organizationId: string;
      workspaceId: string;
      namespace: string;
      cacheKey: string;
      valueJson: unknown;
      hits: number;
      misses: number;
      expiresAt: Date | null;
      labels: string[];
      metadata: unknown;
      createdAt: Date;
      updatedAt: Date;
    },
    includeValue: boolean,
  ) {
    return {
      id: r.id,
      organizationId: r.organizationId,
      workspaceId: r.workspaceId,
      namespace: r.namespace,
      cacheKey: r.cacheKey,
      value: includeValue ? r.valueJson : undefined,
      hits: r.hits,
      misses: r.misses,
      expiresAt: r.expiresAt?.toISOString() ?? null,
      labels: r.labels,
      metadata: r.metadata,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    };
  }
}
