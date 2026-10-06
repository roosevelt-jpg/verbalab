import { Module } from '@nestjs/common';
import { TaxonomyPlatformController } from './taxonomy-platform.controller';
import { TaxonomyPlatformService } from './taxonomy-platform.service';
import { IdentityModule } from '../identity/identity.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';

@Module({
  imports: [IdentityModule, PrismaModule, ApiKeysModule, AuditCoreModule],
  controllers: [TaxonomyPlatformController],
  providers: [TaxonomyPlatformService, TranslateAuthGuard],
  exports: [TaxonomyPlatformService],
})
export class TaxonomyPlatformModule {}
