import { Module } from '@nestjs/common';
import { AiEngineeringStandardsController } from './ai-engineering-standards.controller';
import { AiEngineeringStandardsService } from './ai-engineering-standards.service';
import { AiGovernancePlatformModule } from '../ai-governance-platform/ai-governance-platform.module';
import { AiSafetyPlatformModule } from '../ai-safety-platform/ai-safety-platform.module';
import { EvaluationPlatformModule } from '../evaluation-platform/evaluation-platform.module';
import { PromptopsPlatformModule } from '../promptops-platform/promptops-platform.module';
import { SecretsCertificatePlatformModule } from '../secrets-certificate-platform/secrets-certificate-platform.module';

@Module({
  imports: [AiGovernancePlatformModule, AiSafetyPlatformModule, EvaluationPlatformModule, PromptopsPlatformModule, SecretsCertificatePlatformModule],
  controllers: [AiEngineeringStandardsController],
  providers: [AiEngineeringStandardsService],
  exports: [AiEngineeringStandardsService],
})
export class AiEngineeringStandardsModule {}
