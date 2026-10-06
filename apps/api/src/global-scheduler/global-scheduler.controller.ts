import { Controller, Get, Query } from '@nestjs/common';
import { GlobalSchedulerService } from './global-scheduler.service';

@Controller('v1/global-scheduler')
export class GlobalSchedulerController {
  constructor(private readonly service: GlobalSchedulerService) {}

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

  @Get('schedules')
  list(@Query('q') q?: string) {
    return this.service.list(q);
  }

  @Get('query')
  query(@Query('q') q?: string) {
    return this.service.query(q);
  }
}
