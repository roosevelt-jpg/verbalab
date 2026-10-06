import { Module } from '@nestjs/common';
import { MlopsLlmopsCloudController } from './mlops-llmops-cloud.controller';
import { MlopsLlmopsCloudService } from './mlops-llmops-cloud.service';
import { UsageModule } from '../usage/usage.module';
import { IdentityModule } from '../identity/identity.module';

@Module({
  imports: [UsageModule, IdentityModule],
  controllers: [MlopsLlmopsCloudController],
  providers: [MlopsLlmopsCloudService],
  exports: [MlopsLlmopsCloudService],
})
export class MlopsLlmopsCloudModule {}
