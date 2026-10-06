import { Controller, Get, Query } from '@nestjs/common';
import { EvaluationPlatformService } from './evaluation-platform.service';

@Controller('v1/evaluation-platform')
export class EvaluationPlatformController {
  constructor(private readonly service: EvaluationPlatformService) {}

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

  @Get('capabilities')
  capabilities(@Query('q') q?: string) {
    return this.service.capabilities(q);
  }

  @Get('query')
  query(@Query('q') q?: string) {
    return this.service.query(q);
  }
}
