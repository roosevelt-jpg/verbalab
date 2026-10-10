import { Controller, Get, Query } from '@nestjs/common';
import { InternalDeveloperPortalService } from './internal-developer-portal.service';

@Controller('v1/internal-developer-portal')
export class InternalDeveloperPortalController {
  constructor(private readonly service: InternalDeveloperPortalService) {}

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

  @Get('portal')
  list(@Query('q') q?: string) {
    return this.service.list(q);
  }

  @Get('query')
  query(@Query('q') q?: string) {
    return this.service.query(q);
  }
}
