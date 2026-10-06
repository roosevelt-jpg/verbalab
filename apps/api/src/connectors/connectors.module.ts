import { Module } from '@nestjs/common';
import { SlackConnectorController } from './slack.controller';
import { SlackConnectorService } from './slack.service';
import { TranslateModule } from '../translate/translate.module';
import { IdentityModule } from '../identity/identity.module';
import { AuditCoreModule } from '../audit/audit-core.module';

@Module({
  imports: [TranslateModule, IdentityModule, AuditCoreModule],
  controllers: [SlackConnectorController],
  providers: [SlackConnectorService],
  exports: [SlackConnectorService],
})
export class ConnectorsModule {}
