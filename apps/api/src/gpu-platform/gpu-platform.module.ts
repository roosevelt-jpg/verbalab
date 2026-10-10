import { Module } from '@nestjs/common';
import { GpuPlatformController } from './gpu-platform.controller';
import { GpuPlatformService } from './gpu-platform.service';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { IdentityModule } from '../identity/identity.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';

@Module({
  imports: [ApiKeysModule, IdentityModule, PrismaModule, AuditCoreModule],
  controllers: [GpuPlatformController],
  providers: [GpuPlatformService, TranslateAuthGuard],
  exports: [GpuPlatformService],
})
export class GpuPlatformModule {}
