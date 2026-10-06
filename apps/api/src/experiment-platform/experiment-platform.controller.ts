import { Controller, Get, Query } from '@nestjs/common';
import { ExperimentPlatformService } from './experiment-platform.service';

@Controller('v1/experiment-platform')
export class ExperimentPlatformController {
  constructor(private readonly service: ExperimentPlatformService) {}

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

  @Get('runs')
  runs(@Query('q') q?: string) {
    return this.service.runs(q);
  }

  @Get('query')
  query(@Query('q') q?: string) {
    return this.service.query(q);
  }
}
