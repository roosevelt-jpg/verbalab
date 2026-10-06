import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AiSafetyPlatformService } from './ai-safety-platform.service';

@Controller('v1/ai-safety-platform')
export class AiSafetyPlatformController {
  constructor(private readonly service: AiSafetyPlatformService) {}

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

  @Get('detections')
  detections(@Query('q') q?: string) {
    return this.service.detections(q);
  }

  @Get('query')
  query(@Query('q') q?: string) {
    return this.service.query(q);
  }

  @Get('check')
  check(@Query('id') id?: string) {
    return this.service.check(id);
  }

  @Post('evaluate')
  evaluate(@Body() body: { action?: string; detectionId?: string }) {
    return this.service.evaluate(body ?? {});
  }

  @Get('evaluate')
  evaluateGet(@Query('action') action?: string, @Query('id') id?: string) {
    return this.service.evaluate({ action, detectionId: id });
  }
}
