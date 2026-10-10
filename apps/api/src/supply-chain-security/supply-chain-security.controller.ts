import { Controller, Get, Query } from '@nestjs/common';
import { SupplyChainSecurityService } from './supply-chain-security.service';

@Controller('v1/supply-chain-security')
export class SupplyChainSecurityController {
  constructor(private readonly service: SupplyChainSecurityService) {}

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

  @Get('findings')
  findings(@Query('q') q?: string) {
    return this.service.findings(q);
  }

  @Get('scan')
  scan() {
    return this.service.scan();
  }

  @Get('query')
  query(@Query('q') q?: string) {
    return this.service.query(q);
  }
}
