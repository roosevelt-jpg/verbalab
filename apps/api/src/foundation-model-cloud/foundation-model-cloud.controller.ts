import { Controller, Get, UseGuards } from '@nestjs/common';
import { FoundationModelCloudService } from './foundation-model-cloud.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';

@Controller('v1/foundation-model-cloud')
export class FoundationModelCloudController {
  constructor(private readonly cloud: FoundationModelCloudService) {}

  @Get('products')
  products() {
    return this.cloud.products();
  }

  @Get('engine')
  engine() {
    return this.cloud.products();
  }

  @Get('overview')
  @UseGuards(ClerkAuthGuard)
  overview(@CurrentSession() session: SessionContext) {
    return this.cloud.overview(session);
  }

  @Get('monitoring')
  monitoring() {
    return this.cloud.monitoring();
  }
}
