import { Controller, Get, Query } from '@nestjs/common';
import { PatentInnovationPlatformService } from './patent-innovation-platform.service';

@Controller('v1/patent-innovation-platform')
export class PatentInnovationPlatformController {
  constructor(private readonly service: PatentInnovationPlatformService) {}

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

  @Get('portfolio')
  portfolio(@Query('q') q?: string) {
    return this.service.portfolio(q);
  }

  @Get('query')
  query(@Query('q') q?: string) {
    return this.service.query(q);
  }
}
