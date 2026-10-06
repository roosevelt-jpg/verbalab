import { Module, forwardRef } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { LocalStorageService } from './local-storage.service';
import { DocumentCodecService } from './document-codec.service';
import { TranslateModule } from '../translate/translate.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { IdentityModule } from '../identity/identity.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { JobsModule } from '../jobs/jobs.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';

@Module({
  imports: [
    TranslateModule,
    ApiKeysModule,
    IdentityModule,
    AuditCoreModule,
    forwardRef(() => JobsModule),
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService, LocalStorageService, DocumentCodecService, TranslateAuthGuard],
  exports: [DocumentsService, LocalStorageService, DocumentCodecService],
})
export class DocumentsModule {}
