import { Controller, Get, Query } from '@nestjs/common';
import { CulturalIntelligenceService } from './cultural-intelligence.service';

@Controller('v1/cultural-intelligence')
export class CulturalIntelligenceController {
  constructor(private readonly cultural: CulturalIntelligenceService) {}

  @Get('engine')
  engine() {
    return this.cultural.engine();
  }

  @Get('products')
  products() {
    return this.cultural.engine();
  }

  @Get('monitoring')
  monitoring() {
    return this.cultural.monitoring();
  }

  @Get('entries')
  entries(
    @Query('consentStatus') consentStatus?: string,
    @Query('kind') kind?: string,
    @Query('q') q?: string,
  ) {
    return this.cultural.entries({ consentStatus, kind, q });
  }
}
