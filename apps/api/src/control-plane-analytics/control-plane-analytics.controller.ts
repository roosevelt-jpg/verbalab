import { Controller, Get, Query } from '@nestjs/common';
import { ControlPlaneAnalyticsService } from './control-plane-analytics.service';

@Controller('v1/control-plane-analytics')
export class ControlPlaneAnalyticsController {
  constructor(private readonly service: ControlPlaneAnalyticsService) {}

  @Get('engine')
  engine {
    return this.service.engine;
  }

  @Get('products')
  products {
    return this.service.engine;
  }

  @Get('monitoring')
  monitoring {
    return this.service.monitoring;
  }

  @Get('snapshot')
  list(@Query('q') q?: string) {
    return this.service.list(q);
  }

  @Get('query')
  query(@Query('q') q?: string) {
    return this.service.query(q);
  }
}
