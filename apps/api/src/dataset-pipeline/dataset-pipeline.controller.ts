import { Controller, Get, Query } from '@nestjs/common';
import { DatasetPipelineService } from './dataset-pipeline.service';

@Controller('v1/dataset-pipeline')
export class DatasetPipelineController {
  constructor(private readonly service: DatasetPipelineService) {}

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

  @Get('runs')
  runs(@Query('q') q?: string) {
    return this.service.runs(q);
  }

  @Get('query')
  query(@Query('q') q?: string) {
    return this.service.query(q);
  }
}
