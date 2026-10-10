import { Module } from '@nestjs/common';
import { ContextRuntimeController } from './context-runtime.controller';
import { ContextRuntimeService } from './context-runtime.service';
import { ContextEngineModule } from '../context-engine/context-engine.module';
import { IntelligentCacheModule } from '../intelligent-cache/intelligent-cache.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { IdentityModule } from '../identity/identity.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';

@Module({
  imports: [
    ContextEngineModule,
    IntelligentCacheModule,
    ApiKeysModule,
    IdentityModule,
    PrismaModule,
    AuditCoreModule,
  ],
  controllers: [ContextRuntimeController],
  providers: [ContextRuntimeService, TranslateAuthGuard],
  exports: [ContextRuntimeService],
})
export class ContextRuntimeModule {}
