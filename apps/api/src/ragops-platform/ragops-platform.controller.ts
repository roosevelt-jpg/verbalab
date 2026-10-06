import { Controller, Get, Query } from '@nestjs/common';
import { RagopsPlatformService } from './ragops-platform.service';

@Controller('v1/ragops-platform')
export class RagopsPlatformController {
  constructor(private readonly service: RagopsPlatformService) {}

  @Get('engine')
  engine() {
    return this.service.engine();
  }

  @Get('products')
  products() {
    return this.service.engine();
  }

  @Get('monitoring')
  monitoring() {
    return this.service.monitoring();
  }

  @Get('pipelines')
  pipelines(@Query('q') q?: string) {
    return this.service.pipelines(q);
  }

  @Get('query')
  query(@Query('q') q?: string) {
    return this.service.query(q);
  }
}
