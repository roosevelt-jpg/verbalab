import { Module } from '@nestjs/common';
import { AiSafetyPlatformController } from './ai-safety-platform.controller';
import { AiSafetyPlatformService } from './ai-safety-platform.service';
import { PolicyRuntimeModule } from '../policy-runtime/policy-runtime.module';

@Module({
  imports: [PolicyRuntimeModule],
  controllers: [AiSafetyPlatformController],
  providers: [AiSafetyPlatformService],
  exports: [AiSafetyPlatformService],
})
export class AiSafetyPlatformModule {}
