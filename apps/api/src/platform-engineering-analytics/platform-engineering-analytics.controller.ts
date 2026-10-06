import { Controller, Get, Query } from '@nestjs/common';
import { PlatformEngineeringAnalyticsService } from './platform-engineering-analytics.service';

@Controller('v1/platform-engineering-analytics')
export class PlatformEngineeringAnalyticsController {
  constructor(private readonly service: PlatformEngineeringAnalyticsService) {}

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
