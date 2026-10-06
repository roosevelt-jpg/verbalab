import { Controller, Get, Query } from '@nestjs/common';
import { AfricanLanguageRegistryService } from './african-language-registry.service';

@Controller('v1/african-language-registry')
export class AfricanLanguageRegistryController {
  constructor(private readonly registry: AfricanLanguageRegistryService) {}

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

  @Get('languages')
  languages(@Query('q') q?: string) {
    return this.registry.languages(q);
  }

  @Get('families')
  families() {
    return this.registry.families();
  }
}
