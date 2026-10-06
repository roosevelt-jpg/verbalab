import { Controller, Get, Query } from '@nestjs/common';
import { ApiEngineeringStandardsService } from './api-engineering-standards.service';

@Controller('v1/api-engineering-standards')
export class ApiEngineeringStandardsController {
  constructor(private readonly service: ApiEngineeringStandardsService) {}

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

  @Get('routes')
  list(@Query('q') q?: string) {
    return this.service.list(q);
  }

  @Get('route')
  route(@Query('capability') capability?: string) {
    return this.service.route(capability);
  }

  @Get('execute')
  execute(@Query('capability') capability?: string) {
    return this.service.execute(capability);
  }

  @Get('query')
  query(@Query('q') q?: string) {
    return this.service.query(q);
  }
}
