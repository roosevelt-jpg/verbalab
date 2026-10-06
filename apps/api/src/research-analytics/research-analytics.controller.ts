import { Controller, Get, Query } from '@nestjs/common';
import { ResearchAnalyticsService } from './research-analytics.service';

@Controller('v1/research-analytics')
export class ResearchAnalyticsController {
  constructor(private readonly service: ResearchAnalyticsService) {}

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
  snapshot(@Query('q') q?: string) {
    return this.service.snapshot(q);
  }

  @Get('query')
  query(@Query('q') q?: string) {
    return this.service.query(q);
  }
}
