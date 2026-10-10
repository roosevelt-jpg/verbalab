import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AgentOperatingSystemModule } from '../agent-operating-system.module';
import { AGENT_OPERATING_SYSTEM_CATALOG_PORT } from './ports';
import { NestAgentOperatingSystemCatalogAdapter } from './nest-agent-operating-system.adapter';
import { AGENT_OPERATING_SYSTEM_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, AgentOperatingSystemModule],
  providers: [
    NestAgentOperatingSystemCatalogAdapter,
    { provide: AGENT_OPERATING_SYSTEM_CATALOG_PORT, useExisting: NestAgentOperatingSystemCatalogAdapter },
    ...AGENT_OPERATING_SYSTEM_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class AgentOperatingSystemApplicationModule {}
