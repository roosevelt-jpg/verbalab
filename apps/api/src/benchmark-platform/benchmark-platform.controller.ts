import { Controller, Get, Query } from '@nestjs/common';
import { BenchmarkPlatformService } from './benchmark-platform.service';

@Controller('v1/benchmark-platform')
export class BenchmarkPlatformController {
  constructor(private readonly service: BenchmarkPlatformService) {}

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

  @Get('leaderboard')
  leaderboard(@Query('q') q?: string) {
    return this.service.leaderboard(q);
  }

  @Get('query')
  query(@Query('q') q?: string) {
    return this.service.query(q);
  }
}
