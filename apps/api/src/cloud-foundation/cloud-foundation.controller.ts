import { Controller, Get, UseGuards } from '@nestjs/common';
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
  featureFlags(@CurrentSession session: SessionContext) {
    return this.flags.forOrganization(session.organizationId);
  }

  @Get('cloud/overview')
  cloudOverview(@CurrentSession session: SessionContext) {
    return this.overview.get(session);
  }
}
