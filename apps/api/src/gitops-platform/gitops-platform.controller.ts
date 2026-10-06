import { Controller, Get, Query } from '@nestjs/common';
import { GitopsPlatformService } from './gitops-platform.service';

@Controller('v1/gitops-platform')
export class GitopsPlatformController {
  constructor(private readonly service: GitopsPlatformService) {}

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

  @Get('readiness')
  list(@Query('q') q?: string) {
    return this.service.list(q);
  }

  @Get('query')
  query(@Query('q') q?: string) {
    return this.service.query(q);
  }
}
