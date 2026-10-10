import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AgentMarketplaceModule } from '../agent-marketplace.module';
import { AGENT_MARKETPLACE_CATALOG_PORT } from './ports';
import { NestAgentMarketplaceCatalogAdapter } from './nest-agent-marketplace-catalog.adapter';
import { AGENT_MARKETPLACE_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, AgentMarketplaceModule],
  providers: [
    NestAgentMarketplaceCatalogAdapter,
    {
      provide: AGENT_MARKETPLACE_CATALOG_PORT,
      useExisting: NestAgentMarketplaceCatalogAdapter,
    },
    ...AGENT_MARKETPLACE_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class AgentMarketplaceApplicationModule {}
