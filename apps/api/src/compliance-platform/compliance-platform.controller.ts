import { Controller, Get, Query } from '@nestjs/common';
import { CompliancePlatformService } from './compliance-platform.service';

@Controller('v1/compliance-platform')
export class CompliancePlatformController {
  constructor(private readonly service: CompliancePlatformService) {}

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

  @Get('controls')
  list(@Query('q') q?: string) {
    return this.service.list(q);
  }

  @Get('query')
  query(@Query('q') q?: string) {
    return this.service.query(q);
  }
}
