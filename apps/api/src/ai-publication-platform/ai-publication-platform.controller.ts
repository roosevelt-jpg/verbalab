import { Controller, Get, Query } from '@nestjs/common';
import { AiPublicationPlatformService } from './ai-publication-platform.service';

@Controller('v1/ai-publication-platform')
export class AiPublicationPlatformController {
  constructor(private readonly service: AiPublicationPlatformService) {}

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

  @Get('publications')
  publications(@Query('q') q?: string) {
    return this.service.publications(q);
  }

  @Get('query')
  query(@Query('q') q?: string) {
    return this.service.query(q);
  }
}
