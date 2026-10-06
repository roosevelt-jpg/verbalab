import { Module } from '@nestjs/common';
import { SlackConnectorController } from './slack.controller';
import { SlackConnectorService } from './slack.service';
import { PlatformConnectorsController } from './platform-connectors.controller';
import { PlatformConnectorsService } from './platform-connectors.service';
import { TranslateModule } from '../translate/translate.module';
import { IdentityModule } from '../identity/identity.module';
import { AuditCoreModule } from '../audit/audit-core.module';

@Module({
  imports: [TranslateModule, IdentityModule, AuditCoreModule],
  controllers: [SlackConnectorController, PlatformConnectorsController],
  providers: [SlackConnectorService, PlatformConnectorsService],
  exports: [SlackConnectorService, PlatformConnectorsService],
})
export class ConnectorsModule {}
