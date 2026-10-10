import { Module } from '@nestjs/common';
import { IntelligentCacheController } from './intelligent-cache.controller';
import { IntelligentCacheService } from './intelligent-cache.service';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { IdentityModule } from '../identity/identity.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';

@Module({
  imports: [ApiKeysModule, IdentityModule, PrismaModule, AuditCoreModule],
  controllers: [IntelligentCacheController],
  providers: [IntelligentCacheService, TranslateAuthGuard],
  exports: [IntelligentCacheService],
})
export class IntelligentCacheModule {}
