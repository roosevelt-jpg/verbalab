import { Controller, Get, Query } from '@nestjs/common';
import { AiOperationsDashboardService } from './ai-operations-dashboard.service';

@Controller('v1/ai-operations-dashboard')
export class AiOperationsDashboardController {
  constructor(private readonly service: AiOperationsDashboardService) {}

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
