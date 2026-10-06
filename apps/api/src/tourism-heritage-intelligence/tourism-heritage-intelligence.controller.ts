import { Controller, Get, Query } from '@nestjs/common';
import { TourismHeritageIntelligenceService } from './tourism-heritage-intelligence.service';

@Controller('v1/tourism-heritage-intelligence')
export class TourismHeritageIntelligenceController {
  constructor(private readonly service: TourismHeritageIntelligenceService) {}

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

  @Get('terms')
  terms(@Query('q') q?: string) {
    return this.service.terms(q);
  }

  @Get('query')
  query(@Query('q') q?: string) {
    return this.service.query(q);
  }
}
