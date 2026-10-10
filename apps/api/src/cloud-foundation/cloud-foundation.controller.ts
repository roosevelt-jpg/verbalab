import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { FeatureFlagsService } from './feature-flags.service';
import { CloudOverviewService } from './cloud-overview.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';

@Controller('v1')
@UseGuards(ClerkAuthGuard)
export class CloudFoundationController {
  constructor(
    private readonly flags: FeatureFlagsService,
    private readonly overview: CloudOverviewService,
  ) {}

  @Get('feature-flags')
  featureFlags(@CurrentSession() session: SessionContext) {
    return this.flags.forOrganization(session.organizationId);
  }

  @Patch('feature-flags')
  patchFeatureFlags(
    @CurrentSession() session: SessionContext,
    @Body() body: { overrides?: Record<string, boolean | null> },
  ) {
    return this.flags.patchOverrides({
      organizationId: session.organizationId,
      role: session.role,
      patch: body?.overrides ?? {},
    });
  }

  @Get('cloud/overview')
  cloudOverview(@CurrentSession() session: SessionContext) {
    return this.overview.get(session);
  }
}
