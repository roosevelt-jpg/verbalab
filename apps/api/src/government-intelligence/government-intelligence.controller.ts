import { Controller, Get, Query } from '@nestjs/common';
import { GovernmentIntelligenceService } from './government-intelligence.service';

@Controller('v1/government-intelligence')
export class GovernmentIntelligenceController {
  constructor(private readonly service: GovernmentIntelligenceService) {}

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
