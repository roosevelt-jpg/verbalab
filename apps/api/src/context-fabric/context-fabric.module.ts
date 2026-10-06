import { Module } from '@nestjs/common';
import { ContextFabricController } from './context-fabric.controller';
import { ContextFabricService } from './context-fabric.service';
import { UsageModule } from '../usage/usage.module';
import { IdentityModule } from '../identity/identity.module';
import { ContextRuntimeModule } from '../context-runtime/context-runtime.module';
import { EventFabricModule } from '../event-fabric/event-fabric.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';

@Module({
  imports: [
    UsageModule,
    IdentityModule,
    ContextRuntimeModule,
    EventFabricModule,
    ApiKeysModule,
  ],
  controllers: [ContextFabricController],
  providers: [ContextFabricService, TranslateAuthGuard],
  exports: [ContextFabricService],
})
export class ContextFabricModule {}
