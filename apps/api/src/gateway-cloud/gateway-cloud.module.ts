import { Module } from '@nestjs/common';
import { GatewayCloudController } from './gateway-cloud.controller';
import { GatewayCloudService } from './gateway-cloud.service';
import { ModelsModule } from '../models/models.module';
import { HealthModule } from '../health/health.module';
import { IdentityModule } from '../identity/identity.module';

@Module({
  imports: [ModelsModule, HealthModule, IdentityModule],
  controllers: [GatewayCloudController],
  providers: [GatewayCloudService],
  exports: [GatewayCloudService],
})
export class GatewayCloudModule {}
