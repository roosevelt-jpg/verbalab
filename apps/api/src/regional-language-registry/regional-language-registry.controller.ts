import { Controller, Get, Query } from '@nestjs/common';
import { RegionalLanguageRegistryService } from './regional-language-registry.service';

@Controller('v1/regional-language-registry')
export class RegionalLanguageRegistryController {
  constructor(private readonly registry: RegionalLanguageRegistryService) {}

  @Get('engine')
  engine() {
    return this.registry.engine();
  }

  @Get('products')
  products() {
    return this.registry.engine();
  }

  @Get('monitoring')
  monitoring() {
    return this.registry.monitoring();
  }

  @Get('regions')
  regions() {
    return this.registry.regions();
  }

  @Get('languages')
  languages(@Query('region') region?: string, @Query('q') q?: string) {
    return this.registry.languages(region, q);
  }
}
