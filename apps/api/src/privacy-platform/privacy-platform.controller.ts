import { Controller, Get, Post, Query } from '@nestjs/common';
import { PrivacyPlatformService } from './privacy-platform.service';

@Controller('v1/privacy-platform')
export class PrivacyPlatformController {
  constructor(private readonly service: PrivacyPlatformService) {}

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

  @Get('assets')
  assets(@Query('q') q?: string) {
    return this.service.assets(q);
  }

  @Get('query')
  query(@Query('q') q?: string) {
    return this.service.query(q);
  }

  @Get('check')
  check(@Query('id') id?: string) {
    if (!id) return this.service.assets;
    return this.service.checkConsent(id);
  }

  @Get('consent-check')
  consentCheck(@Query('id') id: string) {
    return this.service.checkConsent(id);
  }

  @Post('release')
  release(@Query('id') id: string) {
    return this.service.release(id);
  }

  @Get('release')
  releaseGet(@Query('id') id: string) {
    return this.service.release(id);
  }
}
