import { Controller, Get, Query } from '@nestjs/common';
import { IdentityFederationService } from './identity-federation.service';

@Controller('v1/identity-federation')
export class IdentityFederationController {
  constructor(private readonly service: IdentityFederationService) {}

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

  @Get('federation')
  list(@Query('q') q?: string) {
    return this.service.list(q);
  }

  @Get('query')
  query(@Query('q') q?: string) {
    return this.service.query(q);
  }
}
