import { Controller, Get, Query } from '@nestjs/common';
import { ReliabilityEngineeringService } from './reliability-engineering.service';

@Controller('v1/reliability-engineering')
export class ReliabilityEngineeringController {
  constructor(private readonly service: ReliabilityEngineeringService) {}

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

  @Get('reliability')
  list(@Query('q') q?: string) {
    return this.service.list(q);
  }

  @Get('query')
  query(@Query('q') q?: string) {
    return this.service.query(q);
  }
}
