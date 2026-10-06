import { Module } from '@nestjs/common';
import { AiKernelController } from './ai-kernel.controller';
import { AiKernelService } from './ai-kernel.service';
import { UsageModule } from '../usage/usage.module';
import { IdentityModule } from '../identity/identity.module';

@Module({
  imports: [UsageModule, IdentityModule],
  controllers: [AiKernelController],
  providers: [AiKernelService],
  exports: [AiKernelService],
})
export class AiKernelModule {}
