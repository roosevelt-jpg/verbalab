import { Controller, Get, Query } from '@nestjs/common';
import { GlobalConfigurationPlatformService } from './global-configuration-platform.service';

@Controller('v1/global-configuration-platform')
export class GlobalConfigurationPlatformController {
  constructor(private readonly service: GlobalConfigurationPlatformService) {}

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

  @Get('configurations')
  list(@Query('q') q?: string) {
    return this.service.list(q);
  }

  @Get('query')
  query(@Query('q') q?: string) {
    return this.service.query(q);
  }
}
