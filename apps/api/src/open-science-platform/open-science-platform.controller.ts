import { Controller, Get, Query } from '@nestjs/common';
import { OpenSciencePlatformService } from './open-science-platform.service';

@Controller('v1/open-science-platform')
export class OpenSciencePlatformController {
  constructor(private readonly service: OpenSciencePlatformService) {}

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

  @Get('releases')
  releases(@Query('q') q?: string) {
    return this.service.releases(q);
  }

  @Get('query')
  query(@Query('q') q?: string) {
    return this.service.query(q);
  }

  @Get('check')
  check(@Query('id') id?: string) {
    if (!id) {
      return { error: 'id query parameter required' };
    }
    return this.service.checkRelease(id);
  }

  @Get('release')
  release(@Query('id') id?: string) {
    if (!id) {
      return { error: 'id query parameter required' };
    }
    return this.service.release(id);
  }
}
