import { Controller, Get, Query } from '@nestjs/common';
import { ContinuousEvaluationService } from './continuous-evaluation.service';

@Controller('v1/continuous-evaluation')
export class ContinuousEvaluationController {
  constructor(private readonly service: ContinuousEvaluationService) {}

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

  @Get('gates')
  gates(@Query('q') q?: string) {
    return this.service.gates(q);
  }

  @Get('query')
  query(@Query('q') q?: string) {
    return this.service.query(q);
  }

  @Get('gate-status')
  gateStatus {
    return this.service.gateStatus;
  }
}
