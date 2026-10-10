import { Module } from '@nestjs/common';
import { MemoryFabricController } from './memory-fabric.controller';
import { MemoryFabricService } from './memory-fabric.service';
import { UsageModule } from '../usage/usage.module';
import { IdentityModule } from '../identity/identity.module';
import { PrismaModule } from '../prisma/prisma.module';
import { MemoryRuntimeModule } from '../memory-runtime/memory-runtime.module';
import { MemoryCloudModule } from '../memory-cloud/memory-cloud.module';
import { IntelligentCacheModule } from '../intelligent-cache/intelligent-cache.module';
import { EventFabricModule } from '../event-fabric/event-fabric.module';
import { PolicyFabricModule } from '../policy-fabric/policy-fabric.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';

@Module({
  imports: [
    UsageModule,
    IdentityModule,
    PrismaModule,
    MemoryRuntimeModule,
    MemoryCloudModule,
    IntelligentCacheModule,
    EventFabricModule,
    PolicyFabricModule,
    ApiKeysModule,
  ],
  controllers: [MemoryFabricController],
  providers: [MemoryFabricService, TranslateAuthGuard],
  exports: [MemoryFabricService],
})
export class MemoryFabricModule {}
