import { Controller, Get, Query } from '@nestjs/common';
import { TrustAnalyticsService } from './trust-analytics.service';

@Controller('v1/trust-analytics')
export class TrustAnalyticsController {
  constructor(private readonly service: TrustAnalyticsService) {}

  @Get('engine')
  engine() {
    return this.service.engine();
  }

  @Get('products')
  products() {
    return this.service.engine();
  }

  @Get('monitoring')
  monitoring() {
    return this.service.monitoring();
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
