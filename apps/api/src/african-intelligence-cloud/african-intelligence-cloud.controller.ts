import { Controller, Get, UseGuards } from '@nestjs/common';
import { AfricanIntelligenceCloudService } from './african-intelligence-cloud.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';

@Controller('v1/african-intelligence-cloud')
export class AfricanIntelligenceCloudController {
  constructor(private readonly african: AfricanIntelligenceCloudService) {}

  @Get('products')
  products {
    return this.african.products;
  }

  @Get('engine')
  engine {
    return this.african.products;
  }

  @Get('routing')
  routing {
    return this.african.routing;
  }

  @Get('overview')
  @UseGuards(ClerkAuthGuard)
  overview(@CurrentSession session: SessionContext) {
    return this.african.overview(session);
  }

  @Get('monitoring')
  monitoring {
    return this.african.monitoring;
  }
}
