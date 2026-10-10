import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OnboardingService } from '../src/onboarding/onboarding.service';
import { EMPTY_ONBOARDING } from '../src/onboarding/onboarding.types';

describe('OnboardingService', () => {
  const prisma = {
    auditEvent: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    user: { update: vi.fn() },
    workspace: { update: vi.fn() },
  };
  const audit = {
    record: vi.fn().mockResolvedValue({ id: 'a1' }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    prisma.auditEvent.findFirst.mockResolvedValue(null);
    prisma.user.update.mockResolvedValue({});
    prisma.workspace.update.mockResolvedValue({});
  });

  it('returns empty profile when nothing stored', async () => {
    const svc = new OnboardingService(prisma as never, audit as never);
    const res = await svc.get({ userId: 'u1', organizationId: 'o1' });
    expect(res.source).toBe('empty');
    expect(res.profile).toEqual(EMPTY_ONBOARDING);
  });

  it('persists platform and completes onboarding', async () => {
    const svc = new OnboardingService(prisma as never, audit as never);
    const saved = await svc.save({
      userId: 'u1',
      organizationId: 'o1',
      workspaceId: 'w1',
      patch: {
        platform: 'agents',
        displayName: 'PulseBridge',
        preferredLanguage: 'ak-GH',
        ageConfirmed: true,
        persona: 'engineer',
        planId: 'pro',
        complete: true,
      },
    });
    expect(saved.profile.platform).toBe('agents');
    expect(saved.profile.completed).toBe(true);
    expect(saved.profile.planId).toBe('pro');
    expect(audit.record).toHaveBeenCalled();
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'u1' },
        data: { name: 'PulseBridge' },
      }),
    );
    expect(prisma.workspace.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { defaultTargetLang: 'ak' },
      }),
    );

    const again = await svc.get({ userId: 'u1', organizationId: 'o1' });
    expect(again.source).toBe('memory');
    expect(again.profile.platform).toBe('agents');
  });

  it('rejects invalid platform', async () => {
    const svc = new OnboardingService(prisma as never, audit as never);
    await expect(
      svc.save({
        userId: 'u1',
        organizationId: 'o1',
        workspaceId: 'w1',
        patch: { platform: 'not-a-platform' as never },
      }),
    ).rejects.toMatchObject({ code: 'validation_error' });
  });
});
