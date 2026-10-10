import { Controller, Get, Query } from '@nestjs/common';
import { SecretsCertificatePlatformService } from './secrets-certificate-platform.service';

@Controller('v1/secrets-certificate-platform')
export class SecretsCertificatePlatformController {
  constructor(private readonly service: SecretsCertificatePlatformService) {}

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

  @Get('secrets')
  list(@Query('q') q?: string) {
    return this.service.list(q);
  }

  @Get('metadata')
  metadata(@Query('q') q?: string) {
    return this.service.metadata(q);
  }

  @Get('audit')
  audit() {
    return this.service.audit();
  }

  @Get('query')
  query(@Query('q') q?: string) {
    return this.service.query(q);
  }
}
