import { Module } from '@nestjs/common';
import { AfricanIntelligenceCloudController } from './african-intelligence-cloud.controller';
import { AfricanIntelligenceCloudService } from './african-intelligence-cloud.service';
import { UsageModule } from '../usage/usage.module';
import { IdentityModule } from '../identity/identity.module';

@Module({
  imports: [UsageModule, IdentityModule],
  controllers: [AfricanIntelligenceCloudController],
  providers: [AfricanIntelligenceCloudService],
  exports: [AfricanIntelligenceCloudService],
})
export class AfricanIntelligenceCloudModule {}
