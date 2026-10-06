import { Controller, Get, Query } from '@nestjs/common';
import { RiskIntelligenceService } from './risk-intelligence.service';

@Controller('v1/risk-intelligence')
export class RiskIntelligenceController {
  constructor(private readonly service: RiskIntelligenceService) {}

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

  @Get('scores')
  list(@Query('q') q?: string) {
    return this.service.list(q);
  }

  @Get('query')
  query(@Query('q') q?: string) {
    return this.service.query(q);
  }
}
