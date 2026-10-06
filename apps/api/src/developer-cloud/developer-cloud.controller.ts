import { Controller, Get, UseGuards } from '@nestjs/common';
import { DeveloperCloudService } from './developer-cloud.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';

@Controller('v1/developer')
export class DeveloperCloudController {
  constructor(private readonly developer: DeveloperCloudService) {}

  @Get('sdk')
  sdk() {
    return this.developer.sdk();
  }

  @Get('overview')
  @UseGuards(ClerkAuthGuard)
  overview(@CurrentSession() session: SessionContext) {
    return this.developer.overview(session);
  }
}
