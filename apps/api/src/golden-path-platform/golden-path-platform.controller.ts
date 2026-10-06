import { Controller, Get, Query } from '@nestjs/common';
import { GoldenPathPlatformService } from './golden-path-platform.service';

@Controller('v1/golden-path-platform')
export class GoldenPathPlatformController {
  constructor(private readonly service: GoldenPathPlatformService) {}

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

  @Get('templates')
  list(@Query('q') q?: string) {
    return this.service.list(q);
  }

  @Get('query')
  query(@Query('q') q?: string) {
    return this.service.query(q);
  }
}
