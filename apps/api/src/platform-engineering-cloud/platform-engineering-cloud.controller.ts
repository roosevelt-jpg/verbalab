import { Controller, Get, UseGuards } from '@nestjs/common';
import { PlatformEngineeringCloudService } from './platform-engineering-cloud.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';

@Controller('v1/platform-engineering-cloud')
export class PlatformEngineeringCloudController {
  constructor(private readonly pe: PlatformEngineeringCloudService) {}

  @Get('products')
  products() {
    return this.pe.products();
  }

  @Get('engine')
  engine() {
    return this.pe.products();
  }

  @Get('routing')
  routing() {
    return this.pe.routing();
  }

  @Get('overview')
  @UseGuards(ClerkAuthGuard)
  overview(@CurrentSession() session: SessionContext) {
    return this.pe.overview(session);
  }

  @Get('monitoring')
  monitoring() {
    return this.pe.monitoring();
  }
}
