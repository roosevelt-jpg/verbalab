import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { OnboardingService } from './onboarding.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';
import { clientIp } from '../common/http/client-ip';
import type {
  OnboardingBillingInterval,
  OnboardingPersona,
  OnboardingPlanId,
  OnboardingPlatform,
  OnboardingProfile,
} from './onboarding.types';

@Controller('v1/onboarding')
@UseGuards(ClerkAuthGuard)
export class OnboardingController {
  constructor(private readonly onboarding: OnboardingService) {}

  @Get()
  async get(@CurrentSession() session: SessionContext) {
    const result = await this.onboarding.get({
      userId: session.userId,
      organizationId: session.organizationId,
    });
    return {
      ...result.profile,
      source: result.source,
      destinations: {
        creative: '/creative',
        agents: '/chat',
      },
    };
  }

  @Post()
  async save(
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Body()
    body: Partial<OnboardingProfile> & {
      complete?: boolean;
      platform?: OnboardingPlatform | null;
      persona?: OnboardingPersona | null;
      planId?: OnboardingPlanId | null;
      billingInterval?: OnboardingBillingInterval;
    },
  ) {
    const result = await this.onboarding.save({
      userId: session.userId,
      organizationId: session.organizationId,
      workspaceId: session.workspaceId,
      ip: clientIp(req),
      patch: body ?? {},
    });
    return {
      ...result.profile,
      persisted: result.persisted,
      destinations: {
        creative: '/creative',
        agents: '/chat',
      },
    };
  }
}
