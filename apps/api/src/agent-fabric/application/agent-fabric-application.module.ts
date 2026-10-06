import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AgentFabricModule } from '../agent-fabric.module';
import { AGENT_FABRIC_CATALOG_PORT } from './ports';
import { NestAgentFabricCatalogAdapter } from './nest-agent-fabric-catalog.adapter';
import { AGENT_FABRIC_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, AgentFabricModule],
  providers: [
    NestAgentFabricCatalogAdapter,
    {
      provide: AGENT_FABRIC_CATALOG_PORT,
      useExisting: NestAgentFabricCatalogAdapter,
    },
    ...AGENT_FABRIC_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class AgentFabricApplicationModule {}
