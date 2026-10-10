import { Controller, Get, UseGuards } from '@nestjs/common';
import { DataPlaneCloudService } from './data-plane-cloud.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';

@Controller('v1/data-plane-cloud')
export class DataPlaneCloudController {
  constructor(private readonly dp: DataPlaneCloudService) {}

  @Get('products')
  products() {
    return this.dp.products();
  }

  @Get('engine')
  engine() {
    return this.dp.products();
  }

  @Get('routing')
  routing() {
    return this.dp.routing();
  }

  @Get('overview')
  @UseGuards(ClerkAuthGuard)
  overview(@CurrentSession() session: SessionContext) {
    return this.dp.overview(session);
  }

  @Get('monitoring')
  monitoring() {
    return this.dp.monitoring();
  }
}
