import { Controller, Get, Query } from '@nestjs/common';
import { FinancialIntelligenceService } from './financial-intelligence.service';

@Controller('v1/financial-intelligence')
export class FinancialIntelligenceController {
  constructor(private readonly service: FinancialIntelligenceService) {}

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

  @Get('terms')
  terms(@Query('q') q?: string) {
    return this.service.terms(q);
  }

  @Get('query')
  query(@Query('q') q?: string) {
    return this.service.query(q);
  }
}
