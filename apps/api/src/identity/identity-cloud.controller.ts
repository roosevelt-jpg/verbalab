import { Controller, Get, UseGuards } from '@nestjs/common';
import { IdentityCloudService } from './identity-cloud.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';

@Controller('v1/identity')
@UseGuards(ClerkAuthGuard)
export class IdentityCloudController {
  constructor(private readonly identityCloud: IdentityCloudService) {}

  @Get('me')
  me(@CurrentSession session: SessionContext) {
    return this.identityCloud.me(session);
  }

  @Get('overview')
  overview(@CurrentSession session: SessionContext) {
    return this.identityCloud.overview(session);
  }
}
