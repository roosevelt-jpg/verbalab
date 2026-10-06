import { Controller, Get, Query } from '@nestjs/common';
import { FinopsPlatformService } from './finops-platform.service';

@Controller('v1/finops-platform')
export class FinopsPlatformController {
  constructor(private readonly service: FinopsPlatformService) {}

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

  @Get('costs')
  costs(@Query('q') q?: string) {
    return this.service.list(q);
  }

  @Get('budgets')
  budgets {
    return this.service.budgets;
  }

  @Get('alerts')
  alerts {
    return this.service.alerts;
  }

  @Get('query')
  query(@Query('q') q?: string) {
    return this.service.query(q);
  }
}
