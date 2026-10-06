import { Controller, Get, Query } from '@nestjs/common';
import { ExplainabilityPlatformService } from './explainability-platform.service';

@Controller('v1/explainability-platform')
export class ExplainabilityPlatformController {
  constructor(private readonly service: ExplainabilityPlatformService) {}

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

  @Get('explanations')
  list(@Query('q') q?: string) {
    return this.service.list(q);
  }

  @Get('query')
  query(@Query('q') q?: string) {
    return this.service.query(q);
  }
}
