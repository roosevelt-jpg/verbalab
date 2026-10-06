import { Controller, Get, Query } from '@nestjs/common';
import { SyntheticDataPlatformService } from './synthetic-data-platform.service';

@Controller('v1/synthetic-data-platform')
export class SyntheticDataPlatformController {
  constructor(private readonly service: SyntheticDataPlatformService) {}

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

  @Get('artifacts')
  artifacts(@Query('q') q?: string) {
    return this.service.artifacts(q);
  }

  @Get('query')
  query(@Query('q') q?: string) {
    return this.service.query(q);
  }
}
