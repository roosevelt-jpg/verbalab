import { Module } from '@nestjs/common';
import { ModelServingController } from './model-serving.controller';
import { ModelServingService } from './model-serving.service';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { IdentityModule } from '../identity/identity.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';

@Module({
  imports: [ApiKeysModule, IdentityModule, PrismaModule, AuditCoreModule],
  controllers: [ModelServingController],
  providers: [ModelServingService, TranslateAuthGuard],
  exports: [ModelServingService],
})
export class ModelServingModule {}
