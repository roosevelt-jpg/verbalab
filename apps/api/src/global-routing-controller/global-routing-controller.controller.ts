import { Controller, Get, Query } from '@nestjs/common';
import { GlobalRoutingControllerService } from './global-routing-controller.service';

@Controller('v1/global-routing-controller')
export class GlobalRoutingControllerController {
  constructor(private readonly service: GlobalRoutingControllerService) {}

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

  @Get('query')
  query(@Query('q') q?: string) {
    return this.service.query(q);
  }
}
