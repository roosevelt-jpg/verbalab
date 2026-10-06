import { Controller, Get, Query } from '@nestjs/common';
import { AiDriftDetectionService } from './ai-drift-detection.service';

@Controller('v1/ai-drift-detection')
export class AiDriftDetectionController {
  constructor(private readonly service: AiDriftDetectionService) {}

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

  @Get('signals')
  signals(@Query('q') q?: string) {
    return this.service.signals(q);
  }

  @Get('query')
  query(@Query('q') q?: string) {
    return this.service.query(q);
  }

  @Get('check')
  check {
    return this.service.check;
  }
}
