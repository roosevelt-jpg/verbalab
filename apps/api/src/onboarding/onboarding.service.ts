import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ApiException } from '../common/errors/api-exception';
import {
  EMPTY_ONBOARDING,
  ONBOARDING_PERSONAS,
  ONBOARDING_PLAN_IDS,
  ONBOARDING_PLATFORMS,
  type OnboardingBillingInterval,
  type OnboardingPersona,
  type OnboardingPlanId,
  type OnboardingPlatform,
  type OnboardingProfile,
} from './onboarding.types';

const AUDIT_ACTION = 'onboarding.profile';

type SaveInput = {
  userId: string;
  organizationId: string;
  workspaceId: string;
  ip?: string;
  patch: Partial<OnboardingProfile> & { complete?: boolean };
};

@Injectable()
export class OnboardingService {
  /** Soft fallback when audit/DB is unavailable. */
  private readonly memory = new Map<string, OnboardingProfile>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async get(input: {
    userId: string;
    organizationId: string;
  }): Promise<{ profile: OnboardingProfile; source: 'audit' | 'memory' | 'empty' }> {
    try {
      const row = await this.prisma.auditEvent.findFirst({
        where: {
          organizationId: input.organizationId,
          userId: input.userId,
          action: AUDIT_ACTION,
        },
        orderBy: { createdAt: 'desc' },
      });
      if (row?.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)) {
        const profile = this.normalize(row.metadata as Record<string, unknown>);
        this.memory.set(this.key(input.organizationId, input.userId), profile);
        return { profile, source: 'audit' };
      }
    } catch {
      /* soft-fail to memory */
    }

    const cached = this.memory.get(this.key(input.organizationId, input.userId));
    if (cached) return { profile: cached, source: 'memory' };
    return { profile: { ...EMPTY_ONBOARDING }, source: 'empty' };
  }

  async save(input: SaveInput): Promise<{ profile: OnboardingProfile; persisted: boolean }> {
    const current = (await this.get({
      userId: input.userId,
      organizationId: input.organizationId,
    })).profile;

    const next = this.merge(current, input.patch);
    if (input.patch.complete) {
      next.completed = true;
      next.completedAt = new Date().toISOString();
      next.step = Math.max(next.step, 4);
    }

    this.memory.set(this.key(input.organizationId, input.userId), next);

    let persisted = false;
    try {
      if (next.displayName?.trim()) {
        await this.prisma.user.update({
          where: { id: input.userId },
          data: { name: next.displayName.trim() },
        });
      }
      if (next.preferredLanguage?.trim()) {
        const lang = next.preferredLanguage.trim();
        await this.prisma.workspace.update({
          where: { id: input.workspaceId },
          data: {
            defaultTargetLang: lang.includes('-') ? lang.split('-')[0]! : lang,
          },
        });
      }
      await this.audit.record({
        organizationId: input.organizationId,
        userId: input.userId,
        action: AUDIT_ACTION,
        route: '/v1/onboarding',
        ip: input.ip,
        metadata: next as unknown as Prisma.InputJsonValue,
      });
      persisted = true;
    } catch {
      persisted = false;
    }

    return { profile: next, persisted };
  }

  private key(organizationId: string, userId: string) {
    return `${organizationId}:${userId}`;
  }

  private merge(
    current: OnboardingProfile,
    patch: Partial<OnboardingProfile> & { complete?: boolean },
  ): OnboardingProfile {
    const next: OnboardingProfile = { ...current };

    if (patch.platform !== undefined) {
      next.platform = this.requirePlatform(patch.platform);
    }
    if (patch.displayName !== undefined) {
      next.displayName = this.optionalString(patch.displayName, 120);
    }
    if (patch.preferredLanguage !== undefined) {
      next.preferredLanguage = this.optionalString(patch.preferredLanguage, 64);
    }
    if (patch.referralSource !== undefined) {
      next.referralSource = this.optionalString(patch.referralSource, 200);
    }
    if (patch.ageConfirmed !== undefined) {
      next.ageConfirmed = Boolean(patch.ageConfirmed);
    }
    if (patch.persona !== undefined) {
      next.persona = this.requirePersona(patch.persona);
    }
    if (patch.planId !== undefined) {
      next.planId = this.requirePlan(patch.planId);
    }
    if (patch.billingInterval !== undefined) {
      next.billingInterval = this.requireInterval(patch.billingInterval);
    }
    if (typeof patch.step === 'number' && Number.isFinite(patch.step)) {
      next.step = Math.max(0, Math.min(4, Math.floor(patch.step)));
    }
    if (patch.completed === true) {
      next.completed = true;
      next.completedAt = patch.completedAt ?? new Date().toISOString();
    }

    return next;
  }

  private normalize(raw: Record<string, unknown>): OnboardingProfile {
    return this.merge({ ...EMPTY_ONBOARDING }, {
      platform: (raw.platform as OnboardingPlatform | null) ?? null,
      displayName: (raw.displayName as string | null) ?? null,
      preferredLanguage: (raw.preferredLanguage as string | null) ?? null,
      referralSource: (raw.referralSource as string | null) ?? null,
      ageConfirmed: Boolean(raw.ageConfirmed),
      persona: (raw.persona as OnboardingPersona | null) ?? null,
      planId: (raw.planId as OnboardingPlanId | null) ?? null,
      billingInterval: (raw.billingInterval as OnboardingBillingInterval) ?? 'monthly',
      completed: Boolean(raw.completed),
      completedAt: typeof raw.completedAt === 'string' ? raw.completedAt : null,
      step: typeof raw.step === 'number' ? raw.step : 0,
    });
  }

  private optionalString(value: string | null, max: number): string | null {
    if (value == null) return null;
    const trimmed = String(value).trim();
    if (!trimmed) return null;
    return trimmed.slice(0, max);
  }

  private requirePlatform(value: OnboardingPlatform | null): OnboardingPlatform | null {
    if (value == null) return null;
    if (!ONBOARDING_PLATFORMS.includes(value)) {
      throw new ApiException('validation_error', 'Invalid platform', HttpStatus.BAD_REQUEST);
    }
    return value;
  }

  private requirePersona(value: OnboardingPersona | null): OnboardingPersona | null {
    if (value == null) return null;
    if (!ONBOARDING_PERSONAS.includes(value)) {
      throw new ApiException('validation_error', 'Invalid persona', HttpStatus.BAD_REQUEST);
    }
    return value;
  }

  private requirePlan(value: OnboardingPlanId | null): OnboardingPlanId | null {
    if (value == null) return null;
    if (!ONBOARDING_PLAN_IDS.includes(value)) {
      throw new ApiException('validation_error', 'Invalid planId', HttpStatus.BAD_REQUEST);
    }
    return value;
  }

  private requireInterval(value: OnboardingBillingInterval): OnboardingBillingInterval {
    if (value !== 'monthly' && value !== 'yearly') {
      throw new ApiException(
        'validation_error',
        'billingInterval must be monthly or yearly',
        HttpStatus.BAD_REQUEST,
      );
    }
    return value;
  }
}
