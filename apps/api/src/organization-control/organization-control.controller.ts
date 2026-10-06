import { Controller, Get, Query } from '@nestjs/common';
import { OrganizationControlService } from './organization-control.service';

@Controller('v1/organization-control')
export class OrganizationControlController {
  constructor(private readonly service: OrganizationControlService) {}

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

  @Get('organizations')
  list(@Query('q') q?: string) {
    return this.service.list(q);
  }

  @Get('roles')
  roles() {
    return this.service.roles();
  }

  @Get('query')
  query(@Query('q') q?: string) {
    return this.service.query(q);
  }
}
