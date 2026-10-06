import { Controller, Get, UseGuards } from '@nestjs/common';
import { GatewayCloudService } from './gateway-cloud.service';
import { ClerkAuthGuard } from '../common/guards/clerk-auth.guard';

@Controller('v1/gateway')
export class GatewayCloudController {
  constructor(private readonly gatewayCloud: GatewayCloudService) {}

  @Get('providers')
  providers {
    return this.gatewayCloud.providers;
  }

  @Get('overview')
  @UseGuards(ClerkAuthGuard)
  overview {
    return this.gatewayCloud.overview;
  }
}
