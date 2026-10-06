import { Controller, Get, Query } from '@nestjs/common';
import { GlobalPolicyEngineService } from './global-policy-engine.service';

@Controller('v1/global-policy-engine')
export class GlobalPolicyEngineController {
  constructor(private readonly service: GlobalPolicyEngineService) {}

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

  @Get('policies')
  list(@Query('q') q?: string) {
    return this.service.list(q);
  }

  @Get('query')
  query(@Query('q') q?: string) {
    return this.service.query(q);
  }
}
