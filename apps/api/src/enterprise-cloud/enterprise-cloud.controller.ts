import { Controller, Get, UseGuards } from '@nestjs/common';
import { EnterpriseCloudService } from './enterprise-cloud.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';

@Controller('v1/enterprise')
@UseGuards(ClerkAuthGuard)
export class EnterpriseCloudController {
  constructor(private readonly enterprise: EnterpriseCloudService) {}

  @Get('overview')
  overview(@CurrentSession session: SessionContext) {
    return this.enterprise.overview(session);
  }

  @Get('policies')
  policies(@CurrentSession session: SessionContext) {
    return this.enterprise.policies(session.organizationId);
  }
}
