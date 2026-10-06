import { Module } from '@nestjs/common';
import { GlossaryController } from './glossary.controller';
import { GlossaryService } from './glossary.service';
import { IdentityModule } from '../identity/identity.module';
import { AuditCoreModule } from '../audit/audit-core.module';

@Module({
  imports: [IdentityModule, AuditCoreModule],
  controllers: [GlossaryController],
  providers: [GlossaryService],
  exports: [GlossaryService],
})
export class GlossaryModule {}
