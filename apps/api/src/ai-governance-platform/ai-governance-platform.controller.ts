import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { AiGovernancePlatformService } from './ai-governance-platform.service';

@Controller('v1/ai-governance-platform')
export class AiGovernancePlatformController {
  constructor(private readonly service: AiGovernancePlatformService) {}

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

  @Get('approvals')
  approvals(@Query('q') q?: string) {
    return this.service.list(q);
  }

  @Get('query')
  query(@Query('q') q?: string) {
    return this.service.query(q);
  }

  @Get('status/:id')
  status(@Param('id') id: string) {
    return this.service.status(id);
  }

  @Get('check')
  check(@Query('id') id?: string) {
    if (!id) return this.service.list;
    return this.service.status(id);
  }

  @Post('approvals/:id/approve')
  approve(@Param('id') id: string) {
    return this.service.approve(id);
  }

  @Post('approvals/:id/reject')
  reject(@Param('id') id: string) {
    return this.service.reject(id);
  }
}
