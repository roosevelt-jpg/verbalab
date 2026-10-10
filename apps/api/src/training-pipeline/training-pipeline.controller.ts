import { Controller, Get, Query } from '@nestjs/common';
import { TrainingPipelineService } from './training-pipeline.service';

@Controller('v1/training-pipeline')
export class TrainingPipelineController {
  constructor(private readonly service: TrainingPipelineService) {}

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

  @Get('jobs')
  jobs(@Query('q') q?: string) {
    return this.service.jobs(q);
  }

  @Get('query')
  query(@Query('q') q?: string) {
    return this.service.query(q);
  }
}
