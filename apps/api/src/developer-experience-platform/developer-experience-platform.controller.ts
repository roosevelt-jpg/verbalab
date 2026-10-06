import { Controller, Get, Query } from '@nestjs/common';
import { DeveloperExperiencePlatformService } from './developer-experience-platform.service';

@Controller('v1/developer-experience-platform')
export class DeveloperExperiencePlatformController {
  constructor(private readonly service: DeveloperExperiencePlatformService) {}

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

  @Get('devex')
  list(@Query('q') q?: string) {
    return this.service.list(q);
  }

  @Get('query')
  query(@Query('q') q?: string) {
    return this.service.query(q);
  }
}
