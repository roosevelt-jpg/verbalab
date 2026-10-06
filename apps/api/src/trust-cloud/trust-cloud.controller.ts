import { Controller, Get, UseGuards } from '@nestjs/common';
import { TrustCloudService } from './trust-cloud.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';

@Controller('v1/trust-cloud')
export class TrustCloudController {
  constructor(private readonly trust: TrustCloudService) {}

  @Get('products')
  products() {
    return this.trust.products();
  }

  @Get('engine')
  engine() {
    return this.trust.products();
  }

  @Get('routing')
  routing() {
    return this.trust.routing();
  }

  @Get('overview')
  @UseGuards(ClerkAuthGuard)
  overview(@CurrentSession() session: SessionContext) {
    return this.trust.overview(session);
  }

  @Get('monitoring')
  monitoring() {
    return this.trust.monitoring();
  }
}
