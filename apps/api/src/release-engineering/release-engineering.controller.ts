import { Controller, Get, Query } from '@nestjs/common';
import { ReleaseEngineeringService } from './release-engineering.service';

@Controller('v1/release-engineering')
export class ReleaseEngineeringController {
  constructor(private readonly service: ReleaseEngineeringService) {}

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

  @Get('releases')
  list(@Query('q') q?: string) {
    return this.service.list(q);
  }

  @Get('query')
  query(@Query('q') q?: string) {
    return this.service.query(q);
  }
}
