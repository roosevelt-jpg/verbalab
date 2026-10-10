import { Module } from '@nestjs/common';
import { ReasoningFabricController } from './reasoning-fabric.controller';
import { ReasoningFabricService } from './reasoning-fabric.service';
import { UsageModule } from '../usage/usage.module';
import { IdentityModule } from '../identity/identity.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ReasoningRuntimeModule } from '../reasoning-runtime/reasoning-runtime.module';
import { IntelligentCacheModule } from '../intelligent-cache/intelligent-cache.module';
import { EventFabricModule } from '../event-fabric/event-fabric.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';

@Module({
  imports: [
    UsageModule,
    IdentityModule,
    PrismaModule,
    ReasoningRuntimeModule,
    IntelligentCacheModule,
    EventFabricModule,
    ApiKeysModule,
  ],
  controllers: [ReasoningFabricController],
  providers: [ReasoningFabricService, TranslateAuthGuard],
  exports: [ReasoningFabricService],
})
export class ReasoningFabricModule {}
