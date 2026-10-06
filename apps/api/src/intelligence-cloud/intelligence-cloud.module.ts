import { Module } from '@nestjs/common';
import { IntelligenceCloudController } from './intelligence-cloud.controller';
import { IntelligenceCloudService } from './intelligence-cloud.service';
import { UsageModule } from '../usage/usage.module';
import { IdentityModule } from '../identity/identity.module';

@Module({
  imports: [UsageModule, IdentityModule],
  controllers: [IntelligenceCloudController],
  providers: [IntelligenceCloudService],
  exports: [IntelligenceCloudService],
})
export class IntelligenceCloudModule {}
