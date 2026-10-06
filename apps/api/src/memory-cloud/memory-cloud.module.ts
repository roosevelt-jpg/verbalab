import { Module } from '@nestjs/common';
import { MemoryCloudController } from './memory-cloud.controller';
import { MemoryCloudService } from './memory-cloud.service';
import { IdentityModule } from '../identity/identity.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';

@Module({
  imports: [IdentityModule, PrismaModule, ApiKeysModule, AuditCoreModule],
  controllers: [MemoryCloudController],
  providers: [MemoryCloudService, TranslateAuthGuard],
  exports: [MemoryCloudService],
})
export class MemoryCloudModule {}
