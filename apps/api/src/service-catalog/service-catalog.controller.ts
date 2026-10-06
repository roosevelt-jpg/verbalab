import { Controller, Get, Query } from '@nestjs/common';
import { ServiceCatalogService } from './service-catalog.service';

@Controller('v1/service-catalog')
export class ServiceCatalogController {
  constructor(private readonly service: ServiceCatalogService) {}

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

  @Get('services')
  list(@Query('q') q?: string) {
    return this.service.list(q);
  }

  @Get('query')
  query(@Query('q') q?: string) {
    return this.service.query(q);
  }
}
