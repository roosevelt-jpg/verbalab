import { Module } from '@nestjs/common';
import { MemoryRuntimeController } from './memory-runtime.controller';
import { MemoryRuntimeService } from './memory-runtime.service';
import { MemoryCloudModule } from '../memory-cloud/memory-cloud.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { IdentityModule } from '../identity/identity.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';

@Module({
  imports: [
    MemoryCloudModule,
    ApiKeysModule,
    IdentityModule,
    PrismaModule,
    AuditCoreModule,
  ],
  controllers: [MemoryRuntimeController],
  providers: [MemoryRuntimeService, TranslateAuthGuard],
  exports: [MemoryRuntimeService],
})
export class MemoryRuntimeModule {}
