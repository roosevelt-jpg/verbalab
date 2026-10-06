import { Controller, Get, UseGuards } from '@nestjs/common';
import { ControlPlaneCloudService } from './control-plane-cloud.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';

@Controller('v1/control-plane-cloud')
export class ControlPlaneCloudController {
  constructor(private readonly cp: ControlPlaneCloudService) {}

  @Get('products')
  products {
    return this.cp.products;
  }

  @Get('engine')
  engine {
    return this.cp.products;
  }

  @Get('routing')
  routing {
    return this.cp.routing;
  }

  @Get('overview')
  @UseGuards(ClerkAuthGuard)
  overview(@CurrentSession session: SessionContext) {
    return this.cp.overview(session);
  }

  @Get('monitoring')
  monitoring {
    return this.cp.monitoring;
  }
}
