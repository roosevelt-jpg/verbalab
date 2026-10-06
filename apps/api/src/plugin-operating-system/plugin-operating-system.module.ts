import { Module } from '@nestjs/common';
import { PluginOperatingSystemController } from './plugin-operating-system.controller';
import { PluginOperatingSystemService } from './plugin-operating-system.service';
import { PluginRuntimeModule } from '../plugin-runtime/plugin-runtime.module';
import { PluginMarketplaceModule } from '../plugin-marketplace/plugin-marketplace.module';
import { AiKernelModule } from '../ai-kernel/ai-kernel.module';
import { PolicyRuntimeModule } from '../policy-runtime/policy-runtime.module';

@Module({
  imports: [PluginRuntimeModule, PluginMarketplaceModule, AiKernelModule, PolicyRuntimeModule],
  controllers: [PluginOperatingSystemController],
  providers: [PluginOperatingSystemService],
  exports: [PluginOperatingSystemService],
})
export class PluginOperatingSystemModule {}
