import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { RateLimitService } from './rate-limit.service';
import { TranslateAuthContext } from '../common/guards/translate-auth.guard';
import { ApiException } from '../common/errors/api-exception';
import { planFromId } from '../billing/plans';
import { getHttpPair } from '../common/http/execution-request';

/**
 * Runs after TranslateAuthGuard. Enforces per-key and per-org request limits.
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly rateLimits: RateLimitService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const { req, res } = getHttpPair(context);
    const request = req as Request & { translateAuth?: TranslateAuthContext };
    const auth = request.translateAuth;
    if (!auth?.organizationId) {
      return true;
    }

    const org = await this.prisma.organization.findUnique({
      where: { id: auth.organizationId },
      select: { plan: true },
    });
    const plan = planFromId(org?.plan ?? 'free');

    const orgHit = await this.rateLimits.consume({
      scope: 'org',
      id: auth.organizationId,
      limit: plan.rateLimitPerOrg,
    });

    let keyHit = orgHit;
    if (auth.apiKeyId) {
      keyHit = await this.rateLimits.consume({
        scope: 'key',
        id: auth.apiKeyId,
        limit: plan.rateLimitPerKey,
      });
    }

    const limiting = !orgHit.allowed
      ? orgHit
      : !keyHit.allowed
        ? keyHit
        : keyHit.remaining <= orgHit.remaining
          ? keyHit
          : orgHit;

    if (res && typeof res.setHeader === 'function') {
      res.setHeader('X-RateLimit-Limit', String(limiting.limit));
      res.setHeader('X-RateLimit-Remaining', String(limiting.remaining));
      res.setHeader('X-RateLimit-Scope', limiting.scope);
    }

    if (!orgHit.allowed || !keyHit.allowed) {
      const denied = !orgHit.allowed ? orgHit : keyHit;
      if (res && typeof res.setHeader === 'function') {
        res.setHeader('Retry-After', String(denied.retryAfterSec));
      }
      throw new ApiException(
        'rate_limited',
        `Rate limit exceeded (${denied.scope}). Retry after ${denied.retryAfterSec}s.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}
