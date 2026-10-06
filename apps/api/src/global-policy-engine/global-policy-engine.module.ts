import { Module } from '@nestjs/common';
import { GlobalPolicyEngineController } from './global-policy-engine.controller';
import { GlobalPolicyEngineService } from './global-policy-engine.service';

@Module({
  controllers: [GlobalPolicyEngineController],
  providers: [GlobalPolicyEngineService],
  exports: [GlobalPolicyEngineService],
})
export class GlobalPolicyEngineModule {}
